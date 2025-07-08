import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';
import { jobRecommendationSemantic } from '@/ai/flows/job-recommendation-semantic-flow';
import { embeddingDatabaseService } from '@/services/embeddingDatabase.service';

const recommendationQuerySchema = z.object({
  limit: z.number().min(1).max(50).default(10),
  includeApplied: z.boolean().default(false),
  location: z.string().optional(),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'remote']).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional()
});

/**
 * GET /api/candidates/job-recommendations - Get AI-powered job recommendations for the candidate
 */
export const GET = withRateLimit('api' as any,
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const candidateId = (req as any).user?.id;
        const searchParams = new URL(req.url).searchParams;
        
        const params = recommendationQuerySchema.parse({
          limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
          includeApplied: searchParams.get('includeApplied') === 'true',
          location: searchParams.get('location') || undefined,
          employmentType: searchParams.get('employmentType') as any || undefined,
          salaryMin: searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')!) : undefined,
          salaryMax: searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')!) : undefined
        });

        apiLogger.info('Job recommendations requested', {
          candidateId,
          params
        });

        // Get candidate profile
        const candidateProfile = await databaseService.getCandidateProfile(candidateId);
        if (!candidateProfile) {
          return NextResponse.json(
            { error: 'Candidate profile not found' },
            { status: 404 }
          );
        }

        // Check if candidate has embedding
        const candidateWithEmbedding = await embeddingDatabaseService.getCandidateWithEmbedding(candidateId);
        
        // Use semantic job recommendation flow
        let recommendations: any[] = [];
        try {
          // Create candidate profile text for semantic search
          const candidateProfileText = [
            candidateProfile.currentTitle || '',
            candidateProfile.summary || '',
            candidateProfile.skills?.join(', ') || '',
            candidateProfile.experience || '',
            candidateProfile.location || ''
          ].filter(Boolean).join('. ');

          const semanticResults = await jobRecommendationSemantic({
            candidateProfileText,
            resultCount: params.limit
          });

          // Transform semantic results to match frontend format
          const activeJobs = await Promise.all(
            semanticResults.recommendedJobs.map(async (recJob) => {
              const job = await databaseService.getJobById(recJob.jobId);
              if (!job || job.status !== 'active') return null;

              // Check if already applied
              const hasApplied = !params.includeApplied ? false : 
                await databaseService.getJobApplicationByCandidate(recJob.jobId, candidateId) !== null;

              if (hasApplied && !params.includeApplied) return null;

              return {
                id: recJob.jobId,
                title: recJob.title,
                company: job.companyName || recJob.companyName || 'Unknown Company',
                companyLogo: job.companyLogo,
                location: recJob.location || job.location,
                employmentType: job.type,
                salaryRange: job.salary ? 
                  `$${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}` : 
                  'Competitive',
                aiMatchScore: Math.round((recJob.matchScore || 0.5) * 100),
                description: job.description,
                requiredSkills: job.skills || [],
                preferredSkills: job.niceToHaveRequirements || [],
                benefits: job.benefits || [],
                postedAt: job.createdAt,
                applicationDeadline: job.applicationDeadline,
                applicationCount: job.stats?.applications || 0,
                isRemote: job.locationType === 'remote' || job.isRemote || false,
                experienceLevel: job.experience,
                isSaved: false, // TODO: Implement saved jobs
                hasApplied,
                matchReasons: [`${Math.round((recJob.matchScore || 0.5) * 100)}% semantic match`]
              };
            })
          );

          recommendations = activeJobs.filter(job => job !== null);
        } catch (error) {
          apiLogger.warn('Semantic recommendation failed, falling back to basic matching', {
            error: String(error)
          });

          // Fallback to basic job matching
          const allJobs = await databaseService.getAllJobs();
          const activeJobs = allJobs.filter(job => job.status === 'active');
          
          // Simple skill-based matching
          recommendations = activeJobs
            .map((job: any) => {
              const jobSkills = job.skills || [];
              const candidateSkills = candidateProfile.skills || [];
              const matchingSkills = candidateSkills.filter((skill: string) => 
                jobSkills.some((jobSkill: string) => 
                  skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
                  jobSkill.toLowerCase().includes(skill.toLowerCase())
                )
              );
              
              const matchScore = jobSkills.length > 0 
                ? (matchingSkills.length / jobSkills.length) * 100 
                : 50;

              return {
                id: job.id,
                title: job.title,
                company: job.companyName || 'Unknown Company',
                companyLogo: job.companyLogo,
                location: job.location,
                employmentType: job.type,
                salaryRange: job.salary ? 
                  `$${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}` : 
                  'Competitive',
                aiMatchScore: Math.round(matchScore),
                description: job.description,
                requiredSkills: job.skills || [],
                preferredSkills: job.niceToHaveRequirements || [],
                benefits: job.benefits || [],
                postedAt: job.createdAt,
                applicationDeadline: job.applicationDeadline,
                applicationCount: job.stats?.applications || 0,
                isRemote: job.locationType === 'remote' || job.isRemote || false,
                experienceLevel: job.experience,
                isSaved: false,
                hasApplied: false,
                matchReasons: matchingSkills.length > 0 
                  ? [`${matchingSkills.length} matching skills`]
                  : []
              };
            })
            .filter((job: any) => {
              // Apply filters
              if (params.location && !job.location.toLowerCase().includes(params.location.toLowerCase())) {
                return false;
              }
              if (params.employmentType && job.employmentType !== params.employmentType) {
                return false;
              }
              return true;
            })
            .sort((a: any, b: any) => b.aiMatchScore - a.aiMatchScore)
            .slice(0, params.limit);
        }

        apiLogger.info('Job recommendations generated', {
          candidateId,
          recommendationCount: recommendations.length,
          usedSemanticSearch: !!candidateWithEmbedding
        });

        return NextResponse.json({
          success: true,
          data: {
            jobs: recommendations,
            totalCount: recommendations.length,
            profile: {
              skills: candidateProfile.skills || [],
              experience: candidateProfile.experience || '',
              location: candidateProfile.location || ''
            }
          }
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);