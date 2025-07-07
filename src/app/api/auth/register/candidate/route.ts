
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { databaseService } from '@/services/database.service';
// import { emailService } from '@/services/email.service'; // Temporarily disabled for launch
// import jwt from 'jsonwebtoken'; // Not needed - using Firebase Auth

const candidateRegistrationSchema = z.object({
  firstName: z.string().min(2).max(50).transform(sanitizeString),
  lastName: z.string().min(2).max(50).transform(sanitizeString),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  phone: z.string().min(10).max(20).transform(sanitizeString).optional(),
  currentTitle: z.string().min(2).max(100).transform(sanitizeString),
  experience: z.enum(['Entry Level', '1-2 years', '3-5 years', '5-10 years', '10+ years']),
  location: z.string().min(2).max(200).transform(sanitizeString),
  skills: z.array(z.string().min(1).max(50).transform(sanitizeString)).min(1, 'Please add at least one skill').max(20),
  summary: z.string().min(50).max(2000).transform(sanitizeString),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  // Video introduction will be handled separately
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

/**
 * POST /api/auth/register/candidate - Register new candidate account
 */
export const POST = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const validation = candidateRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid registration data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const candidateData = validation.data;

    apiLogger.info('Candidate registration requested', {
      email: candidateData.email,
      firstName: candidateData.firstName,
      lastName: candidateData.lastName,
      currentTitle: candidateData.currentTitle,
      experience: candidateData.experience,
      skillsCount: candidateData.skills.length,
      userAgent: req.headers.get('user-agent'),
      ip: req.ip
    });

    // Check if email is already registered
    const existingUser = await databaseService.getUserByEmail(candidateData.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address is already registered' },
        { status: 400 }
      );
    }

    // Create user account
    const userId = await databaseService.createUser({
      email: candidateData.email,
      firstName: candidateData.firstName,
      lastName: candidateData.lastName,
      role: 'candidate',
      status: 'active',
      emailVerified: false,
      passwordHash: candidateData.password // Will be hashed in the service
    });

    // Create candidate profile
    await databaseService.createCandidateProfile({
      userId,
      currentTitle: candidateData.currentTitle,
      experience: candidateData.experience,
      location: candidateData.location,
      skills: candidateData.skills,
      summary: candidateData.summary,
      phone: candidateData.phone,
      linkedinUrl: candidateData.linkedinUrl,
      portfolioUrl: candidateData.portfolioUrl,
      profileComplete: false, // Will be true after video introduction
      availableForWork: true,
      willingToRelocate: false
    });

    // Firebase Auth handles token generation on the client side
    // The user should sign in with Firebase Auth after registration

    // Send email verification - Temporarily disabled for launch
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?uid=${userId}`;
      // await emailService.sendVerificationEmail(
      //   candidateData.email,
      //   candidateData.firstName,
      //   verificationUrl
      // );
      
      apiLogger.info('Email verification disabled for launch', {
        candidateId: userId,
        email: candidateData.email,
        verificationUrl
      });
    } catch (emailError) {
      apiLogger.warn('Email verification disabled', {
        candidateId: userId,
        email: candidateData.email,
        error: String(emailError)
      });
      // Continue with registration even if email fails
    }

    apiLogger.info('Candidate registered successfully', {
      candidateId: userId,
      email: candidateData.email,
      role: 'candidate'
    });

    return NextResponse.json({
      success: true,
      data: {
        candidate: {
          id: userId,
          email: candidateData.email,
          firstName: candidateData.firstName,
          lastName: candidateData.lastName,
          currentTitle: candidateData.currentTitle,
          role: 'candidate',
          profileComplete: false
        },
        // Client will use Firebase Auth to get ID token
        nextStep: 'video_introduction'
      },
      message: 'Registration successful! Please complete your video introduction to finish setting up your profile.'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * GET /api/auth/register/candidate - Check if email is available
 */
export const GET = withRateLimit('standard', async (req: NextRequest): Promise<NextResponse> => {
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

    apiLogger.info('Email availability check requested', {
      email,
      userAgent: req.headers.get('user-agent')
    });

    // Check if email exists in database
    const existingUser = await databaseService.getUserByEmail(email);
    const emailExists = !!existingUser;

    return NextResponse.json({
      success: true,
      data: {
        email,
        available: !emailExists
      },
      message: emailExists ? 'Email is already registered' : 'Email is available'
    });

  } catch (error) {
    return handleApiError(error);
  }
});
