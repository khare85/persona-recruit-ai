import { NextRequest, NextResponse } from 'next/server';
import { advancedCandidateJobMatching } from '@/ai/flows/advanced-candidate-job-matching-flow';
import { z } from 'zod';

// Input validation schema
const advancedMatchSchema = z.object({
  jobId: z.string().optional(),
  jobDescriptionText: z.string().min(50).max(5000),
  companyInformation: z.string().min(10).max(1000),
  semanticSearchResultCount: z.number().min(5).max(100).default(20),
  finalResultCount: z.number().min(1).max(20).default(10)
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = advancedMatchSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { 
      jobId,
      jobDescriptionText, 
      companyInformation, 
      semanticSearchResultCount,
      finalResultCount 
    } = validation.data;

    // Perform advanced matching
    const matchResults = await advancedCandidateJobMatching({
      jobDescriptionText,
      companyInformation,
      semanticSearchResultCount,
      finalResultCount
    });

    return NextResponse.json({
      success: true,
      data: {
        candidates: matchResults.rerankedCandidates.map(candidate => ({
          candidateId: candidate.candidateId,
          fullName: candidate.fullName,
          currentTitle: candidate.currentTitle,
          matchScore: candidate.llmMatchScore,
          semanticScore: candidate.semanticMatchScore,
          matchJustification: candidate.llmJustification,
          profileSummaryExcerpt: candidate.profileSummaryExcerpt,
          topSkills: candidate.topSkills,
          availability: candidate.availability
        })),
        searchSummary: matchResults.searchSummary,
        totalCandidates: matchResults.rerankedCandidates.length,
        jobId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Advanced Match API Error:', error);
    
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