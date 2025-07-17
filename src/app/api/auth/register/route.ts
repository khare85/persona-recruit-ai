import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { auth as adminAuth } from '@/lib/firebase/server';
import { databaseService } from '@/services/database.service';
import { emailService } from '@/services/email.service';
import { generateUUID } from '@/utils/uuid';
import { UserType } from '@/models/user.model';

const registrationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').transform(sanitizeString),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').transform(sanitizeString),
  role: z.enum(['candidate', 'recruiter', 'interviewer', 'company_admin']).default('candidate'),
  userType: z.enum(['individual', 'corporate', 'agency']).default('individual'),
  companyId: z.string().optional(),
  location: z.string().optional().transform(val => val ? sanitizeString(val) : '').default('')
});

/**
 * POST /api/auth/register - Create user profile after Firebase Auth registration
 * This endpoint is called after successful Firebase Auth createUserWithEmailAndPassword
 * It creates the user document in Firestore and sets custom claims
 */
export const POST = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Verify Firebase Auth token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      apiLogger.error('Registration request without auth token');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let decodedToken;
    let userId;
    let userEmail;
    
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
      userEmail = decodedToken.email!;
    } catch (tokenError) {
      apiLogger.error('Token verification failed', { error: String(tokenError) });
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    // Validate request body
    const body = await req.json();
    const validation = registrationSchema.safeParse(body);

    if (!validation.success) {
      apiLogger.error('Invalid registration data', { 
        errors: validation.error.errors, 
        userId, 
        email: userEmail 
      });
      return NextResponse.json(
        { error: 'Invalid registration data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { firstName, lastName, role, userType, companyId, location } = validation.data;
    
    apiLogger.info('User registration started', { userId, email: userEmail, role });

    // Set custom claims for the user
    const customClaims: Record<string, any> = { role };
    if (companyId) {
      customClaims.companyId = companyId;
    }
    await adminAuth.setCustomUserClaims(userId, customClaims);

    // Create user document in Firestore
    const userUUID = generateUUID();
    const userDoc = {
      id: userId,
      uuid: userUUID,
      email: userEmail,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      role,
      userType: userType as UserType,
      status: 'active' as const,
      emailVerified: decodedToken.email_verified || false,
      companyId: companyId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };

    await databaseService.createUserDocument(userId, userDoc);

    // Create role-specific profile if candidate
    if (role === 'candidate') {
      const profileUUID = generateUUID();
      const candidateProfile = {
        id: `candidate_${userId}`,
        uuid: profileUUID,
        userId,
        phone: '',
        location: location || '',
        currentTitle: '',
        experience: 'Entry Level' as const,
        summary: '',
        skills: [],
        profileComplete: false,
        availableForWork: true,
        availability: 'immediate' as const,
        resumeUploaded: false,
        videoIntroRecorded: false,
        onboardingComplete: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await databaseService.createCandidateProfile(candidateProfile);
    }

    // Send verification email if email is not verified
    if (!decodedToken.email_verified) {
      try {
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${decodedToken.uid}`;
        await emailService.sendVerificationEmail(userEmail, firstName, verificationUrl);
        apiLogger.info('Verification email sent', { userId, email: userEmail });
      } catch (emailError) {
        apiLogger.error('Failed to send verification email', { 
          userId, 
          email: userEmail, 
          error: String(emailError) 
        });
        // Don't fail registration if email fails
      }
    }

    apiLogger.info('User registration completed successfully', { userId, role });
    
    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully',
      data: {
        userId,
        role,
        nextStep: role === 'candidate' ? 'onboarding' : 'dashboard'
      }
    }, { status: 201 });

  } catch (error) {
    apiLogger.error('User registration failed', { error: String(error) });
    return handleApiError(error);
  }
});

/**
 * GET /api/auth/register - Check if email is available
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

    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email exists in Firebase Auth
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json({
        success: true,
        data: { email, available: false },
        message: 'Email is already registered'
      });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({
          success: true,
          data: { email, available: true },
          message: 'Email is available'
        });
      }
      throw error;
    }

  } catch (error) {
    return handleApiError(error);
  }
});