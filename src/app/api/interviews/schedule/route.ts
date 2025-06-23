import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';
import { notificationService } from '@/services/notification.service';

const scheduleInterviewSchema = z.object({
  candidateId: z.string().min(1, 'Candidate ID is required'),
  jobId: z.string().min(1, 'Job ID is required'),
  interviewerId: z.string().min(1, 'Interviewer ID is required'),
  scheduledFor: z.string().datetime('Invalid date format'),
  duration: z.number().min(15).max(180).default(60), // Duration in minutes
  type: z.enum(['phone', 'video', 'in_person']).default('video'),
  notes: z.string().optional(),
  location: z.string().optional(), // For in-person interviews
  meetingLink: z.string().url().optional(), // For video interviews
  timezone: z.string().default('UTC')
});

const updateInterviewSchema = z.object({
  scheduledFor: z.string().datetime().optional(),
  duration: z.number().min(15).max(180).optional(),
  type: z.enum(['phone', 'video', 'in_person']).optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  meetingLink: z.string().url().optional(),
  status: z.enum(['scheduled', 'confirmed', 'rescheduled', 'cancelled', 'completed']).optional(),
  timezone: z.string().optional()
});

/**
 * POST /api/interviews/schedule - Schedule a new interview
 */
export const POST = withRateLimit('schedule',
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const body = await req.json();

        const validation = scheduleInterviewSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid interview data',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const interviewData = validation.data;

        apiLogger.info('Scheduling interview', {
          userId,
          candidateId: interviewData.candidateId,
          jobId: interviewData.jobId,
          interviewerId: interviewData.interviewerId,
          scheduledFor: interviewData.scheduledFor
        });

        // Validate candidate exists and has applied to the job
        const application = await databaseService.getJobApplicationByCandidate(
          interviewData.jobId,
          interviewData.candidateId
        );

        if (!application) {
          return NextResponse.json(
            { error: 'Candidate has not applied to this job' },
            { status: 404 }
          );
        }

        // Validate interviewer exists and is available
        const interviewer = await databaseService.getUserById(interviewData.interviewerId);
        if (!interviewer || !['interviewer', 'company_admin'].includes(interviewer.role)) {
          return NextResponse.json(
            { error: 'Invalid interviewer' },
            { status: 404 }
          );
        }

        // Check for interviewer availability (basic overlap check)
        const scheduledTime = new Date(interviewData.scheduledFor);
        const endTime = new Date(scheduledTime.getTime() + interviewData.duration * 60000);

        const conflictingInterviews = await databaseService.getInterviewerSchedule(
          interviewData.interviewerId,
          scheduledTime,
          endTime
        );

        if (conflictingInterviews.length > 0) {
          return NextResponse.json(
            { 
              error: 'Interviewer is not available at this time',
              conflictingInterviews: conflictingInterviews.map(interview => ({
                id: interview.id,
                scheduledFor: interview.scheduledFor,
                duration: interview.duration
              }))
            },
            { status: 409 }
          );
        }

        // Generate meeting link for video interviews
        let meetingLink = interviewData.meetingLink;
        if (interviewData.type === 'video' && !meetingLink) {
          meetingLink = await generateMeetingLink(interviewData);
        }

        // Create interview record
        const interview = await databaseService.createInterview({
          candidateId: interviewData.candidateId,
          jobId: interviewData.jobId,
          interviewerId: interviewData.interviewerId,
          scheduledBy: userId,
          scheduledFor: interviewData.scheduledFor,
          duration: interviewData.duration,
          type: interviewData.type,
          status: 'scheduled',
          notes: interviewData.notes,
          location: interviewData.location,
          meetingLink,
          timezone: interviewData.timezone
        });

        // Update application status to 'interview_scheduled'
        await databaseService.updateJobApplication(application.id, {
          status: 'interview_scheduled',
          lastUpdated: new Date().toISOString()
        });

        // Send notifications
        await sendInterviewNotifications(interview, 'scheduled');

        apiLogger.info('Interview scheduled successfully', {
          interviewId: interview.id,
          candidateId: interviewData.candidateId,
          scheduledFor: interviewData.scheduledFor
        });

        return NextResponse.json({
          success: true,
          interview: {
            id: interview.id,
            candidateId: interview.candidateId,
            jobId: interview.jobId,
            interviewerId: interview.interviewerId,
            scheduledFor: interview.scheduledFor,
            duration: interview.duration,
            type: interview.type,
            status: interview.status,
            meetingLink: interview.meetingLink,
            location: interview.location
          },
          message: 'Interview scheduled successfully'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * GET /api/interviews/schedule - Get scheduled interviews
 */
export const GET = withRateLimit('schedule',
  withAuth(
    withRole(['recruiter', 'company_admin', 'interviewer', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const searchParams = req.nextUrl.searchParams;

        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const candidateId = searchParams.get('candidateId');
        const interviewerId = searchParams.get('interviewerId');
        const status = searchParams.get('status');

        apiLogger.info('Fetching interviews', {
          userId,
          userRole,
          startDate,
          endDate,
          candidateId,
          interviewerId,
          status
        });

        let interviews;

        if (userRole === 'interviewer') {
          // Interviewers can only see their own interviews
          interviews = await databaseService.getInterviewsByInterviewer(userId, {
            startDate,
            endDate,
            status
          });
        } else {
          // Recruiters, company admins, and super admins can see all interviews
          interviews = await databaseService.getInterviews({
            startDate,
            endDate,
            candidateId,
            interviewerId,
            status,
            companyId: userRole === 'super_admin' ? undefined : req.user?.companyId
          });
        }

        // Enhance with candidate and job information
        const enhancedInterviews = await Promise.all(
          interviews.map(async (interview) => {
            const [candidate, job, interviewer] = await Promise.all([
              databaseService.getUserById(interview.candidateId),
              databaseService.getJobById(interview.jobId),
              databaseService.getUserById(interview.interviewerId)
            ]);

            return {
              ...interview,
              candidate: candidate ? {
                id: candidate.id,
                name: `${candidate.firstName} ${candidate.lastName}`,
                email: candidate.email
              } : null,
              job: job ? {
                id: job.id,
                title: job.title,
                department: job.department
              } : null,
              interviewer: interviewer ? {
                id: interviewer.id,
                name: `${interviewer.firstName} ${interviewer.lastName}`,
                email: interviewer.email
              } : null
            };
          })
        );

        return NextResponse.json({
          success: true,
          interviews: enhancedInterviews
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * Generate meeting link for video interviews
 */
async function generateMeetingLink(interviewData: any): Promise<string> {
  // In a real implementation, this would integrate with Zoom, Google Meet, or Teams
  // For now, generate a placeholder meeting link
  
  const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  
  // This could be replaced with actual video conferencing API calls
  // Example integrations:
  // - Zoom: Create meeting via Zoom API
  // - Google Meet: Generate Google Meet link
  // - Microsoft Teams: Create Teams meeting
  
  return `https://meet.aitalentstream.com/interview/${meetingId}`;
}

/**
 * Send interview notifications to candidate and interviewer
 */
async function sendInterviewNotifications(interview: any, action: string): Promise<void> {
  try {
    // Get candidate and interviewer details
    const [candidate, interviewer, job, company] = await Promise.all([
      databaseService.getUserById(interview.candidateId),
      databaseService.getUserById(interview.interviewerId),
      databaseService.getJobById(interview.jobId),
      databaseService.getCompanyById(interview.companyId || job?.companyId)
    ]);

    if (!candidate || !interviewer || !job) {
      throw new Error('Failed to get interview participants details');
    }

    // Format scheduled time
    const scheduledTime = new Date(interview.scheduledFor);
    const formattedDate = scheduledTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = scheduledTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Send notification to candidate
    await notificationService.notifyInterviewScheduled(
      candidate.id,
      job.title,
      company?.name || 'Company',
      `${formattedDate} at ${formattedTime}`,
      interview.meetingLink
    );

    // TODO: Also send notification to interviewer
    // This could be implemented as a separate notification type

    apiLogger.info('Interview notifications sent', {
      interviewId: interview.id,
      action,
      candidateEmail: candidate.email,
      interviewerEmail: interviewer.email
    });

  } catch (error) {
    apiLogger.error('Failed to send interview notifications', {
      interviewId: interview.id,
      action,
      error: String(error)
    });
    // Don't throw error here as it shouldn't fail the main operation
  }
}