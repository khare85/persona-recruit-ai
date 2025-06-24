
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import admin from 'firebase-admin';

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['recruiter', 'interviewer']), // Company admins can only invite recruiters and interviewers
  firstName: z.string().min(2).max(50).transform(sanitizeString),
  lastName: z.string().min(2).max(50).transform(sanitizeString),
  department: z.string().max(100).transform(sanitizeString).optional()
});

/**
 * POST /api/company/invite - Company admin invites team members
 */
export const POST = withRateLimit('invite',
  withAuth(
    withRole(['company_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const body = await req.json();
        const validation = inviteTeamMemberSchema.safeParse(body);

        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid invitation data',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const inviteData = validation.data;
        const companyId = req.user?.companyId;

        if (!companyId) {
          return NextResponse.json(
            { error: 'Company information not found' },
            { status: 400 }
          );
        }

        apiLogger.info('Company team member invitation requested', {
          companyId,
          invitedEmail: inviteData.email,
          role: inviteData.role,
          invitedBy: req.user?.id
        });

        // Check if email is already registered or invited
        const existingUserSnapshot = await admin.firestore()
          .collection('users')
          .where('email', '==', inviteData.email)
          .limit(1)
          .get();

        if (!existingUserSnapshot.empty) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 400 }
          );
        }

        const existingInviteSnapshot = await admin.firestore()
          .collection('companyInvitations')
          .where('companyId', '==', companyId)
          .where('email', '==', inviteData.email)
          .where('status', '==', 'pending')
          .where('deletedAt', '==', null)
          .limit(1)
          .get();

        if (!existingInviteSnapshot.empty) {
          return NextResponse.json(
            { error: 'Invitation already sent to this email' },
            { status: 400 }
          );
        }

        const invitationToken = `comp_inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newInvitation = {
          companyId,
          email: inviteData.email,
          firstName: inviteData.firstName,
          lastName: inviteData.lastName,
          role: inviteData.role,
          department: inviteData.department,
          status: 'pending',
          invitedAt: admin.firestore.FieldValue.serverTimestamp(),
          invitedBy: req.user?.id,
          invitationType: 'company_admin',
          invitationToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          deletedAt: null
        };

        // Save invitation to database
        const inviteRef = await admin.firestore()
          .collection('companyInvitations')
          .add(newInvitation);

        // TODO: Send email invitation with token
        // TODO: Get company name for email template
        const companyName = 'Your Company'; // TODO: Get from database

        apiLogger.info('Company team member invitation created', {
          invitationId: inviteRef.id,
          companyId,
          email: inviteData.email,
          role: inviteData.role,
          token: invitationToken
        });

        return NextResponse.json({
          success: true,
          data: { 
            invitation: {
              id: inviteRef.id,
              email: inviteData.email,
              firstName: inviteData.firstName,
              lastName: inviteData.lastName,
              role: inviteData.role,
              department: inviteData.department,
              status: 'pending',
              invitedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              // Include invitation link for testing
              invitationLink: `/auth/accept-invitation?token=${invitationToken}`
            }
          },
          message: `Team member invitation sent to ${inviteData.email}`
        }, { status: 201 });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * GET /api/company/invite - Get company's pending invitations
 */
export const GET = withRateLimit('standard',
  withAuth(
    withRole(['company_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const companyId = req.user?.companyId;
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || '';

        if (!companyId) {
          return NextResponse.json(
            { error: 'Company information not found' },
            { status: 400 }
          );
        }

        apiLogger.info('Company invitations requested', {
          companyId,
          status,
          requestedBy: req.user?.id
        });

        // Get invitations from database
        const invitationsSnapshot = await admin.firestore()
          .collection('companyInvitations')
          .where('companyId', '==', companyId)
          .where('deletedAt', '==', null)
          .orderBy('invitedAt', 'desc')
          .get();

        const invitations = invitationsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            department: data.department,
            status: data.status,
            invitedAt: data.invitedAt?.toDate?.()?.toISOString() || data.invitedAt,
            expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt,
            acceptedAt: data.acceptedAt?.toDate?.()?.toISOString() || data.acceptedAt,
            invitedBy: data.invitedBy
          };
        });

        let filteredInvitations = invitations;
        if (status) {
          filteredInvitations = invitations.filter(inv => 
            inv.status.toLowerCase() === status.toLowerCase()
          );
        }

        return NextResponse.json({
          success: true,
          data: { 
            invitations: filteredInvitations,
            summary: {
              total: invitations.length,
              pending: invitations.filter(inv => inv.status === 'pending').length,
              accepted: invitations.filter(inv => inv.status === 'accepted').length,
              expired: invitations.filter(inv => 
                inv.status === 'pending' && new Date() > new Date(inv.expiresAt)
              ).length
            }
          },
          message: 'Company invitations retrieved successfully'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);
