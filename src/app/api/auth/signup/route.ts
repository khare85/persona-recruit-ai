
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';


const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['recruiter', 'candidate']).default('candidate'),
  companyId: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { fullName, email, password, role, companyId } = validation.data;

    // Check if user already exists
    const existingUser = await databaseService.getUserByEmail(email);
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Parse full name into first and last name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    // Create new user in database (Firebase Auth + Firestore)
    const userId = await databaseService.createUser({
      email: email.toLowerCase(),
      firstName,
      lastName,
      role: role as 'recruiter' | 'candidate',
      status: 'active',
      emailVerified: false,
      passwordHash: password // Will be hashed in the service
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      apiLogger.error('JWT_SECRET is not set in environment variables');
      throw new Error('Server configuration error: JWT_SECRET is not configured. Please add JWT_SECRET to your environment variables.');
    }

    const token = jwt.sign(
      { 
        userId: userId, 
        email: email.toLowerCase(), 
        role: role,
        companyId: companyId || null
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Create response with user data
    const userResponse = {
      id: userId,
      email: email.toLowerCase(),
      fullName,
      firstName,
      lastName,
      role,
      companyId: companyId || null,
      createdAt: new Date().toISOString()
    };

    const response = NextResponse.json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Account created successfully'
    }, { status: 201 });

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
    apiLogger.error('Signup API Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
