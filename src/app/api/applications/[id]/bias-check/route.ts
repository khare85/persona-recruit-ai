import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole, AuthenticatedRequest } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { databaseService } from '@/services/database.service';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

/**
 * POST /api/applications/[id]/bias-check - Check application decision for bias
 */
async function handlePOST(req: AuthenticatedRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const applicationId = params.id;
    const userId = req.user!.id;
    const { decision, reasoning } = await req.json();
    
    apiLogger.info('Starting application bias check', {
      applicationId,
      userId,
      decision
    });

    // Get application data
    const application = await databaseService.getJobApplicationById(applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get related data
    const [candidate, job] = await Promise.all([
      databaseService.getCandidateProfile(application.candidateId),
      databaseService.getJobById(application.jobId)
    ]);

    if (!candidate || !job) {
      return NextResponse.json({ error: 'Missing candidate or job data' }, { status: 400 });
    }

    // Get user data for candidate name
    const candidateUser = await databaseService.getUserById(application.candidateId);
    
    // Prepare data for bias analysis
    const biasAnalysisData = {
      candidateData: {
        name: candidateUser ? `${candidateUser.firstName} ${candidateUser.lastName}` : 'Anonymous',
        resume: candidate.summary || '',
        skills: candidate.skills || [],
        experience: candidate.experience || '',
        currentTitle: candidate.currentTitle || ''
      },
      jobData: {
        title: job.title,
        description: job.description,
        requirements: job.requirements || [],
        benefits: job.benefits || []
      },
      decision,
      reasoning,
      applicationStatus: application.status,
      applicationDate: application.createdAt
    };

    // Perform bias detection
    const biasReport = await aiOrchestrator.detectBias({
      analysisType: 'hiring_decision',
      inputData: biasAnalysisData,
      requestedBy: userId,
      timestamp: new Date().toISOString()
    });

    // Store bias check result in application
    await databaseService.updateJobApplication(applicationId, {
      biasCheckResult: {
        ...biasReport,
        checkedAt: new Date().toISOString(),
        checkedBy: userId
      }
    });

    // Log for audit
    apiLogger.info('Application bias check completed', {
      applicationId,
      userId,
      decision,
      biasDetected: biasReport.biasDetected,
      riskLevel: biasReport.riskLevel,
      flagsCount: biasReport.flags?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: biasReport,
      message: 'Bias check completed successfully'
    });

  } catch (error) {
    return handleApiError(error, 'application bias check');
  }
}

/**
 * GET /api/applications/[id]/bias-check - Get existing bias check results
 */
async function handleGET(req: AuthenticatedRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const applicationId = params.id;
    
    const application = await databaseService.getJobApplicationById(applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!application.biasCheckResult) {
      return NextResponse.json({ error: 'No bias check results available' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: application.biasCheckResult
    });

  } catch (error) {
    return handleApiError(error, 'get application bias check');
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