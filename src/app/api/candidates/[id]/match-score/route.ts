import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { embeddingDatabaseService } from '@/services/embeddingDatabase.service';
import { textEmbeddingService } from '@/services/textEmbedding.service';
import { databaseService } from '@/services/database.service';

const matchScoreSchema = z.object({
  jobId: z.string(),
  includeReasons: z.boolean().default(true)
});

interface MatchScore {
  candidateId: string;
  jobId: string;
  matchScore: number;
  matchReasons: string[];
  skillsMatch: {
    matchingSkills: string[];
    candidateSkills: string[];
    jobRequiredSkills: string[];
  };
  experienceMatch: {
    score: number;
    reason: string;
  };
  semanticMatch: {
    score: number;
    confidence: 'high' | 'medium' | 'low';
  };
  overallAssessment: string;
}

/**
 * POST /api/candidates/[id]/match-score - Calculate AI match score for candidate against specific job
 */
export const POST = withRateLimit('match',
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const candidateId = req.nextUrl.pathname.split('/')[3];
        if (!candidateId) {
          return NextResponse.json(
            { error: 'Candidate ID is required' },
            { status: 400 }
          );
        }

        const body = await req.json();
        const validation = matchScoreSchema.safeParse(body);

        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid match score parameters',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const { jobId, includeReasons } = validation.data;

        apiLogger.info('AI match score calculation requested', {
          userId: req.user?.id,
          candidateId,
          jobId
        });

        // Get candidate and job data
        const [candidate, job] = await Promise.all([
          databaseService.getUserById(candidateId),
          databaseService.getJobById(jobId)
        ]);

        if (!candidate) {
          return NextResponse.json(
            { error: 'Candidate not found' },
            { status: 404 }
          );
        }

        if (!job) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          );
        }

        // Get candidate profile
        const candidateProfile = await databaseService.getCandidateProfile(candidateId);

        // Get embeddings for both candidate and job
        const [candidateWithEmbedding, jobWithEmbedding] = await Promise.all([
          embeddingDatabaseService.getCandidateWithEmbedding(candidateId),
          embeddingDatabaseService.getJobWithEmbedding(jobId)
        ]);

        let semanticScore = 0;
        
        if (candidateWithEmbedding?.resumeEmbedding && jobWithEmbedding?.jobEmbedding) {
          // Calculate semantic similarity using embeddings
          const similarity = textEmbeddingService.calculateSimilarity(
            candidateWithEmbedding.resumeEmbedding,
            jobWithEmbedding.jobEmbedding
          );
          semanticScore = Math.round((similarity + 1) * 50); // Convert from [-1,1] to [0,100]
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
          } else {
            candidateEmbedding = candidateWithEmbedding.resumeEmbedding;
          }
          
          if (!jobWithEmbedding?.jobEmbedding) {
            const jobText = [job.title, job.description || ''].filter(Boolean).join(' ');
            jobEmbedding = await textEmbeddingService.generateDocumentEmbedding(jobText);
          } else {
            jobEmbedding = jobWithEmbedding.jobEmbedding;
          }
          
          const similarity = textEmbeddingService.calculateSimilarity(candidateEmbedding, jobEmbedding);
          semanticScore = Math.round((similarity + 1) * 50);
        }

        // Calculate detailed match score
        const matchScore = await calculateDetailedMatchScore(
          candidate,
          candidateProfile,
          job,
          semanticScore,
          includeReasons
        );

        apiLogger.info('AI match score calculated', {
          candidateId,
          jobId,
          matchScore: matchScore.matchScore,
          semanticScore
        });

        return NextResponse.json({
          success: true,
          data: matchScore
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * Calculate detailed match score with breakdown
 */
async function calculateDetailedMatchScore(
  candidate: any,
  candidateProfile: any,
  job: any,
  semanticScore: number,
  includeReasons: boolean
): Promise<MatchScore> {
  // Skills matching
  const candidateSkills = candidateProfile?.skills || [];
  const jobRequiredSkills = extractSkillsFromJobDescription(job.description || job.title);
  const matchingSkills = candidateSkills.filter((skill: string) =>
    jobRequiredSkills.some(jobSkill => 
      skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
      jobSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );

  const skillsMatchScore = jobRequiredSkills.length > 0 
    ? Math.round((matchingSkills.length / jobRequiredSkills.length) * 100)
    : 50;

  // Experience matching
  const experienceScore = calculateExperienceMatch(
    candidateProfile?.currentTitle || '',
    candidateProfile?.summary || '',
    job.title,
    job.description || ''
  );

  // Overall match score (weighted average)
  const overallScore = Math.round(
    (semanticScore * 0.5) + 
    (skillsMatchScore * 0.3) + 
    (experienceScore.score * 0.2)
  );

  // Generate match reasons
  const matchReasons: string[] = [];
  if (includeReasons) {
    if (matchingSkills.length > 0) {
      matchReasons.push(`${matchingSkills.length}/${jobRequiredSkills.length} required skills match: ${matchingSkills.slice(0, 3).join(', ')}`);
    }
    
    if (experienceScore.score >= 80) {
      matchReasons.push(experienceScore.reason);
    }
    
    if (semanticScore >= 80) {
      matchReasons.push('Strong semantic match in resume content');
    } else if (semanticScore >= 60) {
      matchReasons.push('Good semantic match in resume content');
    }
    
    if (overallScore >= 90) {
      matchReasons.push('Excellent overall candidate fit');
    } else if (overallScore >= 75) {
      matchReasons.push('Strong overall candidate fit');
    } else if (overallScore >= 60) {
      matchReasons.push('Good overall candidate fit');
    }
  }

  // Overall assessment
  let overallAssessment = '';
  if (overallScore >= 90) {
    overallAssessment = 'Exceptional match - highly recommended for interview';
  } else if (overallScore >= 80) {
    overallAssessment = 'Strong match - recommended for interview';
  } else if (overallScore >= 70) {
    overallAssessment = 'Good match - consider for interview';
  } else if (overallScore >= 60) {
    overallAssessment = 'Fair match - review carefully';
  } else {
    overallAssessment = 'Limited match - may not be suitable';
  }

  return {
    candidateId: candidate.id,
    jobId: job.id,
    matchScore: overallScore,
    matchReasons,
    skillsMatch: {
      matchingSkills,
      candidateSkills,
      jobRequiredSkills
    },
    experienceMatch: experienceScore,
    semanticMatch: {
      score: semanticScore,
      confidence: semanticScore >= 80 ? 'high' : semanticScore >= 60 ? 'medium' : 'low'
    },
    overallAssessment
  };
}

/**
 * Calculate experience match score
 */
function calculateExperienceMatch(
  candidateTitle: string,
  candidateSummary: string,
  jobTitle: string,
  jobDescription: string
): { score: number; reason: string } {
  // Title similarity
  const titleSimilarity = calculateTitleSimilarity(candidateTitle, jobTitle);
  
  // Experience level matching
  const candidateLevel = extractExperienceLevel(candidateTitle, candidateSummary);
  const jobLevel = extractExperienceLevel(jobTitle, jobDescription);
  
  let score = Math.round(titleSimilarity * 100);
  let reason = '';
  
  if (titleSimilarity >= 0.7) {
    reason = 'Very similar role title and responsibilities';
    score = Math.min(95, score + 10);
  } else if (titleSimilarity >= 0.4) {
    reason = 'Related role with transferable experience';
    score = Math.min(85, score + 5);
  } else if (candidateLevel === jobLevel) {
    reason = `Matching experience level (${candidateLevel})`;
    score = Math.max(60, score);
  } else {
    reason = 'Different role but may have relevant skills';
    score = Math.max(40, score);
  }
  
  return { score, reason };
}

/**
 * Extract skills from job description
 */
function extractSkillsFromJobDescription(description: string): string[] {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'SQL',
    'AWS', 'Docker', 'Git', 'REST API', 'GraphQL', 'MongoDB', 'PostgreSQL',
    'CSS', 'HTML', 'Vue.js', 'Angular', 'Express', 'Next.js', 'Kubernetes',
    'Machine Learning', 'Data Science', 'DevOps', 'Agile', 'Scrum'
  ];

  return commonSkills.filter(skill =>
    description.toLowerCase().includes(skill.toLowerCase())
  );
}

/**
 * Calculate title similarity
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = title1.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const words2 = title2.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

/**
 * Extract experience level from title and description
 */
function extractExperienceLevel(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  
  if (text.includes('senior') || text.includes('lead') || text.includes('principal')) {
    return 'senior';
  } else if (text.includes('junior') || text.includes('entry') || text.includes('associate')) {
    return 'junior';
  } else if (text.includes('manager') || text.includes('director') || text.includes('head')) {
    return 'management';
  } else {
    return 'mid-level';
  }
}