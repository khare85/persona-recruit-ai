import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { auth as adminAuth } from '@/lib/firebase/server';
import { databaseService } from '@/services/database.service';

const registrationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').transform(sanitizeString),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').transform(sanitizeString),
  role: z.enum(['candidate', 'recruiter', 'interviewer', 'company_admin']).default('candidate'),
  companyId: z.string().optional(),
  location: z.string().optional().transform(val => val ? sanitizeString(val) : '')
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email!;
    
    // Validate request body
    const body = await req.json();
    const validation = registrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid registration data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { firstName, lastName, role, companyId, location } = validation.data;
    
    apiLogger.info('User registration started', { userId, email: userEmail, role });

    // Set custom claims for the user
    const customClaims: Record<string, any> = { role };
    if (companyId) {
      customClaims.companyId = companyId;
    }
    await adminAuth.setCustomUserClaims(userId, customClaims);

    // Create user document in Firestore
    const userDoc = {
      id: userId,
      email: userEmail,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      role,
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
      const candidateProfile = {
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