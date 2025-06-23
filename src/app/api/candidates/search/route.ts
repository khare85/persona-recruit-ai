import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { embeddingDatabaseService } from '@/services/embeddingDatabase.service';
import { textEmbeddingService } from '@/services/textEmbedding.service';

const candidateSearchSchema = z.object({
  query: z.string().optional(),
  embedding: z.array(z.number()).optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
  location: z.string().optional(),
  topN: z.number().min(1).max(50).default(10)
});

/**
 * POST /api/candidates/search - Search candidates using vector embeddings and filters
 */
export const POST = withRateLimit('search',
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const body = await req.json();
        const validation = candidateSearchSchema.safeParse(body);

        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid search parameters',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const { query, embedding, skills, experience, location, topN } = validation.data;

        apiLogger.info('Candidate search requested', {
          userId: req.user?.id,
          hasQuery: !!query,
          hasEmbedding: !!embedding,
          hasFilters: !!(skills || experience || location),
          topN
        });

        let results = [];

        if (embedding && embedding.length > 0) {
          // Use provided embedding for vector search
          results = await embeddingDatabaseService.searchCandidatesByEmbedding(embedding, topN);
        } else if (query) {
          // Generate embedding from query text
          apiLogger.info('Text query provided, generating embedding', { query });
          
          const textEmbedding = await textEmbeddingService.generateQueryEmbedding(query);
          results = await embeddingDatabaseService.searchCandidatesByEmbedding(textEmbedding, topN);
        } else {
          // Hybrid search with filters
          const hybridResults = await embeddingDatabaseService.hybridCandidateSearch({
            skills,
            experience,
            location,
            topN
          });
          
          return NextResponse.json({
            success: true,
            data: {
              vectorResults: hybridResults.vectorResults,
              filterResults: hybridResults.filterResults,
              searchType: 'hybrid'
            }
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            candidates: results,
            searchType: 'vector',
            totalResults: results.length
          }
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);