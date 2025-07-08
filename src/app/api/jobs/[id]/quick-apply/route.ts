
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { databaseService } from '@/services/database.service';
import { notificationService } from '@/services/notification.service';
import { embeddingDatabaseService } from '@/services/embeddingDatabase.service';
import { textEmbeddingService } from '@/services/textEmbedding.service';

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
export const POST = withRateLimit('api' as any,
  withAuth(
    withRole(['candidate'], async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      try {
        const jobId = params.id;
        const candidateId = (req as any).user?.id;
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

        // Get candidate details for various uses
        const candidate = await databaseService.getUserById(candidateId);
        const company = await databaseService.getCompanyById(job.companyId);

        // Calculate AI match score using vector embeddings
        let aiMatchScore = 0;
        try {
          // Get embeddings for both candidate and job
          const [candidateWithEmbedding, jobWithEmbedding] = await Promise.all([
            embeddingDatabaseService.getCandidateWithEmbedding(candidateId),
            embeddingDatabaseService.getJobWithEmbedding(jobId)
          ]);

          if (candidateWithEmbedding?.resumeEmbedding && jobWithEmbedding?.jobEmbedding) {
            // Calculate semantic similarity using embeddings
            const similarity = textEmbeddingService.calculateSimilarity(
              candidateWithEmbedding.resumeEmbedding,
              jobWithEmbedding.jobEmbedding
            );
            aiMatchScore = Math.round((similarity + 1) * 50); // Convert from [-1,1] to [0,100]
          } else {
            // Generate embeddings if they don't exist
            apiLogger.info('Generating missing embeddings for match score calculation');
            
            let candidateEmbedding: number[] = [];
            let jobEmbedding: number[] = [];
            
            if (!candidateWithEmbedding?.resumeEmbedding) {
              const candidateText = [
                candidateProfile?.currentTitle || '',
                candidateProfile?.summary || '',
                candidateProfile?.skills?.join(' ') || ''
              ].filter(Boolean).join(' ');
              
              candidateEmbedding = await textEmbeddingService.generateDocumentEmbedding(candidateText);
              // Save embedding for future use
              await embeddingDatabaseService.saveCandidateWithEmbedding(candidateId, {
                fullName: candidate ? `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() : '',
                email: candidate?.email || '',
                currentTitle: candidateProfile?.currentTitle || '',
                extractedResumeText: candidateText,
                resumeEmbedding: candidateEmbedding,
                skills: candidateProfile?.skills || []
              });
            } else {
              candidateEmbedding = candidateWithEmbedding.resumeEmbedding;
            }
            
            if (!jobWithEmbedding?.jobEmbedding) {
              const jobText = [job.title, job.description || ''].filter(Boolean).join(' ');
              jobEmbedding = await textEmbeddingService.generateDocumentEmbedding(jobText);
              // Save embedding for future use
              await embeddingDatabaseService.saveJobWithEmbedding(jobId, {
                title: job.title,
                companyName: company?.name || '',
                fullJobDescriptionText: jobText,
                jobEmbedding: jobEmbedding,
                location: job.location || '',
                jobLevel: job.experience || '',
                department: job.department || ''
              });
            } else {
              jobEmbedding = jobWithEmbedding.jobEmbedding;
            }
            
            const similarity = textEmbeddingService.calculateSimilarity(candidateEmbedding, jobEmbedding);
            aiMatchScore = Math.round((similarity + 1) * 50);
          }

          apiLogger.info('AI match score calculated', {
            candidateId,
            jobId,
            matchScore: aiMatchScore,
            hasEmbeddings: !!(candidateWithEmbedding?.resumeEmbedding && jobWithEmbedding?.jobEmbedding)
          });
        } catch (error) {
          apiLogger.warn('Failed to calculate AI match score', { error: String(error) });
          // Fallback to basic skills matching if AI fails
          const jobSkills = job.skills || [];
          const candidateSkills = candidateProfile.skills || [];
          const matchedSkills = candidateSkills.filter((skill: string) => 
            jobSkills.some((jobSkill: string) => jobSkill.toLowerCase() === skill.toLowerCase())
          );
          aiMatchScore = jobSkills.length > 0 
            ? Math.round((matchedSkills.length / jobSkills.length) * 100) 
            : 50;
        }

        // Create application
        const applicationData = {
          jobId,
          candidateId,
          companyId: job.companyId,
          status: 'submitted' as const,
          coverNote: validation.data.coverNote,
          applicationMethod: 'quick_apply' as const,
          videoIntroUrl: candidateProfile.videoIntroUrl,
          videoIntroIncluded: !!candidateProfile.videoIntroUrl,
          matchScore: {
            overall: aiMatchScore,
            mustHaveScore: aiMatchScore,
            skillsScore: aiMatchScore,
            experienceScore: aiMatchScore
          },
          expectedSalary: validation.data.expectedSalary,
          availableFrom: validation.data.availableFrom ? new Date(validation.data.availableFrom) : undefined,
          willingToRelocate: validation.data.willingToRelocate
        };
        
        const applicationId = await databaseService.createJobApplication(applicationData);

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
export const GET = withRateLimit('api' as any,
  withAuth(
    withRole(['candidate'], async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      try {
        const jobId = params.id;
        const candidateId = (req as any).user?.id;

        apiLogger.info('Quick apply eligibility check', {
          jobId,
          candidateId
        });

        // Get candidate profile
        const candidateProfile = await databaseService.getCandidateProfile(candidateId);
        if (!candidateProfile) {
          return NextResponse.json(
            { error: 'Candidate profile not found' },
            { status: 404 }
          );
        }

        // Check if already applied
        const existingApplication = await databaseService.getJobApplicationByCandidate(jobId, candidateId);
        const hasApplied = !!existingApplication;

        // Get job details
        const job = await databaseService.getJobById(jobId);
        if (!job) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          );
        }

        // Calculate AI match score using vector embeddings
        let matchScore = 0;
        try {
          const [candidateWithEmbedding, jobWithEmbedding] = await Promise.all([
            embeddingDatabaseService.getCandidateWithEmbedding(candidateId),
            embeddingDatabaseService.getJobWithEmbedding(jobId)
          ]);

          if (candidateWithEmbedding?.resumeEmbedding && jobWithEmbedding?.jobEmbedding) {
            const similarity = textEmbeddingService.calculateSimilarity(
              candidateWithEmbedding.resumeEmbedding,
              jobWithEmbedding.jobEmbedding
            );
            matchScore = Math.round((similarity + 1) * 50);
          } else {
            // Fallback to basic skills matching for preview
            const jobSkills = job.skills || [];
            const candidateSkills = candidateProfile.skills || [];
            const matchedSkills = candidateSkills.filter((skill: string) => 
              jobSkills.some((jobSkill: string) => jobSkill.toLowerCase() === skill.toLowerCase())
            );
            matchScore = jobSkills.length > 0 
              ? Math.round((matchedSkills.length / jobSkills.length) * 100) 
              : 50;
          }
        } catch (error) {
          apiLogger.warn('Failed to calculate match score for preview', { error: String(error) });
          matchScore = 50; // Default score
        }

        // Format experience
        const experience = candidateProfile.experience || 'Not specified';
        const candidateSkills = candidateProfile.skills || [];

        return NextResponse.json({
          success: true,
          data: {
            eligible: !!candidateProfile.videoIntroUrl && candidateProfile.profileComplete && !hasApplied && job.status === 'active',
            reasons: {
              hasVideoIntro: !!candidateProfile.videoIntroUrl,
              profileComplete: candidateProfile.profileComplete,
              alreadyApplied: hasApplied,
              jobAcceptingApplications: job.status === 'active',
              quickApplyEnabled: true
            },
            matchScore,
            candidateInfo: {
              videoIntroUrl: candidateProfile.videoIntroUrl,
              skills: candidateSkills,
              experience: experience
            }
          }
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);
