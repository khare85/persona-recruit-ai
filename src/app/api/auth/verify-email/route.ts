import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import admin from 'firebase-admin';

const resendEmailSchema = z.object({
  email: z.string().email('Invalid email address')
});

/**
 * POST /api/auth/verify-email - Resend verification email using Firebase Auth
 */
export const POST = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const validation = resendEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    apiLogger.info('Resend verification email requested', {
      email,
      userAgent: req.headers.get('user-agent'),
      ip: req.ip
    });

    try {
      // Get user from Firebase Auth
      const userRecord = await admin.auth().getUserByEmail(email);
      
      if (userRecord.emailVerified) {
        return NextResponse.json(
          { error: 'Email is already verified' },
          { status: 400 }
        );
      }

      // Generate email verification link using Firebase Auth
      const verificationLink = await admin.auth().generateEmailVerificationLink(email);
      
      // Send verification email using email service
      try {
        const { emailService } = await import('@/services/email.service');
        await emailService.sendVerificationEmail(
          email,
          userRecord.displayName || 'User',
          verificationLink
        );
        
        apiLogger.info('Verification email resent successfully', {
          userId: userRecord.uid,
          email: email
        });
      } catch (emailError) {
        apiLogger.error('Failed to send verification email', {
          userId: userRecord.uid,
          email: email,
          error: String(emailError)
        });
        
        return NextResponse.json(
          { error: 'Failed to send verification email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully! Please check your inbox.',
        data: {
          email: email
        }
      });

    } catch (firebaseError: any) {
      if (firebaseError.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      apiLogger.error('Firebase Auth error in email verification', {
        email,
        error: String(firebaseError)
      });
      
      return NextResponse.json(
        { error: 'Failed to process verification request' },
        { status: 500 }
      );
    }

  } catch (error) {
    apiLogger.error('Email verification API error', {
      error: String(error)
    });
    return handleApiError(error);
  }
});

/**
 * GET /api/auth/verify-email - Legacy endpoint for backward compatibility
 * Note: Firebase Auth handles email verification automatically through the client SDK
 */
export const GET = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  return NextResponse.json({
    error: 'This endpoint is deprecated. Email verification is now handled by Firebase Auth client SDK.',
    message: 'Please use the POST method to resend verification emails.'
  }, { status: 410 });
});