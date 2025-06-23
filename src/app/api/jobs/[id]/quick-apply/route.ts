import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { databaseService } from '@/services/database.service';
import { notificationService } from '@/services/notification.service';

const quickApplySchema = z.object({
  coverNote: z.string().min(50).max(500).transform(sanitizeString).optional(),
  expectedSalary: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
    currency: z.string().default('USD')
  }).optional(),
  availableFrom: z.string().optional(),
  willingToRelocate: z.boolean().optional()
});

/**
 * POST /api/jobs/[id]/quick-apply - Quick apply to a job
 */
export const POST = withRateLimit('apply',
  withAuth(
    withRole(['candidate'], async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      try {
        const jobId = params.id;
        const candidateId = req.user?.id;
        const body = await req.json();
        
        const validation = quickApplySchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid application data',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        apiLogger.info('Quick apply requested', {
          jobId,
          candidateId,
          hasNote: !!validation.data.coverNote
        });

        // Check if candidate has video introduction and complete profile
        const candidateProfile = await databaseService.getCandidateProfile(candidateId);
        if (!candidateProfile) {
          return NextResponse.json(
            { error: 'Candidate profile not found' },
            { status: 404 }
          );
        }

        if (!candidateProfile.videoIntroUrl) {
          return NextResponse.json(
            { 
              error: 'Video introduction required',
              message: 'Please complete your video introduction before applying to jobs.',
              nextStep: '/candidates/onboarding/video-intro'
            },
            { status: 400 }
          );
        }

        if (!candidateProfile.profileComplete) {
          return NextResponse.json(
            { 
              error: 'Incomplete profile',
              message: 'Please complete your profile before applying to jobs.',
              nextStep: '/candidates/profile'
            },
            { status: 400 }
          );
        }

        // Check if already applied
        const existingApplication = await databaseService.getJobApplicationByCandidate(jobId, candidateId);
        if (existingApplication) {
          return NextResponse.json(
            { error: 'You have already applied to this job' },
            { status: 400 }
          );
        }

        // Get job details
        const job = await databaseService.getJobById(jobId);
        if (!job) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          );
        }

        if (job.status !== 'active') {
          return NextResponse.json(
            { error: 'This job is no longer accepting applications' },
            { status: 400 }
          );
        }

        // Create application
        const applicationId = await databaseService.createJobApplication({
          jobId,
          candidateId,
          companyId: job.companyId,
          status: 'pending',
          coverLetter: validation.data.coverNote,
          applicationMethod: 'quick_apply',
          videoIntroUrl: candidateProfile.videoIntroUrl,
          appliedAt: new Date().toISOString()
        });

        // Get candidate details for notifications
        const candidate = await databaseService.getUserById(candidateId);
        const company = await databaseService.getCompanyById(job.companyId);

        // Send notification to recruiters
        if (candidate && company) {
          try {
            const recruiters = await databaseService.getCompanyRecruiters(job.companyId);
            for (const recruiter of recruiters) {
              await notificationService.notifyApplicationReceived(
                recruiter.id,
                `${candidate.firstName} ${candidate.lastName}`,
                job.title,
                applicationId
              );
            }
          } catch (notificationError) {
            apiLogger.warn('Failed to send recruiter notifications', {
              applicationId,
              error: String(notificationError)
            });
          }
        }

        apiLogger.info('Quick apply successful', {
          applicationId,
          jobId,
          candidateId
        });

        return NextResponse.json({
          success: true,
          data: {
            applicationId,
            status: 'pending',
            appliedAt: new Date().toISOString()
          },
          message: `Successfully applied to ${job.title} at ${company?.name || 'the company'}`
        }, { status: 201 });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * GET /api/jobs/[id]/quick-apply - Check quick apply eligibility
 */
export const GET = withRateLimit('standard',
  withAuth(
    withRole(['candidate'], async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      try {
        const jobId = params.id;
        const candidateId = req.user?.id;

        apiLogger.info('Quick apply eligibility check', {
          jobId,
          candidateId
        });

        // TODO: Get candidate profile status
        const candidateProfile = {
          hasVideoIntro: true,
          profileComplete: true,
          videoIntroUrl: 'https://example.com/video.mp4',
          skills: ['JavaScript', 'React', 'Node.js'],
          experience: '3-5 years'
        };

        // TODO: Check if already applied
        const hasApplied = false;

        // TODO: Get job requirements for match calculation
        const job = {
          id: jobId,
          title: 'Software Engineer',
          company: 'TechCorp Inc.',
          status: 'active',
          quickApplyEnabled: true,
          mustHaveRequirements: ['JavaScript', 'React'],
          skills: ['JavaScript', 'React', 'Node.js', 'TypeScript']
        };

        // Calculate basic match score
        const matchedSkills = candidateProfile.skills.filter(skill => 
          job.skills.includes(skill)
        );
        const matchScore = Math.round((matchedSkills.length / job.skills.length) * 100);

        return NextResponse.json({
          success: true,
          data: {
            eligible: candidateProfile.hasVideoIntro && candidateProfile.profileComplete && !hasApplied && job.quickApplyEnabled,
            reasons: {
              hasVideoIntro: candidateProfile.hasVideoIntro,
              profileComplete: candidateProfile.profileComplete,
              alreadyApplied: hasApplied,
              jobAcceptingApplications: job.status === 'active',
              quickApplyEnabled: job.quickApplyEnabled
            },
            matchScore,
            candidateInfo: {
              videoIntroUrl: candidateProfile.videoIntroUrl,
              skills: candidateProfile.skills,
              experience: candidateProfile.experience
            }
          }
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);