import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';
import jwt from 'jsonwebtoken';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

/**
 * POST /api/auth/verify-email - Verify user email address
 */
export const POST = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const validation = verifyEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid verification data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    apiLogger.info('Email verification requested', {
      token: token.substring(0, 20) + '...',
      userAgent: req.headers.get('user-agent'),
      ip: req.ip
    });

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      apiLogger.error('JWT_SECRET is not set in environment variables');
      throw new Error('Server configuration error: JWT_SECRET is not configured. Please add JWT_SECRET to your environment variables.');
    }
    
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      apiLogger.warn('Invalid verification token', {
        token: token.substring(0, 20) + '...',
        error: String(jwtError)
      });
      
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const { userId, email } = decoded;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Invalid verification token payload' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await databaseService.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.email !== email) {
      return NextResponse.json(
        { error: 'Email mismatch in verification token' },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Update user to mark email as verified
    await databaseService.updateUser(userId, {
      emailVerified: true,
      status: 'active'
    });

    apiLogger.info('Email verified successfully', {
      userId,
      email,
      role: user.role
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now access all features.',
      data: {
        emailVerified: true,
        userId,
        email
      }
    });

  } catch (error) {
    apiLogger.error('Email verification failed', {
      error: String(error)
    });
    return handleApiError(error);
  }
});

/**
 * GET /api/auth/verify-email - Resend verification email
 */
export const GET = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    apiLogger.info('Resend verification email requested', {
      email,
      userAgent: req.headers.get('user-agent')
    });

    // Get user from database
    const user = await databaseService.getUserByEmail(email);
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

    // Generate new verification token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      apiLogger.error('JWT_SECRET is not set in environment variables');
      throw new Error('Server configuration error: JWT_SECRET is not configured. Please add JWT_SECRET to your environment variables.');
    }
    
    const verificationToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        purpose: 'email_verification'
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Send verification email
    try {
      const { emailService } = await import('@/services/email.service');
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`;
      
      await emailService.sendVerificationEmail(
        user.email,
        user.firstName,
        verificationUrl
      );
      
      apiLogger.info('Verification email resent', {
        userId: user.id,
        email: user.email
      });
    } catch (emailError) {
      apiLogger.error('Failed to resend verification email', {
        userId: user.id,
        email: user.email,
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
        email: user.email,
        tokenExpiry: '24 hours'
      }
    });

  } catch (error) {
    apiLogger.error('Failed to resend verification email', {
      error: String(error)
    });
    return handleApiError(error);
  }
});