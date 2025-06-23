import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { authLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';
import crypto from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email: string, resetToken: string, firstName: string): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
  
  // In development, just log the reset URL
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🔐 PASSWORD RESET EMAIL');
    console.log('To:', email);
    console.log('Reset URL:', resetUrl);
    console.log('Token expires in 1 hour\n');
    return;
  }

  // TODO: Implement actual email sending using your preferred service
  authLogger.info('Would send password reset email', { 
    to: email, 
    resetUrl 
  });
}

/**
 * POST /api/auth/forgot-password - Send password reset email
 */
export const POST = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid email address',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    authLogger.info('Password reset requested', { email });

    // Check if user exists
    const user = await databaseService.getUserByEmail(email);
    
    // Always return success to prevent email enumeration attacks
    // but only send email if user actually exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to database
      await databaseService.updateUser(user.id, {
        resetToken,
        resetTokenExpiry: resetTokenExpiry.toISOString()
      } as any);

      // Send reset email
      await sendPasswordResetEmail(email, resetToken, user.firstName);

      authLogger.info('Password reset email sent', { 
        email, 
        userId: user.id,
        tokenExpiry: resetTokenExpiry.toISOString()
      });
    } else {
      authLogger.warn('Password reset requested for non-existent email', { email });
    }

    // Always return success response
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we\'ve sent a password reset link.'
    });

  } catch (error) {
    authLogger.error('Password reset request failed', { error: String(error) });
    return handleApiError(error);
  }
});

/**
 * GET /api/auth/forgot-password?token=xxx - Validate reset token
 */
export const GET = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    authLogger.info('Validating reset token', { token: token.substring(0, 8) + '...' });

    // Find user with this reset token
    const user = await databaseService.getUserByResetToken(token);

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      authLogger.warn('Invalid reset token provided', { token: token.substring(0, 8) + '...' });
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    const now = new Date();
    const expiry = new Date(user.resetTokenExpiry);
    
    if (now > expiry) {
      authLogger.warn('Expired reset token used', { 
        userId: user.id,
        expiry: user.resetTokenExpiry
      });
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    authLogger.info('Reset token validated successfully', { userId: user.id });

    return NextResponse.json({
      valid: true,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim()
    });

  } catch (error) {
    authLogger.error('Reset token validation failed', { error: String(error) });
    return handleApiError(error);
  }
});