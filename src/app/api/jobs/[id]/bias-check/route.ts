import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, AuthenticatedRequest } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { databaseService } from '@/services/database.service';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

/**
 * POST /api/jobs/[id]/bias-check - Check job description for bias
 */
async function handlePOST(req: AuthenticatedRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const jobId = params.id;
    const userId = req.user!.id;
    
    apiLogger.info('Starting job description bias check', {
      jobId,
      userId
    });

    // Get job data
    const job = await databaseService.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if user has permission to access this job
    const hasPermission = job.companyId === req.user?.companyId || 
                         req.user?.role === 'super_admin';

    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prepare job data for bias analysis
    const biasAnalysisData = {
      jobData: {
        title: job.title,
        description: job.description,
        requirements: job.requirements || [],
        benefits: job.benefits || [],
        location: job.location,
        type: job.type,
        salaryRange: job.salaryRange,
        experienceLevel: job.experienceLevel
      }
    };

    // Perform bias detection
    const biasReport = await aiOrchestrator.detectBias({
      analysisType: 'job_description',
      inputData: biasAnalysisData,
      requestedBy: userId,
      timestamp: new Date().toISOString()
    });

    // Store bias check result in job
    await databaseService.updateJob(jobId, {
      biasCheckResult: {
        ...biasReport,
        checkedAt: new Date().toISOString(),
        checkedBy: userId
      }
    });

    // Log for audit
    apiLogger.info('Job description bias check completed', {
      jobId,
      userId,
      biasDetected: biasReport.biasDetected,
      riskLevel: biasReport.riskLevel,
      flagsCount: biasReport.flags?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: biasReport,
      message: 'Job description bias check completed successfully'
    });

  } catch (error) {
    return handleApiError(error, 'job description bias check');
  }
}

/**
 * GET /api/jobs/[id]/bias-check - Get existing bias check results
 */
async function handleGET(req: AuthenticatedRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const jobId = params.id;
    
    const job = await databaseService.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check permissions
    const hasPermission = job.companyId === req.user?.companyId || 
                         req.user?.role === 'super_admin';

    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!job.biasCheckResult) {
      return NextResponse.json({ error: 'No bias check results available' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: job.biasCheckResult
    });

  } catch (error) {
    return handleApiError(error, 'get job bias check');
  }
}

export const POST = withRateLimit('bias-check', 
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], handlePOST)
  )
);
export const GET = withRateLimit('bias-check', 
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], handleGET)
  )
);