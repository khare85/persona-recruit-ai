import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

// Mock user database (replace with real database)
const mockUsers = [
  {
    id: '1',
    email: 'admin@techcorp.com',
    password: '$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0kq65w1RqG', // password: "admin123"
    fullName: 'Admin User',
    role: 'admin',
    companyId: 'techcorp',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'recruiter@techcorp.com',
    password: '$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0kq65w1RqG', // password: "admin123"
    fullName: 'Jane Recruiter',
    role: 'recruiter',
    companyId: 'techcorp',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    email: 'candidate@example.com',
    password: '$2a$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj0kq65w1RqG', // password: "admin123"
    fullName: 'John Candidate',
    role: 'candidate',
    companyId: null,
    createdAt: new Date().toISOString()
  }
];

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

    // Find user by email
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        companyId: user.companyId
      },
      env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
      { expiresIn: '7d' }
    );

    // Create response with user data (excluding password)
    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      companyId: user.companyId,
      createdAt: user.createdAt
    };

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
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}