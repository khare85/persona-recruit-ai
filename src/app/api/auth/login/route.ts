
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { databaseService } from '@/services/database.service';
import { apiLogger } from '@/lib/logger';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user by email in database
    const user = await databaseService.getUserByEmail(email);
    
    if (!user || !user.passwordHash) {
      apiLogger.warn('Login attempt with invalid email or user has no password', { email });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      apiLogger.warn('Login attempt with invalid password', { email, userId: user.id });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified (if email verification is required)
    // Temporarily disabled for launch - TODO: Re-enable after email verification flow is tested
    // if (!user.emailVerified) {
    //   return NextResponse.json(
    //     { error: 'Please verify your email address before logging in' },
    //     { status: 403 }
    //   );
    // }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      apiLogger.error('JWT_SECRET is not set in environment variables. This is insecure for production.');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Server configuration error: JWT_SECRET is missing.');
      }
    }
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        status: user.status
      },
      jwtSecret || 'fallback-super-secret-key-for-development-only-32-chars',
      { expiresIn: '7d' }
    );

    // Update last login timestamp
    await databaseService.updateUserLastLogin(user.id);

    // Create response with user data (excluding password)
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: new Date().toISOString()
    };

    apiLogger.info('User logged in successfully', { userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Login successful'
    });

    // Set HTTP-only cookie for the token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    apiLogger.error('Login API Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
