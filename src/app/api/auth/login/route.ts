
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { databaseService } from '@/services/database.service';
import { apiLogger } from '@/lib/logger';
// import * as jwt from 'jsonwebtoken'; // Not needed - using Firebase Auth

// Login is handled by Firebase Auth on the client side
// This API route may not be needed if using Firebase Auth exclusively
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
    const isValidPassword = await databaseService.verifyPassword(user.passwordHash, password);
    
    if (!isValidPassword) {
      apiLogger.warn('Login attempt with invalid password', { email, userId: user.id });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      apiLogger.error('JWT_SECRET is not set in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: JWT_SECRET is not configured.' },
        { status: 500 }
      );
    }
    
    // Firebase Auth handles authentication - no JWT needed

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
      lastLoginAt: new Date().toISOString(),
      companyId: user.companyId
    };

    apiLogger.info('User logged in successfully', { userId: user.id, email: user.email, role: user.role });

    return NextResponse.json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Login successful'
    });

  } catch (error) {
    apiLogger.error('Login API Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
