import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { embeddingDatabaseService } from '@/services/embeddingDatabase.service';
import { textEmbeddingService } from '@/services/textEmbedding.service';
import { databaseService } from '@/services/database.service';

const matchCandidatesSchema = z.object({
  topN: z.number().min(1).max(100).default(20),
  minScore: z.number().min(0).max(100).default(60),
  includeProfile: z.boolean().default(true)
});

interface CandidateMatch {
  candidateId: string;
  fullName: string;
  currentTitle: string;
  skills: string[];
  matchScore: number;
  matchReasons: string[];
  profilePictureUrl?: string;
  videoIntroUrl?: string;
  experienceSummary?: string;
  aiGeneratedSummary?: string;
  availability?: string;
}

/**
 * POST /api/jobs/[id]/match-candidates - Find best matching candidates for a job
 */
export const POST = withRateLimit('match',
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const jobId = req.nextUrl.pathname.split('/')[3];
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required' },
            { status: 400 }
          );
        }

        const body = await req.json();
        const validation = matchCandidatesSchema.safeParse(body);

        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid match parameters',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const { topN, minScore, includeProfile } = validation.data;

        apiLogger.info('AI candidate matching requested', {
          userId: req.user?.id,
          jobId,
          topN,
          minScore
        });

        // Get job details
        const job = await databaseService.getJobById(jobId);
        if (!job) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          );
        }

        // Get job with embedding data
        const jobWithEmbedding = await embeddingDatabaseService.getJobWithEmbedding(jobId);
        if (!jobWithEmbedding || !jobWithEmbedding.jobEmbedding) {
          // Generate embedding for job if it doesn't exist
          const jobEmbedding = await textEmbeddingService.generateDocumentEmbedding(
            job.description || job.title
          );

          await embeddingDatabaseService.saveJobWithEmbedding(jobId, {
            title: job.title,
            companyName: job.companyId, // This would need to be resolved to company name
            fullJobDescriptionText: job.description || job.title,
            jobEmbedding,
            location: job.location,
            department: job.department
          });

          // Use the newly generated embedding
          const candidateMatches = await embeddingDatabaseService.searchCandidatesByEmbedding(
            jobEmbedding,
            topN * 2 // Get more to filter by score
          );

          const matches = await this.processMatches(candidateMatches, job, minScore, includeProfile);
          
          return NextResponse.json({
            success: true,
            data: {
              jobId,
              jobTitle: job.title,
              totalMatches: matches.length,
              matches: matches.slice(0, topN),
              searchMetadata: {
                minScore,
                embeddingGenerated: true
              }
            }
          });
        }

        // Find similar candidates using job embedding
        const candidateMatches = await embeddingDatabaseService.findSimilarCandidatesForJob(
          jobId,
          topN * 2 // Get more to filter by score
        );

        const matches = await this.processMatches(candidateMatches, job, minScore, includeProfile);

        apiLogger.info('AI candidate matching completed', {
          jobId,
          totalCandidates: candidateMatches.length,
          qualifiedMatches: matches.length,
          topScore: matches[0]?.matchScore
        });

        return NextResponse.json({
          success: true,
          data: {
            jobId,
            jobTitle: job.title,
            totalMatches: matches.length,
            matches: matches.slice(0, topN),
            searchMetadata: {
              minScore,
              searchType: 'vector_embedding'
            }
          }
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * Process candidate matches and calculate detailed match scores
 */
async function processMatches(
  candidateMatches: any[],
  job: any,
  minScore: number,
  includeProfile: boolean
): Promise<CandidateMatch[]> {
  const matches: CandidateMatch[] = [];

  for (const match of candidateMatches) {
    try {
      // Calculate match score (convert cosine distance to percentage)
      const matchScore = Math.round((1 - (match.distance || 0)) * 100);
      
      if (matchScore < minScore) continue;

      // Get additional profile data if requested
      let candidateProfile = null;
      if (includeProfile) {
        candidateProfile = await databaseService.getCandidateProfile(match.candidateId);
      }

      // Calculate match reasons based on skills and experience
      const matchReasons = calculateMatchReasons(match, job, matchScore);

      const candidateMatch: CandidateMatch = {
        candidateId: match.candidateId,
        fullName: match.fullName,
        currentTitle: match.currentTitle,
        skills: match.skills || [],
        matchScore,
        matchReasons,
        profilePictureUrl: match.profilePictureUrl,
        videoIntroUrl: candidateProfile?.videoIntroUrl,
        experienceSummary: match.experienceSummary,
        aiGeneratedSummary: match.aiGeneratedSummary,
        availability: match.availability
      };

      matches.push(candidateMatch);
    } catch (error) {
      apiLogger.error('Error processing candidate match', {
        candidateId: match.candidateId,
        error: String(error)
      });
    }
  }

  // Sort by match score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Calculate match reasons based on candidate and job data
 */
function calculateMatchReasons(candidate: any, job: any, matchScore: number): string[] {
  const reasons: string[] = [];

  // Skills matching
  if (candidate.skills && candidate.skills.length > 0) {
    const jobSkills = extractSkillsFromJobDescription(job.description || job.title);
    const matchingSkills = candidate.skills.filter((skill: string) =>
      jobSkills.some(jobSkill => 
        skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    if (matchingSkills.length > 0) {
      reasons.push(`${matchingSkills.length} matching skills: ${matchingSkills.slice(0, 3).join(', ')}`);
    }
  }

  // Experience level matching
  if (candidate.currentTitle) {
    const titleSimilarity = calculateTitleSimilarity(candidate.currentTitle, job.title);
    if (titleSimilarity > 0.6) {
      reasons.push('Similar role experience');
    }
  }

  // High AI match score
  if (matchScore >= 90) {
    reasons.push('Excellent AI match (90%+)');
  } else if (matchScore >= 80) {
    reasons.push('Strong AI match (80%+)');
  } else if (matchScore >= 70) {
    reasons.push('Good AI match (70%+)');
  }

  // Location matching (if available)
  if (job.location && candidate.location) {
    if (job.location.toLowerCase().includes(candidate.location.toLowerCase()) ||
        candidate.location.toLowerCase().includes(job.location.toLowerCase())) {
      reasons.push('Location match');
    }
  }

  return reasons.length > 0 ? reasons : ['AI semantic matching'];
}

/**
 * Extract skills from job description
 */
function extractSkillsFromJobDescription(description: string): string[] {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'SQL',
    'AWS', 'Docker', 'Git', 'REST API', 'GraphQL', 'MongoDB', 'PostgreSQL',
    'CSS', 'HTML', 'Vue.js', 'Angular', 'Express', 'Next.js', 'Kubernetes'
  ];

  return commonSkills.filter(skill =>
    description.toLowerCase().includes(skill.toLowerCase())
  );
}

/**
 * Calculate title similarity
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = title1.toLowerCase().split(/\s+/);
  const words2 = title2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}