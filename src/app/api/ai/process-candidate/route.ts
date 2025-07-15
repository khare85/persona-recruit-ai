/**
 * Optimized AI Candidate Processing API
 * Uses the new AI orchestrator for efficient processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { aiWorkerPool } from '@/workers/AIWorkerPool';
import { withAuth } from '@/lib/auth/middleware';
import { z } from 'zod';

// Request validation schema
const processRequestSchema = z.object({
  candidateId: z.string(),
  resume: z.string().optional(),
  videoPath: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  profile: z.object({
    name: z.string(),
    email: z.string().email(),
    title: z.string().optional(),
    experience: z.string().optional(),
    skills: z.array(z.string()).optional(),
    location: z.string().optional()
  })
});

/**
 * Process candidate with AI - POST /api/ai/process-candidate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = processRequestSchema.parse(body);

    const { candidateId, resume, videoPath, priority, profile } = validatedData;

    // For real-time processing (high priority)
    if (priority === 'high') {
      const result = await aiOrchestrator.processCandidateComplete({
        id: candidateId,
        resume,
        videoInterview: videoPath,
        profile
      });

      return NextResponse.json({
        success: true,
        data: result,
        processedAt: new Date().toISOString()
      });
    }

    // For background processing (medium/low priority)
    const job = await aiWorkerPool.addJob({
      id: `process-${candidateId}-${Date.now()}`,
      type: 'resume',
      priority,
      data: {
        candidateId,
        resume,
        videoPath,
        profile
      }
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'Candidate processing queued successfully'
    });

  } catch (error) {
    console.error('AI processing error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to process candidate',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Get processing status - GET /api/ai/process-candidate?jobId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { status: 400 });
    }

    const jobStatus = await aiWorkerPool.getJobStatus(jobId);
    
    if (!jobStatus) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: jobStatus
    });

  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get job status'
    }, { status: 500 });
  }
}

// Apply authentication middleware
export const POST_WITH_AUTH = withAuth(POST);
export const GET_WITH_AUTH = withAuth(GET);

// Export with middleware
export { POST_WITH_AUTH as POST, GET_WITH_AUTH as GET };