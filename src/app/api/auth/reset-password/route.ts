import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { authLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';
import bcrypt from 'bcryptjs';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
});

/**
 * Send password change confirmation email
 */
async function sendPasswordChangeConfirmation(email: string, firstName: string): Promise<void> {
  // In development, just log the confirmation
  if (process.env.NODE_ENV === 'development') {
    console.log('\n✅ PASSWORD CHANGED CONFIRMATION');
    console.log('To:', email);
    console.log('Password successfully reset\n');
    return;
  }

  // TODO: Implement actual email sending
  authLogger.info('Would send password change confirmation email', { to: email });
}

/**
 * POST /api/auth/reset-password - Reset user password with token
 */
export const POST = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    authLogger.info('Password reset attempt', { token: token.substring(0, 8) + '...' });

    // Find user with this reset token
    const user = await databaseService.getUserByResetToken(token);

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      authLogger.warn('Invalid reset token used', { token: token.substring(0, 8) + '...' });
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

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await databaseService.updateUser(user.id, {
      passwordHash: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      updatedAt: new Date().toISOString()
    } as any);

    // Send confirmation email
    try {
      await sendPasswordChangeConfirmation(user.email, user.firstName);
    } catch (emailError) {
      authLogger.error('Failed to send password change confirmation', {
        userId: user.id,
        error: String(emailError)
      });
      // Don't fail the request if email fails
    }

    authLogger.info('Password reset completed successfully', { 
      userId: user.id,
      email: user.email 
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully reset. You can now log in with your new password.'
    });

  } catch (error) {
    authLogger.error('Password reset failed', { error: String(error) });
    return handleApiError(error);
  }
});