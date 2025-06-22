import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Mock user database - in production this would be a real database
const users = [
  {
    id: '1',
    email: 'admin@techcorp.com',
    name: 'Admin User',
    role: 'admin',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeJe8Q4v/3/YqHV5.'  // hashed password
  },
  {
    id: '2',
    email: 'recruiter@techcorp.com',
    name: 'Recruiter User',
    role: 'recruiter',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeJe8Q4v/3/YqHV5.'
  },
  {
    id: '3',
    email: 'candidate@example.com',
    name: 'Candidate User',
    role: 'candidate',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeJe8Q4v/3/YqHV5.'
  }
];

// Mock password reset tokens - in production this would be stored in database
const resetTokens: Record<string, {
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
}> = {};

// Mock email service for confirmation
const sendPasswordChangeConfirmation = async (email: string, userName: string) => {
  // In production, this would use a real email service
  console.log('Sending password change confirmation to:', email);
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // Validate inputs
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Reset token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { 
          error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
        },
        { status: 400 }
      );
    }

    // Validate reset token
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
    const userIndex = users.findIndex(u => u.id === resetData.userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[userIndex];

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password in database
    users[userIndex] = {
      ...user,
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    };

    // Mark token as used
    resetTokens[token].used = true;

    // Send confirmation email
    try {
      await sendPasswordChangeConfirmation(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send password change confirmation:', emailError);
      // Don't fail the request if email fails
    }

    // Log security event
    console.log(`Password reset completed for user ${user.email} at ${new Date().toISOString()}`);

    return NextResponse.json({
      message: 'Password has been successfully reset',
      success: true
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}