
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp();
    }
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
  }
}

const acceptInvitationSchema = z.object({
  token: z.string().min(10, 'Invalid invitation token'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

/**
 * POST /api/auth/accept-invitation - Accept company invitation
 */
export const POST = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const validation = acceptInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid invitation acceptance data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    apiLogger.info('Invitation acceptance requested', {
      token: token.slice(0, 10) + '...',
      userAgent: req.headers.get('user-agent'),
      ip: req.ip
    });

    // TODO: Implement invitation token validation from database
    // For now, using mock data for demo
    const mockInvitation = {
      email: 'newuser@techcorp.com',
      firstName: 'New',
      lastName: 'User',
      role: 'recruiter',
      companyId: 'company_123',
    };

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: mockInvitation.email,
      password: password,
      displayName: `${mockInvitation.firstName} ${mockInvitation.lastName}`,
      emailVerified: true,
    });

    // Set custom claims for role
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: mockInvitation.role,
      companyId: mockInvitation.companyId
    });

    // Create user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email: mockInvitation.email,
      firstName: mockInvitation.firstName,
      lastName: mockInvitation.lastName,
      role: mockInvitation.role,
      companyId: mockInvitation.companyId,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Mark invitation as accepted
    // await databaseService.acceptInvitation(token, userRecord.uid);
    
    // Generate a custom token for client-side sign-in
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    apiLogger.info('User created from invitation', {
      userId: userRecord.uid,
      email: mockInvitation.email,
      role: mockInvitation.role
    });

    return NextResponse.json({
      success: true,
      data: {
        customToken: customToken,
        user: {
          id: userRecord.uid,
          email: userRecord.email,
          firstName: mockInvitation.firstName,
          lastName: mockInvitation.lastName,
          role: mockInvitation.role
        }
      },
      message: 'Welcome! Your account has been created successfully.'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});
