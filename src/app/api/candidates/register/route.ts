import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { verifyFirebaseToken } from '@/middleware/auth';
import admin from 'firebase-admin';
import { databaseService } from '@/services/database.service';

const candidateOnboardingSchema = z.object({
  firstName: z.string().min(2, 'First name is required').transform(sanitizeString),
  lastName: z.string().min(2, 'Last name is required').transform(sanitizeString),
  location: z.string().min(2, 'Location is required').transform(sanitizeString),
  phone: z.string().min(10).max(20).transform(sanitizeString).optional(),
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

    const decodedToken = await admin.auth().verifyIdToken(token);
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
    await admin.auth().setCustomUserClaims(userId, { role: 'candidate' });

    // Create user document in Firestore
    const userDoc = {
      id: userId,
      email: userEmail,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: `${data.firstName} ${data.lastName}`,
      role: 'candidate',
      status: 'active',
      emailVerified: decodedToken.email_verified || false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedAt: null // Explicitly set for soft delete support
    };
    await databaseService.updateUser(userId, userDoc);

    // Create candidate profile document
    const profileDoc = {
      userId,
      phone: data.phone,
      location: data.location,
      currentTitle: 'Professional', // Placeholder, to be updated by resume upload
      summary: '',
      skills: [],
      profileComplete: false,
      availableForWork: true,
      availability: 'immediate'
    };
    await databaseService.createCandidateProfile(profileDoc);

    apiLogger.info('Candidate profile and user documents created successfully', { userId });
    
    return NextResponse.json({
      success: true,
      message: 'Profile foundation created. Please upload your resume and record a video intro.',
      data: {
        userId,
        nextStep: 'onboarding' // The client will now proceed to the full onboarding flow.
      }
    }, { status: 201 });

  } catch (error) {
    apiLogger.error('Candidate registration failed', { error: String(error) });
    return handleApiError(error);
  }
});
