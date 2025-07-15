
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { databaseService } from '@/services/database.service';
import { auth as adminAuth } from '@/lib/firebase/server';

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
      ip: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
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
      status: 'active',
      emailVerified: true,
      passwordHash: password, // Will be hashed in the service
      companyId: invitation.companyId
    });

    // Mark invitation as accepted
    await databaseService.updateInvitation(invitation.id, {
      status: 'accepted',
      acceptedAt: new Date(),
      createdUserId: userId,
    });
    
    // Generate a custom token for client-side sign-in
    const customToken = await adminAuth.createCustomToken(userId);

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

/**
 * GET /api/auth/accept-invitation?token=xxx - Validate reset token
 */
export const GET = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    apiLogger.info('Validating invitation token', { token: token.substring(0, 10) + '...' });

    // Find user with this reset token
    const invitation = await databaseService.getInvitationByToken(token);

    if (!invitation || !invitation.expiresAt) {
      apiLogger.warn('Invalid invitation token provided', { token: token.substring(0, 8) + '...' });
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    const now = new Date();
    const expiry = new Date(invitation.expiresAt);
    
    if (now > expiry) {
      apiLogger.warn('Expired invitation token used', { 
        invitationId: invitation.id,
        expiry: invitation.expiresAt
      });
      return NextResponse.json(
        { error: 'Invitation token has expired' },
        { status: 400 }
      );
    }
    
    const company = await databaseService.getCompanyById(invitation.companyId);

    apiLogger.info('Invitation token validated successfully', { invitationId: invitation.id });

    return NextResponse.json({
      success: true,
      data: { 
        valid: true,
        invitation: {
          email: invitation.email,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          role: invitation.role,
          companyName: company?.name || 'A Company',
          department: invitation.department,
          expiresAt: invitation.expiresAt
        }
      }
    });

  } catch (error) {
    apiLogger.error('Invitation token validation failed', { error: String(error) });
    return handleApiError(error);
  }
});
