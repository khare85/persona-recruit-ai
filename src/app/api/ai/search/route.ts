/**
 * Optimized AI Search API
 * Uses the new vector search service for efficient semantic search
 */

import { NextRequest, NextResponse } from 'next/server';
import { optimizedVectorSearch } from '@/services/ai/OptimizedVectorSearch';
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { withAuth } from '@/lib/auth/middleware';
import { z } from 'zod';

// Search request validation schema
const searchRequestSchema = z.object({
  query: z.string().min(1),
  type: z.enum(['candidates', 'jobs']),
  filters: z.object({
    skills: z.array(z.string()).optional(),
    experience: z.string().optional(),
    location: z.string().optional(),
    jobType: z.string().optional(),
    availability: z.string().optional(),
    salaryRange: z.object({
      min: z.number(),
      max: z.number()
    }).optional()
  }).optional(),
  options: z.object({
    limit: z.number().min(1).max(100).default(20),
    threshold: z.number().min(0).max(1).default(0.7),
    includeMetadata: z.boolean().default(true),
    useCache: z.boolean().default(true)
  }).optional()
});

/**
 * Semantic search - POST /api/ai/search
 */
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = searchRequestSchema.parse(body);

    const { query, type, filters = {}, options = {} } = validatedData;

    // Generate embedding for the search query
    const queryEmbedding = await aiOrchestrator.generateEmbeddings({ query });

    let results;
    
    if (type === 'candidates') {
      results = await optimizedVectorSearch.searchCandidates(queryEmbedding, {
        ...options,
        filters
      });
    } else {
      results = await optimizedVectorSearch.searchJobs(queryEmbedding, {
        ...options,
        filters
      });
    }

    // Add search analytics
    const searchStats = optimizedVectorSearch.getSearchStats();

    return NextResponse.json({
      success: true,
      data: {
        results,
        count: results.length,
        query,
        type,
        filters,
        stats: searchStats
      },
      searchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid search request',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Batch search - POST /api/ai/search/batch
 */
async function handlePUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { queries } = body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Queries array is required'
      }, { status: 400 });
    }

    if (queries.length > 10) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 10 queries allowed per batch'
      }, { status: 400 });
    }

    // Generate embeddings for all queries
    const embeddingPromises = queries.map(async (query: any) => {
      const embedding = await aiOrchestrator.generateEmbeddings({ query: query.text });
      return {
        embedding,
        options: query.options || {}
      };
    });

    const embeddingQueries = await Promise.all(embeddingPromises);

    // Perform batch search
    const results = await optimizedVectorSearch.batchSearch(embeddingQueries);

    return NextResponse.json({
      success: true,
      data: {
        results,
        count: results.length,
        batchSize: queries.length
      },
      searchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Batch search error:', error);
    return NextResponse.json({
      success: false,
      error: 'Batch search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get search statistics - GET /api/ai/search/stats
 */
async function handleGET(request: NextRequest) {
  try {
    const searchStats = optimizedVectorSearch.getSearchStats();
    const aiStats = aiOrchestrator.getProcessingStats();

    return NextResponse.json({
      success: true,
      data: {
        search: searchStats,
        ai: aiStats
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get statistics'
    }, { status: 500 });
  }
}

// Apply authentication middleware and export
export const POST = withAuth(handlePOST);
export const PUT = withAuth(handlePUT);
export const GET = withAuth(handleGET);