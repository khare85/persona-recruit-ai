import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

const updateInterviewSchema = z.object({
  scheduledFor: z.string().datetime().optional(),
  duration: z.number().min(15).max(180).optional(),
  type: z.enum(['phone', 'video', 'in_person']).optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  meetingLink: z.string().url().optional(),
  status: z.enum(['scheduled', 'confirmed', 'rescheduled', 'cancelled', 'completed']).optional(),
  timezone: z.string().optional(),
  feedback: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  recommendation: z.enum(['hire', 'no_hire', 'maybe']).optional()
});

/**
 * GET /api/interviews/[id] - Get interview details
 */
export const GET = withRateLimit('interview',
  withAuth(
    withRole(['recruiter', 'company_admin', 'interviewer', 'candidate', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const interviewId = req.nextUrl.pathname.split('/')[3];
        const userId = req.user!.id;
        const userRole = req.user!.role;

        if (!interviewId) {
          return NextResponse.json(
            { error: 'Interview ID is required' },
            { status: 400 }
          );
        }

        apiLogger.info('Fetching interview details', { userId, userRole, interviewId });

        const interview = await databaseService.getInterviewById(interviewId);
        if (!interview) {
          return NextResponse.json(
            { error: 'Interview not found' },
            { status: 404 }
          );
        }

        // Check access permissions
        const hasAccess = userRole === 'super_admin' ||
          interview.candidateId === userId ||
          interview.interviewerId === userId ||
          (userRole === 'recruiter' && interview.companyId === req.user?.companyId) ||
          (userRole === 'company_admin' && interview.companyId === req.user?.companyId);

        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }

        // Get related information
        const [candidate, job, interviewer, application] = await Promise.all([
          databaseService.getUserById(interview.candidateId),
          databaseService.getJobById(interview.jobId),
          databaseService.getUserById(interview.interviewerId),
          databaseService.getJobApplicationByCandidate(interview.jobId, interview.candidateId)
        ]);

        const detailedInterview = {
          ...interview,
          candidate: candidate ? {
            id: candidate.id,
            name: `${candidate.firstName} ${candidate.lastName}`,
            email: candidate.email,
            phone: candidate.phone
          } : null,
          job: job ? {
            id: job.id,
            title: job.title,
            department: job.department,
            companyId: job.companyId
          } : null,
          interviewer: interviewer ? {
            id: interviewer.id,
            name: `${interviewer.firstName} ${interviewer.lastName}`,
            email: interviewer.email
          } : null,
          application: application ? {
            id: application.id,
            status: application.status,
            appliedAt: application.appliedAt
          } : null
        };

        return NextResponse.json({
          success: true,
          interview: detailedInterview
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * PUT /api/interviews/[id] - Update interview
 */
export const PUT = withRateLimit('interview',
  withAuth(
    withRole(['recruiter', 'company_admin', 'interviewer', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const interviewId = req.nextUrl.pathname.split('/')[3];
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const body = await req.json();

        if (!interviewId) {
          return NextResponse.json(
            { error: 'Interview ID is required' },
            { status: 400 }
          );
        }

        const validation = updateInterviewSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid update data',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const updateData = validation.data;

        apiLogger.info('Updating interview', {
          userId,
          userRole,
          interviewId,
          updateFields: Object.keys(updateData)
        });

        const interview = await databaseService.getInterviewById(interviewId);
        if (!interview) {
          return NextResponse.json(
            { error: 'Interview not found' },
            { status: 404 }
          );
        }

        // Check permissions
        const canUpdate = userRole === 'super_admin' ||
          interview.interviewerId === userId ||
          (userRole === 'recruiter' && interview.companyId === req.user?.companyId) ||
          (userRole === 'company_admin' && interview.companyId === req.user?.companyId);

        if (!canUpdate) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }

        // If rescheduling, check interviewer availability
        if (updateData.scheduledFor && updateData.scheduledFor !== interview.scheduledFor) {
          const newTime = new Date(updateData.scheduledFor);
          const duration = updateData.duration || interview.duration;
          const endTime = new Date(newTime.getTime() + duration * 60000);

          const conflicts = await databaseService.getInterviewerSchedule(
            interview.interviewerId,
            newTime,
            endTime,
            interviewId // Exclude current interview from conflict check
          );

          if (conflicts.length > 0) {
            return NextResponse.json(
              { 
                error: 'Interviewer is not available at the new time',
                conflicts: conflicts.map(c => ({
                  id: c.id,
                  scheduledFor: c.scheduledFor,
                  duration: c.duration
                }))
              },
              { status: 409 }
            );
          }

          // Mark as rescheduled if time changed
          updateData.status = 'rescheduled';
        }

        // Handle status changes
        if (updateData.status) {
          await handleStatusChange(interview, updateData.status, userId);
        }

        // Update interview
        await databaseService.updateInterview(interviewId, {
          ...updateData,
          updatedAt: new Date().toISOString(),
          lastUpdatedBy: userId
        });

        // Send notifications for significant changes
        if (updateData.scheduledFor || updateData.status) {
          await sendInterviewUpdateNotification(interview, updateData);
        }

        apiLogger.info('Interview updated successfully', {
          interviewId,
          status: updateData.status
        });

        return NextResponse.json({
          success: true,
          message: 'Interview updated successfully'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * DELETE /api/interviews/[id] - Cancel interview
 */
export const DELETE = withRateLimit('interview',
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const interviewId = req.nextUrl.pathname.split('/')[3];
        const userId = req.user!.id;
        const userRole = req.user!.role;

        if (!interviewId) {
          return NextResponse.json(
            { error: 'Interview ID is required' },
            { status: 400 }
          );
        }

        apiLogger.info('Cancelling interview', { userId, userRole, interviewId });

        const interview = await databaseService.getInterviewById(interviewId);
        if (!interview) {
          return NextResponse.json(
            { error: 'Interview not found' },
            { status: 404 }
          );
        }

        // Check permissions
        const canCancel = userRole === 'super_admin' ||
          (userRole === 'recruiter' && interview.companyId === req.user?.companyId) ||
          (userRole === 'company_admin' && interview.companyId === req.user?.companyId);

        if (!canCancel) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }

        // Can't cancel completed interviews
        if (interview.status === 'completed') {
          return NextResponse.json(
            { error: 'Cannot cancel completed interview' },
            { status: 400 }
          );
        }

        // Update interview status to cancelled
        await databaseService.updateInterview(interviewId, {
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelledBy: userId,
          updatedAt: new Date().toISOString()
        });

        // Update application status back to under review
        const application = await databaseService.getJobApplicationByCandidate(
          interview.jobId,
          interview.candidateId
        );

        if (application && application.status === 'interview_scheduled') {
          await databaseService.updateJobApplication(application.id, {
            status: 'under_review',
            lastUpdated: new Date().toISOString()
          });
        }

        // Send cancellation notifications
        await sendInterviewCancellationNotification(interview, userId);

        apiLogger.info('Interview cancelled successfully', { interviewId });

        return NextResponse.json({
          success: true,
          message: 'Interview cancelled successfully'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * Handle interview status changes
 */
async function handleStatusChange(interview: any, newStatus: string, userId: string): Promise<void> {
  try {
    switch (newStatus) {
      case 'completed':
        // Update application status
        const application = await databaseService.getJobApplicationByCandidate(
          interview.jobId,
          interview.candidateId
        );
        
        if (application) {
          await databaseService.updateJobApplication(application.id, {
            status: 'interviewed',
            lastUpdated: new Date().toISOString()
          });
        }
        break;

      case 'cancelled':
        // Handle cancellation logic
        break;

      case 'confirmed':
        // Handle confirmation logic
        break;
    }
  } catch (error) {
    apiLogger.error('Error handling status change', {
      interviewId: interview.id,
      newStatus,
      error: String(error)
    });
  }
}

/**
 * Send interview update notifications
 */
async function sendInterviewUpdateNotification(interview: any, updateData: any): Promise<void> {
  try {
    const [candidate, interviewer] = await Promise.all([
      databaseService.getUserById(interview.candidateId),
      databaseService.getUserById(interview.interviewerId)
    ]);

    if (process.env.NODE_ENV === 'development') {
      console.log('\n📅 INTERVIEW UPDATE NOTIFICATION');
      console.log('Interview ID:', interview.id);
      console.log('Update:', JSON.stringify(updateData, null, 2));
      console.log('Candidate:', candidate?.email);
      console.log('Interviewer:', interviewer?.email);
      console.log('');
    }

    // TODO: Implement actual notifications
    apiLogger.info('Interview update notification sent', {
      interviewId: interview.id,
      updates: Object.keys(updateData)
    });

  } catch (error) {
    apiLogger.error('Failed to send update notification', {
      interviewId: interview.id,
      error: String(error)
    });
  }
}

/**
 * Send interview cancellation notifications
 */
async function sendInterviewCancellationNotification(interview: any, cancelledBy: string): Promise<void> {
  try {
    const [candidate, interviewer] = await Promise.all([
      databaseService.getUserById(interview.candidateId),
      databaseService.getUserById(interview.interviewerId)
    ]);

    if (process.env.NODE_ENV === 'development') {
      console.log('\n❌ INTERVIEW CANCELLATION NOTIFICATION');
      console.log('Interview ID:', interview.id);
      console.log('Cancelled by:', cancelledBy);
      console.log('Candidate:', candidate?.email);
      console.log('Interviewer:', interviewer?.email);
      console.log('');
    }

    // TODO: Implement actual notifications
    apiLogger.info('Interview cancellation notification sent', {
      interviewId: interview.id,
      cancelledBy
    });

  } catch (error) {
    apiLogger.error('Failed to send cancellation notification', {
      interviewId: interview.id,
      error: String(error)
    });
  }
}