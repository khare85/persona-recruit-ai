
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { databaseService } from '@/services/database.service';
import { auth as adminAuth } from '@/lib/firebase/server';


const candidateOnboardingSchema = z.object({
  firstName: z.string().min(2, 'First name is required').transform(sanitizeString),
  lastName: z.string().min(2, 'Last name is required').transform(sanitizeString),
  location: z.string().transform(sanitizeString).optional().default(''),
});

/**
 * POST /api/candidates/register - Create candidate profile after Firebase Auth user creation
 * This endpoint is called from the client-side after a user has successfully signed up with Firebase Auth.
 * It creates the corresponding user and profile documents in Firestore.
 */
export const POST = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    const body = await req.json();
    const validation = candidateOnboardingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid onboarding data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    
    apiLogger.info('Candidate profile creation started', { userId, email: userEmail });

    // Set custom claims for the user (role)
    await adminAuth.setCustomUserClaims(userId, { role: 'candidate' });

    // Create user document in Firestore
    const userDoc = {
      id: userId,
      email: userEmail,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: `${data.firstName} ${data.lastName}`,
      role: 'candidate' as const,
      status: 'active' as const,
      emailVerified: decodedToken.email_verified || false,
      passwordHash: '', // Firebase Auth handles password, this is just for model compatibility
      deletedAt: null 
    };
    // Create user document directly in Firestore since Auth user already exists
    await databaseService.createUserDocument(userId, userDoc);

    // Create candidate profile document
    const profileDoc = {
      userId,
      phone: '',
      location: data.location || '',
      currentTitle: 'Professional',
      experience: 'Entry Level' as const,
      summary: '',
      skills: [],
      profileComplete: false,
      availableForWork: true,
      availability: 'immediate' as const,
      resumeUploaded: false,
      videoIntroRecorded: false,
      onboardingComplete: false,
    };
    await databaseService.createCandidateProfile(profileDoc);

    apiLogger.info('Candidate profile and user documents created successfully', { userId });
    
    return NextResponse.json({
      success: true,
      message: 'Profile foundation created. Please upload your resume and record a video intro.',
      data: {
        userId,
        nextStep: 'onboarding'
      }
    }, { status: 201 });

  } catch (error) {
    apiLogger.error('Candidate registration failed', { error: String(error) });
    return handleApiError(error);
  }
});

