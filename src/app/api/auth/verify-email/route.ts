import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { auth as adminAuth } from '@/lib/firebase/server';
import { databaseService } from '@/services/database.service';
import { emailService } from '@/services/email.service';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const resendVerificationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

/**
 * POST /api/auth/verify-email - Verify email address
 */
export const POST = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const validation = verifyEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    // Get user by token (assuming token is the user ID for now)
    const user = await databaseService.getUser(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Update user's email verification status
    await databaseService.updateUser(token, { emailVerified: true });

    // Update Firebase Auth user
    await adminAuth.updateUser(token, { emailVerified: true });

    apiLogger.info('Email verification successful', { userId: token, email: user.email });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      data: { userId: token }
    });

  } catch (error) {
    apiLogger.error('Email verification failed', { error: String(error) });
    return handleApiError(error);
  }
});

/**
 * PUT /api/auth/verify-email - Resend verification email
 */
export const PUT = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const validation = resendVerificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Get user by email
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      const user = await databaseService.getUser(userRecord.uid);

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      if (user.emailVerified) {
        return NextResponse.json(
          { error: 'Email is already verified' },
          { status: 400 }
        );
      }

      // Send verification email
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${userRecord.uid}`;
      await emailService.sendVerificationEmail(email, user.firstName, verificationUrl);

      apiLogger.info('Verification email resent', { userId: userRecord.uid, email });

      return NextResponse.json({
        success: true,
        message: 'Verification email sent',
        data: { email }
      });

    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'No user found with this email' },
          { status: 404 }
        );
      }
      throw error;
    }

  } catch (error) {
    apiLogger.error('Failed to resend verification email', { error: String(error) });
    return handleApiError(error);
  }
});

/**
 * GET /api/auth/verify-email - Check verification status
 */
export const GET = withRateLimit('standard', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      const user = await databaseService.getUser(userRecord.uid);

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          email,
          emailVerified: user.emailVerified,
          userId: userRecord.uid
        }
      });

    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'No user found with this email' },
          { status: 404 }
        );
      }
      throw error;
    }

  } catch (error) {
    apiLogger.error('Failed to check verification status', { error: String(error) });
    return handleApiError(error);
  }
});