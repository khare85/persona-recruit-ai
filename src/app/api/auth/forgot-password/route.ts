import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Mock user database - in production this would be a real database
const users = [
  {
    id: '1',
    email: 'admin@techcorp.com',
    name: 'Admin User',
    role: 'admin'
  },
  {
    id: '2',
    email: 'recruiter@techcorp.com',
    name: 'Recruiter User',
    role: 'recruiter'
  },
  {
    id: '3',
    email: 'candidate@example.com',
    name: 'Candidate User',
    role: 'candidate'
  }
];

// Mock password reset tokens - in production this would be stored in database
const resetTokens: Record<string, {
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
}> = {};

// Mock email service
const sendPasswordResetEmail = async (email: string, resetToken: string, userName: string) => {
  // In production, this would use a real email service like SendGrid, AWS SES, etc.
  console.log('Sending password reset email to:', email);
  console.log('Reset token:', resetToken);
  console.log('Reset URL:', `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return true;
};

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Always return success for security (don't reveal if email exists)
    // But only send email if user actually exists
    if (user) {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

      // Store reset token
      resetTokens[resetToken] = {
        userId: user.id,
        token: resetToken,
        expiresAt,
        used: false
      };

      // Send password reset email
      try {
        await sendPasswordResetEmail(email, resetToken, user.name);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't expose email sending failures to the client
      }
    }

    // Always return success response
    return NextResponse.json({
      message: 'If an account with that email exists, you will receive a password reset link shortly.',
      success: true
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

// GET endpoint to validate reset tokens (used by reset password page)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    const resetData = resetTokens[token];

    if (!resetData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    if (resetData.used) {
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      );
    }

    if (new Date() > resetData.expiresAt) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Find user
    const user = users.find(u => u.id === resetData.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      name: user.name
    });

  } catch (error) {
    console.error('Reset token validation error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}