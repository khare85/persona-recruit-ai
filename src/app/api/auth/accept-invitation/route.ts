
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { databaseService } from '@/services/database.service';
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

    // Get invitation from database
    const invitation = await databaseService.getInvitationByToken(token);
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await databaseService.getUserByEmail(invitation.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user account using database service
    const userId = await databaseService.createUser({
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      role: invitation.role,
      companyId: invitation.companyId,
      status: 'active',
      emailVerified: true,
      passwordHash: password // Will be hashed in the service
    });

    // Mark invitation as accepted
    await databaseService.updateInvitation(invitation.id, {
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedBy: userId
    });
    
    // Generate a custom token for client-side sign-in
    const customToken = await admin.auth().createCustomToken(userId);

    apiLogger.info('User created from invitation', {
      userId,
      email: invitation.email,
      role: invitation.role,
      companyId: invitation.companyId
    });

    return NextResponse.json({
      success: true,
      data: {
        customToken: customToken,
        user: {
          id: userId,
          email: invitation.email,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          role: invitation.role,
          companyId: invitation.companyId
        }
      },
      message: 'Welcome! Your account has been created successfully.'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});
