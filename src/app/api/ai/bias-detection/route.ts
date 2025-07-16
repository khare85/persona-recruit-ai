import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, AuthenticatedRequest } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { z } from 'zod';

const BiasDetectionSchema = z.object({
  type: z.enum(['hiring_decision', 'interview_analysis', 'candidate_scoring', 'job_description']),
  data: z.object({
    // For hiring decisions
    candidateData: z.object({
      name: z.string().optional(),
      resume: z.string().optional(),
      skills: z.array(z.string()).optional(),
      experience: z.string().optional(),
      education: z.string().optional(),
      demographics: z.object({
        age: z.number().optional(),
        gender: z.string().optional(),
        ethnicity: z.string().optional()
      }).optional()
    }).optional(),
    // For interview analysis
    interviewData: z.object({
      transcript: z.string().optional(),
      questions: z.array(z.string()).optional(),
      responses: z.array(z.string()).optional(),
      scores: z.record(z.number()).optional()
    }).optional(),
    // For job descriptions
    jobData: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      requirements: z.array(z.string()).optional(),
      benefits: z.array(z.string()).optional()
    }).optional(),
    // Decision/scoring context
    decision: z.string().optional(),
    reasoning: z.string().optional(),
    scores: z.record(z.number()).optional()
  })
});

/**
 * POST /api/ai/bias-detection - Analyze hiring data for potential bias
 */
async function handlePOST(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const userId = req.user!.id;
    
    // Validate input
    const validatedData = BiasDetectionSchema.parse(body);
    
    apiLogger.info('Starting bias detection analysis', {
      userId,
      type: validatedData.type,
      hasData: !!validatedData.data
    });

    // Perform bias detection using AI Orchestrator
    const biasReport = await aiOrchestrator.detectBias({
      analysisType: validatedData.type,
      inputData: validatedData.data,
      requestedBy: userId,
      timestamp: new Date().toISOString()
    });

    // Log the analysis for audit purposes
    apiLogger.info('Bias detection completed', {
      userId,
      type: validatedData.type,
      biasDetected: biasReport.biasDetected,
      riskLevel: biasReport.riskLevel,
      flagsCount: biasReport.flags?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: biasReport,
      message: 'Bias analysis completed successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }
    
    return handleApiError(error, 'bias detection analysis');
  }
}

export const POST = withRateLimit('bias-detection', 
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], handlePOST)
  )
);