import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { embeddingDatabaseService } from '@/services/embeddingDatabase.service';
import { textEmbeddingService } from '@/services/textEmbedding.service';
import { databaseService } from '@/services/database.service';

const aiSearchSchema = z.object({
  query: z.string().min(1).max(500),
  filters: z.object({
    skills: z.array(z.string()).optional(),
    experience: z.enum(['junior', 'mid-level', 'senior', 'management']).optional(),
    location: z.string().optional(),
    availability: z.enum(['immediate', 'within_2_weeks', 'within_month', 'flexible']).optional(),
    minExperience: z.number().min(0).max(20).optional(),
    maxExperience: z.number().min(0).max(20).optional()
  }).optional(),
  sortBy: z.enum(['relevance', 'experience', 'updated']).default('relevance'),
  includeProfiles: z.boolean().default(true),
  topN: z.number().min(1).max(50).default(20)
});

interface AISearchResult {
  candidateId: string;
  fullName: string;
  currentTitle: string;
  skills: string[];
  matchScore: number;
  relevanceScore: number;
  experienceLevel: string;
  location?: string;
  availability?: string;
  profilePictureUrl?: string;
  videoIntroUrl?: string;
  summary?: string;
  aiGeneratedSummary?: string;
  highlightedMatches: string[];
  lastUpdated: string;
}

/**
 * POST /api/candidates/ai-search - AI-powered candidate search with semantic matching
 */
export const POST = withRateLimit('search',
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const body = await req.json();
        const validation = aiSearchSchema.safeParse(body);

        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid search parameters',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const { query, filters, sortBy, includeProfiles, topN } = validation.data;

        apiLogger.info('AI candidate search requested', {
          userId: req.user?.id,
          query: query.substring(0, 100),
          hasFilters: !!filters,
          sortBy,
          topN
        });

        // Generate embedding for the search query
        const queryEmbedding = await textEmbeddingService.generateQueryEmbedding(query);

        // Perform vector search
        const vectorResults = await embeddingDatabaseService.searchCandidatesByEmbedding(
          queryEmbedding,
          topN * 2 // Get more results to allow for filtering
        );

        // Apply filters and enhance results
        const filteredResults = await applyFiltersAndEnhance(
          vectorResults,
          filters,
          query,
          includeProfiles
        );

        // Sort results
        const sortedResults = sortResults(filteredResults, sortBy);

        // Take top N results
        const finalResults = sortedResults.slice(0, topN);

        // Generate search insights
        const searchInsights = generateSearchInsights(query, finalResults, vectorResults.length);

        apiLogger.info('AI candidate search completed', {
          query: query.substring(0, 50),
          totalFound: vectorResults.length,
          afterFilters: filteredResults.length,
          finalResults: finalResults.length,
          topScore: finalResults[0]?.matchScore
        });

        return NextResponse.json({
          success: true,
          data: {
            results: finalResults,
            totalResults: filteredResults.length,
            searchQuery: query,
            searchInsights,
            filters: filters || {},
            metadata: {
              searchType: 'ai_semantic',
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
 * Apply filters and enhance search results with additional data
 */
async function applyFiltersAndEnhance(
  vectorResults: any[],
  filters: any,
  query: string,
  includeProfiles: boolean
): Promise<AISearchResult[]> {
  const enhancedResults: AISearchResult[] = [];

  for (const result of vectorResults) {
    try {
      // Get candidate profile if needed
      let candidateProfile = null;
      if (includeProfiles) {
        candidateProfile = await databaseService.getCandidateProfile(result.candidateId);
      }

      // Apply filters
      if (filters) {
        // Skills filter
        if (filters.skills && filters.skills.length > 0) {
          const candidateSkills = result.skills || candidateProfile?.skills || [];
          const hasRequiredSkills = filters.skills.some((skill: string) =>
            candidateSkills.some((candidateSkill: string) =>
              candidateSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
          if (!hasRequiredSkills) continue;
        }

        // Experience level filter
        if (filters.experience) {
          const candidateExperienceLevel = extractExperienceLevel(
            result.currentTitle || candidateProfile?.currentTitle || '',
            result.experienceSummary || candidateProfile?.summary || ''
          );
          if (candidateExperienceLevel !== filters.experience) continue;
        }

        // Location filter
        if (filters.location && candidateProfile?.location) {
          if (!candidateProfile.location.toLowerCase().includes(filters.location.toLowerCase())) {
            continue;
          }
        }

        // Availability filter
        if (filters.availability && result.availability) {
          if (result.availability !== filters.availability) continue;
        }
      }

      // Calculate match score (convert distance to percentage)
      const matchScore = Math.round((1 - (result.distance || 0)) * 100);

      // Calculate relevance score based on query match
      const relevanceScore = calculateRelevanceScore(result, query);

      // Generate highlighted matches
      const highlightedMatches = generateHighlightedMatches(result, query);

      // Determine experience level
      const experienceLevel = extractExperienceLevel(
        result.currentTitle || candidateProfile?.currentTitle || '',
        result.experienceSummary || candidateProfile?.summary || ''
      );

      const enhancedResult: AISearchResult = {
        candidateId: result.candidateId,
        fullName: result.fullName,
        currentTitle: result.currentTitle,
        skills: result.skills || candidateProfile?.skills || [],
        matchScore,
        relevanceScore,
        experienceLevel,
        location: candidateProfile?.location,
        availability: result.availability,
        profilePictureUrl: result.profilePictureUrl,
        videoIntroUrl: candidateProfile?.videoIntroUrl,
        summary: result.experienceSummary || candidateProfile?.summary,
        aiGeneratedSummary: result.aiGeneratedSummary,
        highlightedMatches,
        lastUpdated: candidateProfile?.updatedAt || new Date().toISOString()
      };

      enhancedResults.push(enhancedResult);
    } catch (error) {
      apiLogger.error('Error enhancing search result', {
        candidateId: result.candidateId,
        error: String(error)
      });
    }
  }

  return enhancedResults;
}

/**
 * Sort search results based on specified criteria
 */
function sortResults(results: AISearchResult[], sortBy: string): AISearchResult[] {
  switch (sortBy) {
    case 'experience':
      return results.sort((a, b) => {
        const experienceOrder = { 'junior': 1, 'mid-level': 2, 'senior': 3, 'management': 4 };
        return (experienceOrder[b.experienceLevel as keyof typeof experienceOrder] || 0) - 
               (experienceOrder[a.experienceLevel as keyof typeof experienceOrder] || 0);
      });
    
    case 'updated':
      return results.sort((a, b) => 
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
    
    case 'relevance':
    default:
      return results.sort((a, b) => b.matchScore - a.matchScore);
  }
}

/**
 * Calculate relevance score based on query terms in candidate data
 */
function calculateRelevanceScore(candidate: any, query: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  const candidateText = [
    candidate.fullName || '',
    candidate.currentTitle || '',
    candidate.experienceSummary || '',
    candidate.aiGeneratedSummary || '',
    (candidate.skills || []).join(' ')
  ].join(' ').toLowerCase();

  const matchingTerms = queryTerms.filter(term => candidateText.includes(term));
  return Math.round((matchingTerms.length / queryTerms.length) * 100);
}

/**
 * Generate highlighted matches for display
 */
function generateHighlightedMatches(candidate: any, query: string): string[] {
  const matches: string[] = [];
  const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);

  // Check skills
  if (candidate.skills) {
    const matchingSkills = candidate.skills.filter((skill: string) =>
      queryTerms.some(term => skill.toLowerCase().includes(term))
    );
    if (matchingSkills.length > 0) {
      matches.push(`Skills: ${matchingSkills.join(', ')}`);
    }
  }

  // Check title
  if (candidate.currentTitle) {
    const titleMatches = queryTerms.filter(term => 
      candidate.currentTitle.toLowerCase().includes(term)
    );
    if (titleMatches.length > 0) {
      matches.push(`Title: ${candidate.currentTitle}`);
    }
  }

  // Check summary
  if (candidate.experienceSummary || candidate.aiGeneratedSummary) {
    const summary = candidate.experienceSummary || candidate.aiGeneratedSummary;
    const summaryMatches = queryTerms.filter(term => 
      summary.toLowerCase().includes(term)
    );
    if (summaryMatches.length > 0) {
      // Extract relevant sentence
      const sentences = summary.split(/[.!?]+/);
      const matchingSentence = sentences.find(sentence =>
        queryTerms.some(term => sentence.toLowerCase().includes(term))
      );
      if (matchingSentence) {
        matches.push(`Experience: ${matchingSentence.trim()}`);
      }
    }
  }

  return matches.slice(0, 3); // Limit to top 3 matches
}

/**
 * Generate search insights for the user
 */
function generateSearchInsights(
  query: string,
  results: AISearchResult[],
  totalVectorResults: number
): any {
  const insights = {
    searchEffectiveness: results.length > 0 ? 'effective' : 'limited',
    avgMatchScore: results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.matchScore, 0) / results.length)
      : 0,
    topSkills: extractTopSkills(results),
    experienceLevels: extractExperienceLevels(results),
    suggestions: generateSearchSuggestions(query, results, totalVectorResults)
  };

  return insights;
}

/**
 * Extract top skills from search results
 */
function extractTopSkills(results: AISearchResult[]): string[] {
  const skillCounts: { [skill: string]: number } = {};
  
  results.forEach(result => {
    result.skills.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  return Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([skill]) => skill);
}

/**
 * Extract experience level distribution
 */
function extractExperienceLevels(results: AISearchResult[]): any {
  const levels: { [level: string]: number } = {};
  
  results.forEach(result => {
    levels[result.experienceLevel] = (levels[result.experienceLevel] || 0) + 1;
  });

  return levels;
}

/**
 * Generate search suggestions
 */
function generateSearchSuggestions(
  query: string,
  results: AISearchResult[],
  totalVectorResults: number
): string[] {
  const suggestions: string[] = [];

  if (results.length === 0) {
    suggestions.push('Try broader search terms or remove some filters');
    suggestions.push('Consider searching for related skills or job titles');
  } else if (results.length < 5) {
    suggestions.push('Try adding more related keywords to find additional candidates');
    suggestions.push('Consider expanding location or experience level filters');
  }

  if (totalVectorResults > results.length * 2) {
    suggestions.push('Many candidates were filtered out - consider relaxing filter criteria');
  }

  return suggestions;
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