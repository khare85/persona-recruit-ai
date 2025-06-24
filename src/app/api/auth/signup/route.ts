
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { apiLogger } from '@/lib/logger';

// Mock user database (in production, use real database)
const mockUsers: Array<{
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'recruiter' | 'candidate';
  companyId: string | null;
  createdAt: string;
}> = [];

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
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName,
      role,
      companyId: companyId || null,
      createdAt: new Date().toISOString()
    };

    // Add to mock database
    mockUsers.push(newUser);

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      apiLogger.error('JWT_SECRET is not set in environment variables');
      throw new Error('Server configuration error: JWT_SECRET is not configured. Please add JWT_SECRET to your environment variables.');
    }

    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        role: newUser.role,
        companyId: newUser.companyId
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Create response with user data (excluding password)
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      companyId: newUser.companyId,
      createdAt: newUser.createdAt
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
    console.error('Signup API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
