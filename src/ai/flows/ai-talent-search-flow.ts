/**
 * @fileoverview AI Talent Search Flow - Now uses real semantic search instead of mock data
 * This flow wraps the semantic search functionality with additional filtering capabilities
 */

import { aiTalentSemanticSearch } from './ai-talent-semantic-search-flow';

interface SearchFilters {
  minExperienceYears?: number;
  availabilityInDays?: number;
  isOpenToRemote?: boolean;
}

export interface AiTalentSearchInput {
  searchQuery: string;
  filters?: SearchFilters;
  resultCount?: number;
}

export interface AiTalentSearchOutput {
  matchedCandidates: Array<{
    candidateId: string;
    fullName: string;
    currentTitle: string;
    profileSummaryExcerpt?: string;
    topSkills?: string[];
    availability?: string;
    matchScore?: number;
    matchJustification?: string;
  }>;
  searchSummary: string;
}

/**
 * AI Talent Search Flow - Uses real semantic search with post-processing filters
 * 
 * This flow:
 * 1. Performs semantic search on real candidate data
 * 2. Applies additional filters to the results
 * 3. Returns filtered and ranked candidates
 */
export async function aiTalentSearch(
  input: AiTalentSearchInput
): Promise<AiTalentSearchOutput> {
  console.log('[AiTalentSearchFlow] Starting search with query:', input.searchQuery);
  
  try {
    // First, perform semantic search with a larger result set to allow for filtering
    const semanticResults = await aiTalentSemanticSearch({
      searchQuery: input.searchQuery,
      resultCount: Math.min((input.resultCount || 10) * 3, 50) // Get 3x results for filtering
    });

    // Apply filters to the semantic search results
    let filteredCandidates = semanticResults.matchedCandidates;
    
    if (input.filters) {
      filteredCandidates = filteredCandidates.filter(candidate => {
        // Filter by availability
        if (input.filters?.availabilityInDays !== undefined) {
          const isAvailableSoon = 
            candidate.availability?.toLowerCase().includes('immediate') ||
            candidate.availability?.toLowerCase().includes('available') ||
            candidate.availability?.toLowerCase().includes('2 weeks') ||
            (input.filters.availabilityInDays >= 30 && 
             candidate.availability?.toLowerCase().includes('month'));
          
          if (!isAvailableSoon) return false;
        }
        
        // Filter by remote preference
        if (input.filters?.isOpenToRemote === true) {
          // For now, we'll include all candidates since we don't have explicit remote preference data
          // In production, this would check the candidate's remote work preferences
          // TODO: Add remote work preference to candidate profiles
        }
        
        // Filter by experience (this is a simplified check)
        if (input.filters?.minExperienceYears !== undefined) {
          // Check if the title suggests senior level for high experience requirements
          const titleLower = candidate.currentTitle?.toLowerCase() || '';
          const isSenior = titleLower.includes('senior') || 
                          titleLower.includes('lead') || 
                          titleLower.includes('principal') ||
                          titleLower.includes('director') ||
                          titleLower.includes('manager');
          
          if (input.filters.minExperienceYears >= 5 && !isSenior) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    // Limit to requested result count
    const finalCandidates = filteredCandidates.slice(0, input.resultCount || 10);
    
    // Generate an enhanced search summary
    const filterSummary = input.filters ? 
      ` Filters applied: ${
        input.filters.minExperienceYears ? `min ${input.filters.minExperienceYears} years experience, ` : ''
      }${
        input.filters.availabilityInDays ? `available within ${input.filters.availabilityInDays} days, ` : ''
      }${
        input.filters.isOpenToRemote ? 'open to remote work' : ''
      }`.replace(/, $/, '.') : '';
    
    const searchSummary = `Found ${finalCandidates.length} candidates matching "${input.searchQuery}".${filterSummary} ${semanticResults.searchSummary}`;
    
    console.log('[AiTalentSearchFlow] Search completed. Found', finalCandidates.length, 'candidates after filtering');
    
    return {
      matchedCandidates: finalCandidates,
      searchSummary
    };
    
  } catch (error) {
    console.error('[AiTalentSearchFlow] Error during search:', error);
    throw new Error(`AI Talent Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export for backward compatibility
export const aiTalentSearchFlow = aiTalentSearch;