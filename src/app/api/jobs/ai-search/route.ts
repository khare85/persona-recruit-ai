import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { embeddingDatabaseService } from '@/services/embeddingDatabase.service';
import { textEmbeddingService } from '@/services/textEmbedding.service';
import { databaseService } from '@/services/database.service';

const jobSearchSchema = z.object({
  candidateId: z.string().optional(), // For personalized job recommendations
  query: z.string().min(1).max(500).optional(),
  filters: z.object({
    location: z.string().optional(),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'remote']).optional(),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    experienceLevel: z.enum(['junior', 'mid-level', 'senior', 'management']).optional(),
    department: z.string().optional(),
    companySize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional()
  }).optional(),
  sortBy: z.enum(['relevance', 'salary', 'posted_date', 'match_score']).default('relevance'),
  topN: z.number().min(1).max(50).default(20)
});

interface JobSearchResult {
  jobId: string;
  title: string;
  companyName: string;
  location: string;
  jobType: string;
  salaryRange?: string;
  department?: string;
  matchScore: number;
  matchReasons: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  applicationDeadline?: string;
  isRemote: boolean;
  experienceRequired: string;
  skillsRequired: string[];
  companyLogo?: string;
}

/**
 * POST /api/jobs/ai-search - AI-powered job search with personalized recommendations
 */
export const POST = withRateLimit('search',
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const body = await req.json();
        const validation = jobSearchSchema.safeParse(body);

        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid search parameters',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const { candidateId, query, filters, sortBy, topN } = validation.data;
        const userId = candidateId || req.user?.id;

        apiLogger.info('AI job search requested', {
          userId: req.user?.id,
          candidateId: userId,
          hasQuery: !!query,
          hasFilters: !!filters,
          sortBy,
          topN
        });

        let searchResults: any[] = [];

        if (query) {
          // Query-based search
          const queryEmbedding = await textEmbeddingService.generateQueryEmbedding(query);
          searchResults = await embeddingDatabaseService.searchJobsByEmbedding(
            queryEmbedding,
            topN * 2
          );
        } else if (userId) {
          // Personalized recommendations based on candidate profile
          searchResults = await embeddingDatabaseService.findSimilarJobsForCandidate(
            userId,
            topN * 2
          );
        } else {
          // Get recent jobs if no query or candidate specified
          const recentJobs = await databaseService.getRecentJobs(topN * 2);
          searchResults = recentJobs.map(job => ({
            jobId: job.id,
            title: job.title,
            companyName: job.companyId, // Would need to resolve to company name
            location: job.location,
            fullJobDescriptionText: job.description,
            distance: 0.5 // Default relevance score
          }));
        }

        // Get candidate profile for personalized matching
        let candidateProfile = null;
        if (userId) {
          candidateProfile = await databaseService.getCandidateProfile(userId);
        }

        // Enhance and filter results
        const enhancedResults = await enhanceJobResults(
          searchResults,
          candidateProfile,
          filters,
          query
        );

        // Sort results
        const sortedResults = sortJobResults(enhancedResults, sortBy);

        // Take top N results
        const finalResults = sortedResults.slice(0, topN);

        // Generate search insights
        const searchInsights = generateJobSearchInsights(
          query,
          finalResults,
          candidateProfile,
          searchResults.length
        );

        apiLogger.info('AI job search completed', {
          candidateId: userId,
          query: query?.substring(0, 50),
          totalFound: searchResults.length,
          finalResults: finalResults.length,
          topScore: finalResults[0]?.matchScore
        });

        return NextResponse.json({
          success: true,
          data: {
            results: finalResults,
            totalResults: enhancedResults.length,
            searchQuery: query,
            candidateId: userId,
            searchInsights,
            filters: filters || {},
            metadata: {
              searchType: candidateId ? 'personalized' : query ? 'query' : 'recent',
              embeddingModel: 'text-embedding-005',
              sortBy,
              queryProcessed: Date.now()
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
 * Enhance job search results with additional data and filtering
 */
async function enhanceJobResults(
  searchResults: any[],
  candidateProfile: any,
  filters: any,
  query?: string
): Promise<JobSearchResult[]> {
  const enhancedResults: JobSearchResult[] = [];

  for (const result of searchResults) {
    try {
      // Get full job details
      const job = await databaseService.getJobById(result.jobId);
      if (!job) continue;

      // Get company details
      const company = await databaseService.getCompanyById(job.companyId);

      // Apply filters
      if (filters && !passesFilters(job, filters)) {
        continue;
      }

      // Calculate match score
      const matchScore = candidateProfile 
        ? await calculateJobMatchScore(job, candidateProfile, result.distance)
        : Math.round((1 - (result.distance || 0)) * 100);

      // Generate match reasons
      const matchReasons = candidateProfile
        ? generateJobMatchReasons(job, candidateProfile, query)
        : [];

      // Extract job requirements and benefits
      const requirements = extractJobRequirements(job.description || '');
      const benefits = extractJobBenefits(job.description || '');
      const skillsRequired = extractRequiredSkills(job.description || '');

      const enhancedResult: JobSearchResult = {
        jobId: job.id,
        title: job.title,
        companyName: company?.name || job.companyId,
        location: job.location,
        jobType: job.type || 'full-time',
        salaryRange: formatSalaryRange(job.salaryMin, job.salaryMax),
        department: job.department,
        matchScore,
        matchReasons,
        description: job.description || '',
        requirements,
        benefits,
        postedDate: job.createdAt,
        applicationDeadline: job.applicationDeadline,
        isRemote: job.location.toLowerCase().includes('remote') || job.isRemote || false,
        experienceRequired: extractExperienceLevel(job.title, job.description || ''),
        skillsRequired,
        companyLogo: company?.logoUrl
      };

      enhancedResults.push(enhancedResult);
    } catch (error) {
      apiLogger.error('Error enhancing job result', {
        jobId: result.jobId,
        error: String(error)
      });
    }
  }

  return enhancedResults;
}

/**
 * Check if job passes the specified filters
 */
function passesFilters(job: any, filters: any): boolean {
  if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
    return false;
  }

  if (filters.jobType && job.type !== filters.jobType) {
    return false;
  }

  if (filters.salaryMin && job.salaryMax && job.salaryMax < filters.salaryMin) {
    return false;
  }

  if (filters.salaryMax && job.salaryMin && job.salaryMin > filters.salaryMax) {
    return false;
  }

  if (filters.department && job.department !== filters.department) {
    return false;
  }

  return true;
}

/**
 * Calculate job match score for a candidate
 */
async function calculateJobMatchScore(
  job: any,
  candidateProfile: any,
  vectorDistance: number
): Promise<number> {
  // Base semantic score from vector similarity
  const semanticScore = Math.round((1 - vectorDistance) * 100);

  // Skills matching
  const jobSkills = extractRequiredSkills(job.description || '');
  const candidateSkills = candidateProfile.skills || [];
  const skillMatches = candidateSkills.filter((skill: string) =>
    jobSkills.some(jobSkill => 
      skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
      jobSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );
  const skillScore = jobSkills.length > 0 
    ? Math.round((skillMatches.length / jobSkills.length) * 100)
    : 50;

  // Experience level matching
  const jobExperienceLevel = extractExperienceLevel(job.title, job.description || '');
  const candidateExperienceLevel = extractExperienceLevel(
    candidateProfile.currentTitle || '',
    candidateProfile.summary || ''
  );
  const experienceScore = jobExperienceLevel === candidateExperienceLevel ? 100 : 70;

  // Location matching (if candidate has location preference)
  let locationScore = 80; // Default neutral score
  if (candidateProfile.location && job.location) {
    locationScore = job.location.toLowerCase().includes(candidateProfile.location.toLowerCase()) ||
                   candidateProfile.location.toLowerCase().includes(job.location.toLowerCase()) ||
                   job.location.toLowerCase().includes('remote') ? 100 : 50;
  }

  // Weighted average
  const overallScore = Math.round(
    (semanticScore * 0.4) + 
    (skillScore * 0.3) + 
    (experienceScore * 0.2) + 
    (locationScore * 0.1)
  );

  return Math.min(100, Math.max(0, overallScore));
}

/**
 * Generate match reasons for job recommendations
 */
function generateJobMatchReasons(job: any, candidateProfile: any, query?: string): string[] {
  const reasons: string[] = [];

  // Skills matching
  const jobSkills = extractRequiredSkills(job.description || '');
  const candidateSkills = candidateProfile.skills || [];
  const skillMatches = candidateSkills.filter((skill: string) =>
    jobSkills.some(jobSkill => 
      skill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );

  if (skillMatches.length > 0) {
    reasons.push(`${skillMatches.length} matching skills: ${skillMatches.slice(0, 3).join(', ')}`);
  }

  // Title/role similarity
  if (candidateProfile.currentTitle) {
    const titleSimilarity = calculateTitleSimilarity(candidateProfile.currentTitle, job.title);
    if (titleSimilarity > 0.4) {
      reasons.push('Similar role to your current position');
    }
  }

  // Location match
  if (candidateProfile.location && job.location) {
    if (job.location.toLowerCase().includes(candidateProfile.location.toLowerCase()) ||
        job.location.toLowerCase().includes('remote')) {
      reasons.push('Location matches your preference');
    }
  }

  // Query match (if provided)
  if (query) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const jobText = (job.title + ' ' + job.description).toLowerCase();
    const matchingTerms = queryTerms.filter(term => jobText.includes(term));
    if (matchingTerms.length > 0) {
      reasons.push(`Matches your search: ${matchingTerms.slice(0, 2).join(', ')}`);
    }
  }

  return reasons.length > 0 ? reasons : ['Good overall match based on AI analysis'];
}

/**
 * Sort job results based on criteria
 */
function sortJobResults(results: JobSearchResult[], sortBy: string): JobSearchResult[] {
  switch (sortBy) {
    case 'salary':
      return results.sort((a, b) => {
        const salaryA = extractMaxSalary(a.salaryRange || '');
        const salaryB = extractMaxSalary(b.salaryRange || '');
        return salaryB - salaryA;
      });
    
    case 'posted_date':
      return results.sort((a, b) => 
        new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
      );
    
    case 'match_score':
      return results.sort((a, b) => b.matchScore - a.matchScore);
      
    case 'relevance':
    default:
      return results.sort((a, b) => b.matchScore - a.matchScore);
  }
}

/**
 * Helper functions
 */
function extractJobRequirements(description: string): string[] {
  const requirementSection = description.match(/(?:requirements?|qualifications?):?(.*?)(?:\n\n|\n[A-Z]|$)/is);
  if (!requirementSection) return [];
  
  return requirementSection[1]
    .split(/[•\n-]/)
    .map(req => req.trim())
    .filter(req => req.length > 5)
    .slice(0, 5);
}

function extractJobBenefits(description: string): string[] {
  const benefitSection = description.match(/(?:benefits?|perks?|we offer):?(.*?)(?:\n\n|\n[A-Z]|$)/is);
  if (!benefitSection) return [];
  
  return benefitSection[1]
    .split(/[•\n-]/)
    .map(benefit => benefit.trim())
    .filter(benefit => benefit.length > 5)
    .slice(0, 5);
}

function extractRequiredSkills(description: string): string[] {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'SQL',
    'AWS', 'Docker', 'Git', 'REST API', 'GraphQL', 'MongoDB', 'PostgreSQL',
    'CSS', 'HTML', 'Vue.js', 'Angular', 'Express', 'Next.js', 'Kubernetes'
  ];

  return commonSkills.filter(skill =>
    description.toLowerCase().includes(skill.toLowerCase())
  );
}

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

function calculateTitleSimilarity(title1: string, title2: string): number {
  const words1 = title1.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const words2 = title2.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}

function formatSalaryRange(min?: number, max?: number): string | undefined {
  if (!min && !max) return undefined;
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `$${min.toLocaleString()}+`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return undefined;
}

function extractMaxSalary(salaryRange: string): number {
  const matches = salaryRange.match(/\$?([0-9,]+)/g);
  if (!matches) return 0;
  
  const numbers = matches.map(match => parseInt(match.replace(/[$,]/g, '')));
  return Math.max(...numbers);
}

function generateJobSearchInsights(
  query: string | undefined,
  results: JobSearchResult[],
  candidateProfile: any,
  totalResults: number
): any {
  return {
    searchEffectiveness: results.length > 0 ? 'effective' : 'limited',
    avgMatchScore: results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.matchScore, 0) / results.length)
      : 0,
    topCompanies: [...new Set(results.slice(0, 10).map(r => r.companyName))].slice(0, 5),
    salaryRanges: results.filter(r => r.salaryRange).map(r => r.salaryRange).slice(0, 5),
    locations: [...new Set(results.map(r => r.location))].slice(0, 5),
    recommendations: generateJobRecommendations(results, candidateProfile)
  };
}

function generateJobRecommendations(results: JobSearchResult[], candidateProfile: any): string[] {
  const recommendations: string[] = [];

  if (results.length === 0) {
    recommendations.push('Try broader search terms or consider related job titles');
    recommendations.push('Update your profile with more skills to get better matches');
  } else if (results.length < 5) {
    recommendations.push('Consider expanding your location preferences');
    recommendations.push('Look into related job titles or industries');
  }

  if (results.some(r => r.isRemote)) {
    recommendations.push('Several remote opportunities available');
  }

  if (candidateProfile && results.length > 0) {
    const avgMatchScore = results.reduce((sum, r) => sum + r.matchScore, 0) / results.length;
    if (avgMatchScore < 70) {
      recommendations.push('Consider adding more relevant skills to your profile');
    }
  }

  return recommendations;
}