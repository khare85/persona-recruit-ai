import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';

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

        // TODO: Check if email is already registered
        // TODO: Check company invitation limits
        // TODO: Create pending invitation record
        // TODO: Send invitation email
        // TODO: Generate secure invitation token

        const invitationToken = `comp_inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newInvitation = {
          id: `invitation_${Date.now()}`,
          companyId,
          email: inviteData.email,
          firstName: inviteData.firstName,
          lastName: inviteData.lastName,
          role: inviteData.role,
          department: inviteData.department,
          status: 'Pending' as const,
          invitedAt: new Date().toISOString(),
          invitedBy: req.user?.id,
          invitationType: 'company_admin' as const,
          invitationToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };

        // TODO: Send email invitation with token
        // TODO: Get company name for email template
        const companyName = 'Your Company'; // TODO: Get from database

        apiLogger.info('Company team member invitation created', {
          invitationId: newInvitation.id,
          companyId,
          email: inviteData.email,
          role: inviteData.role,
          token: invitationToken
        });

        return NextResponse.json({
          success: true,
          data: { 
            invitation: {
              id: newInvitation.id,
              email: newInvitation.email,
              firstName: newInvitation.firstName,
              lastName: newInvitation.lastName,
              role: newInvitation.role,
              department: newInvitation.department,
              status: newInvitation.status,
              invitedAt: newInvitation.invitedAt,
              expiresAt: newInvitation.expiresAt,
              // Include invitation link for testing
              invitationLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invitation?token=${invitationToken}`
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

        // TODO: Get invitations from database
        const mockInvitations = [
          {
            id: 'inv_1',
            email: 'recruiter@company.com',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'recruiter',
            department: 'HR',
            status: 'Pending',
            invitedAt: '2024-06-20T10:00:00Z',
            expiresAt: '2024-06-27T10:00:00Z',
            invitedBy: req.user?.id
          },
          {
            id: 'inv_2',
            email: 'interviewer@company.com',
            firstName: 'Mike',
            lastName: 'Johnson',
            role: 'interviewer',
            department: 'Engineering',
            status: 'Accepted',
            invitedAt: '2024-06-18T14:30:00Z',
            acceptedAt: '2024-06-19T09:15:00Z',
            invitedBy: req.user?.id
          }
        ];

        let filteredInvitations = mockInvitations;
        if (status) {
          filteredInvitations = mockInvitations.filter(inv => 
            inv.status.toLowerCase() === status.toLowerCase()
          );
        }

        return NextResponse.json({
          success: true,
          data: { 
            invitations: filteredInvitations,
            summary: {
              total: mockInvitations.length,
              pending: mockInvitations.filter(inv => inv.status === 'Pending').length,
              accepted: mockInvitations.filter(inv => inv.status === 'Accepted').length,
              expired: mockInvitations.filter(inv => 
                inv.status === 'Pending' && new Date() > new Date(inv.expiresAt)
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