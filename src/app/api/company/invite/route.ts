
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { databaseService } from '@/services/database.service';
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

        // Check if email is already registered
        const existingUser = await databaseService.getUserByEmail(inviteData.email);
        if (existingUser) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 400 }
          );
        }

        // Check if invitation already exists for this email/company
        const existingInvitations = await databaseService.getCompanyInvitations(companyId, 'pending');
        const duplicateInvite = existingInvitations.find(inv => inv.email === inviteData.email);
        
        if (duplicateInvite) {
          return NextResponse.json(
            { error: 'Invitation already sent to this email' },
            { status: 400 }
          );
        }

        const invitationToken = `comp_inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create invitation using database service
        const invitationId = await databaseService.createCompanyInvitation({
          companyId,
          email: inviteData.email,
          firstName: inviteData.firstName,
          lastName: inviteData.lastName,
          role: inviteData.role,
          department: inviteData.department,
          status: 'pending',
          invitedBy: req.user?.id || '',
          invitationType: 'company_admin',
          invitationToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        // TODO: Send email invitation with token
        // TODO: Get company name for email template
        const companyName = 'Your Company'; // TODO: Get from database

        apiLogger.info('Company team member invitation created', {
          invitationId,
          companyId,
          email: inviteData.email,
          role: inviteData.role,
          token: invitationToken
        });

        return NextResponse.json({
          success: true,
          data: { 
            invitation: {
              id: invitationId,
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
        const invitations = await databaseService.getCompanyInvitations(companyId);

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
