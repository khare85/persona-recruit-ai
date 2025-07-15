import { NextRequest, NextResponse } from 'next/server';
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { optimizedVectorSearch } from '@/services/ai/OptimizedVectorSearch';
import { withAuth } from '@/lib/auth/middleware';
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
    location: z.string().optional(),
    experience: z.string().optional(),
    jobType: z.string().optional(),
    availability: z.string().optional()
  }).optional(),
  options: z.object({
    threshold: z.number().min(0).max(1).default(0.7),
    includeMetadata: z.boolean().default(true),
    useCache: z.boolean().default(true)
  }).optional()
});

async function handlePOST(request: NextRequest) {
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

    const { searchQuery, resultCount, filters = {}, options = {} } = validation.data;

    // Generate embedding using optimized AI orchestrator
    const queryEmbedding = await aiOrchestrator.generateEmbeddings({ 
      query: searchQuery 
    });

    // Prepare search filters for optimized vector search
    const searchFilters = {
      skills: filters.skills,
      experience: filters.experience,
      location: filters.location,
      availability: filters.availability
    };

    // Perform optimized vector search
    const searchResults = await optimizedVectorSearch.searchCandidates(
      queryEmbedding,
      {
        limit: resultCount,
        filters: searchFilters,
        ...options
      }
    );

    // Apply additional custom filters
    let filteredCandidates = searchResults;
    
    if (filters.minExperienceYears !== undefined) {
      filteredCandidates = filteredCandidates.filter(result => {
        const candidate = result.candidate;
        if (candidate.experienceYears) {
          return candidate.experienceYears >= filters.minExperienceYears!;
        }
        return true;
      });
    }

    if (filters.availabilityInDays !== undefined) {
      filteredCandidates = filteredCandidates.filter(result => {
        const candidate = result.candidate;
        if (candidate.availability) {
          const availabilityMatch = candidate.availability.toLowerCase().includes('immediate') ||
                                   candidate.availability.toLowerCase().includes('available');
          return availabilityMatch;
        }
        return true;
      });
    }

    if (filters.isOpenToRemote !== undefined) {
      filteredCandidates = filteredCandidates.filter(result => {
        const candidate = result.candidate;
        return candidate.isOpenToRemote === filters.isOpenToRemote;
      });
    }

    // Generate search summary
    const searchSummary = {
      totalCandidates: filteredCandidates.length,
      avgMatchScore: filteredCandidates.length > 0 
        ? filteredCandidates.reduce((sum, result) => sum + result.score, 0) / filteredCandidates.length
        : 0,
      topMatchReasons: filteredCandidates.slice(0, 5).flatMap(result => result.matchReasons).slice(0, 10)
    };

    return NextResponse.json({
      success: true,
      data: {
        candidates: filteredCandidates.map(result => ({
          ...result.candidate,
          matchScore: result.score,
          matchReasons: result.matchReasons,
          relevanceScore: result.relevanceScore
        })),
        searchSummary,
        totalResults: filteredCandidates.length,
        searchQuery,
        appliedFilters: filters,
        cacheHit: options.useCache
      },
      searchedAt: new Date().toISOString()
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

// Apply authentication middleware and export
export const POST = withAuth(handlePOST);