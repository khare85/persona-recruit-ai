import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { candidateScoringService } from '@/services/candidateScoringService';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

// Validation schema for candidate scoring request
const candidateScoringSchema = z.object({
  candidate: z.object({
    id: z.string(),
    fullName: z.string(),
    currentTitle: z.string(),
    skills: z.array(z.string()),
    experience: z.string(),
    summary: z.string(),
    resumeText: z.string().optional()
  }),
  job: z.object({
    id: z.string(),
    title: z.string(),
    mustHaveRequirements: z.array(z.string()),
    skills: z.array(z.string()),
    experience: z.string(),
    description: z.string()
  }),
  detailed: z.boolean().default(true)
});

const batchScoringSchema = z.object({
  candidates: z.array(z.object({
    id: z.string(),
    fullName: z.string(),
    currentTitle: z.string(),
    skills: z.array(z.string()),
    experience: z.string(),
    summary: z.string(),
    resumeText: z.string().optional()
  })),
  job: z.object({
    id: z.string(),
    title: z.string(),
    mustHaveRequirements: z.array(z.string()),
    skills: z.array(z.string()),
    experience: z.string(),
    description: z.string()
  })
});

/**
 * Score a single candidate against job requirements
 */
export const POST = withRateLimit('ai', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const validation = candidateScoringSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid scoring request data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { candidate, job, detailed } = validation.data;

    apiLogger.info('Candidate scoring requested', {
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      jobId: job.id,
      jobTitle: job.title,
      detailed
    });

    let result;
    if (detailed) {
      result = await candidateScoringService.scoreCandidate(candidate, job);
    } else {
      const quickScore = await candidateScoringService.quickScore(candidate, job);
      result = { overallScore: quickScore };
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Candidate scored successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * Score multiple candidates against job requirements (batch processing)
 */
export const PUT = withRateLimit('ai', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const validation = batchScoringSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid batch scoring request data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { candidates, job } = validation.data;

    if (candidates.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 candidates allowed per batch request' },
        { status: 400 }
      );
    }

    apiLogger.info('Batch candidate scoring requested', {
      candidatesCount: candidates.length,
      jobId: job.id,
      jobTitle: job.title
    });

    const results = await candidateScoringService.scoreBatchCandidates(candidates, job);

    return NextResponse.json({
      success: true,
      data: {
        scores: results,
        totalCandidates: candidates.length,
        scoredCandidates: results.length
      },
      message: `${results.length}/${candidates.length} candidates scored successfully`
    });

  } catch (error) {
    return handleApiError(error);
  }
});