import { NextRequest, NextResponse } from 'next/server';
import { aiTalentSemanticSearch } from '@/ai/flows/ai-talent-semantic-search-flow';
import { z } from 'zod';

// Input validation schema
const searchSchema = z.object({
  searchQuery: z.string().min(1).max(500),
  resultCount: z.number().min(1).max(50).default(10),
  filters: z.object({
    minExperienceYears: z.number().min(0).max(50).optional(),
    availabilityInDays: z.number().min(0).max(365).optional(),
    isOpenToRemote: z.boolean().optional(),
    skills: z.array(z.string()).optional(),
    location: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = searchSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { searchQuery, resultCount, filters } = validation.data;

    // Perform semantic search
    const searchResults = await aiTalentSemanticSearch({
      searchQuery,
      resultCount
    });

    // Apply post-search filters if provided
    let filteredCandidates = searchResults.matchedCandidates;
    
    if (filters) {
      filteredCandidates = filteredCandidates.filter(candidate => {
        // Filter by availability
        if (filters.availabilityInDays !== undefined && candidate.availability) {
          const availabilityMatch = candidate.availability.toLowerCase().includes('immediate') ||
                                   candidate.availability.toLowerCase().includes('available');
          if (!availabilityMatch) return false;
        }
        
        // Filter by skills if provided
        if (filters.skills && filters.skills.length > 0 && candidate.topSkills) {
          const hasRequiredSkills = filters.skills.some(skill => 
            candidate.topSkills?.some(candidateSkill => 
              candidateSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
          if (!hasRequiredSkills) return false;
        }
        
        return true;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        candidates: filteredCandidates,
        searchSummary: searchResults.searchSummary,
        totalResults: filteredCandidates.length,
        searchQuery,
        appliedFilters: filters || {}
      }
    });

  } catch (error) {
    console.error('AI Talent Search API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}