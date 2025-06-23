import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';
import { notificationService } from '@/services/notification.service';

const updateApplicationSchema = z.object({
  status: z.enum(['pending', 'under_review', 'interview_scheduled', 'interviewed', 'hired', 'rejected']).optional(),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional()
});

/**
 * GET /api/company/applications/[id] - Get application details
 */
export const GET = withRateLimit('application',
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const applicationId = req.nextUrl.pathname.split('/')[4];
        const userId = req.user!.id;
        const userRole = req.user!.role;

        if (!applicationId) {
          return NextResponse.json(
            { error: 'Application ID is required' },
            { status: 400 }
          );
        }

        apiLogger.info('Fetching application details', { userId, userRole, applicationId });

        const application = await databaseService.getJobApplicationById(applicationId);
        if (!application) {
          return NextResponse.json(
            { error: 'Application not found' },
            { status: 404 }
          );
        }

        // Check access permissions
        if (userRole !== 'super_admin') {
          const user = await databaseService.getUserById(userId);
          if (application.companyId !== user?.companyId) {
            return NextResponse.json(
              { error: 'Access denied' },
              { status: 403 }
            );
          }
        }

        // Get detailed information
        const [candidate, candidateProfile, job, company, interviews] = await Promise.all([
          databaseService.getUserById(application.candidateId),
          databaseService.getCandidateProfile(application.candidateId),
          databaseService.getJobById(application.jobId),
          databaseService.getCompanyById(application.companyId),
          databaseService.getInterviews({ candidateId: application.candidateId, jobId: application.jobId })
        ]);

        const detailedApplication = {
          id: application.id,
          candidateId: application.candidateId,
          jobId: application.jobId,
          companyId: application.companyId,
          status: application.status,
          appliedAt: application.appliedAt,
          lastUpdated: application.lastUpdated,
          coverLetter: application.coverLetter,
          aiMatchScore: application.aiMatchScore,
          notes: application.notes,
          rating: application.rating,
          feedback: application.feedback,
          candidate: candidate ? {
            id: candidate.id,
            name: `${candidate.firstName} ${candidate.lastName}`,
            email: candidate.email,
            phone: candidateProfile?.phone,
            location: candidateProfile?.location,
            currentTitle: candidateProfile?.currentTitle,
            summary: candidateProfile?.summary,
            skills: candidateProfile?.skills || [],
            linkedinUrl: candidateProfile?.linkedinUrl,
            portfolioUrl: candidateProfile?.portfolioUrl,
            resumeUrl: candidateProfile?.resumeUrl,
            videoIntroUrl: candidateProfile?.videoIntroUrl,
            availability: candidateProfile?.availability
          } : null,
          job: job ? {
            id: job.id,
            title: job.title,
            department: job.department,
            location: job.location,
            type: job.type,
            description: job.description,
            requirements: job.requirements,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            postedAt: job.createdAt
          } : null,
          company: company ? {
            id: company.id,
            name: company.name,
            logoUrl: company.logoUrl
          } : null,
          interviews: interviews.map(interview => ({
            id: interview.id,
            scheduledFor: interview.scheduledFor,
            duration: interview.duration,
            type: interview.type,
            status: interview.status,
            interviewerId: interview.interviewerId,
            meetingLink: interview.meetingLink,
            location: interview.location,
            feedback: interview.feedback,
            rating: interview.rating
          }))
        };

        return NextResponse.json({
          success: true,
          application: detailedApplication
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * PATCH /api/company/applications/[id] - Update application
 */
export const PATCH = withRateLimit('application',
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const applicationId = req.nextUrl.pathname.split('/')[4];
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const body = await req.json();

        if (!applicationId) {
          return NextResponse.json(
            { error: 'Application ID is required' },
            { status: 400 }
          );
        }

        const validation = updateApplicationSchema.safeParse(body);
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

        apiLogger.info('Updating application', {
          userId,
          userRole,
          applicationId,
          updateFields: Object.keys(updateData)
        });

        const application = await databaseService.getJobApplicationById(applicationId);
        if (!application) {
          return NextResponse.json(
            { error: 'Application not found' },
            { status: 404 }
          );
        }

        // Check permissions
        if (userRole !== 'super_admin') {
          const user = await databaseService.getUserById(userId);
          if (application.companyId !== user?.companyId) {
            return NextResponse.json(
              { error: 'Access denied' },
              { status: 403 }
            );
          }
        }

        // Update application
        await databaseService.updateJobApplication(applicationId, {
          ...updateData,
          lastUpdated: new Date().toISOString(),
          updatedBy: userId
        });

        // Send notification if status changed
        if (updateData.status && updateData.status !== application.status) {
          await sendStatusChangeNotification(application, updateData.status, userId);
        }

        // Log the status change
        if (updateData.status) {
          await logStatusChange(userId, applicationId, application.status, updateData.status);
        }

        apiLogger.info('Application updated successfully', {
          applicationId,
          oldStatus: application.status,
          newStatus: updateData.status
        });

        return NextResponse.json({
          success: true,
          message: 'Application updated successfully'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * Send status change notification to candidate
 */
async function sendStatusChangeNotification(
  application: any,
  newStatus: string,
  updatedBy: string
): Promise<void> {
  try {
    const [candidate, job, company] = await Promise.all([
      databaseService.getUserById(application.candidateId),
      databaseService.getJobById(application.jobId),
      databaseService.getCompanyById(application.companyId)
    ]);

    if (!candidate || !job || !company) {
      apiLogger.warn('Missing data for status change notification', {
        applicationId: application.id,
        candidateId: application.candidateId,
        jobId: application.jobId,
        companyId: application.companyId
      });
      return;
    }

    // Send notification to candidate
    await notificationService.notifyApplicationStatusChanged(
      candidate.id,
      job.title,
      newStatus,
      company.name
    );

    apiLogger.info('Status change notification sent', {
      applicationId: application.id,
      candidateEmail: candidate.email,
      newStatus,
      updatedBy
    });

  } catch (error) {
    apiLogger.error('Failed to send status change notification', {
      applicationId: application.id,
      error: String(error)
    });
  }
}

/**
 * Log status change for audit trail
 */
async function logStatusChange(
  userId: string,
  applicationId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  try {
    await databaseService.createAuditLog({
      userId,
      action: 'status_change',
      resourceType: 'job_application',
      resourceIds: [applicationId],
      details: {
        oldStatus,
        newStatus
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    apiLogger.error('Failed to log status change', {
      error: String(error),
      userId,
      applicationId
    });
  }
}