import { NextRequest, NextResponse } from 'next/server';
import { jobStatusService } from '@/services/jobStatusService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

/**
 * Get job status history
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = params.id;
    const history = await jobStatusService.getJobStatusHistory(jobId);

    return NextResponse.json({
      success: true,
      data: history
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Update job status
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update job status
    if (!['recruiter', 'company_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const jobId = params.id;
    const body = await req.json();
    const { status, reason, metadata } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['draft', 'active', 'paused', 'closed', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    await jobStatusService.updateJobStatus(
      jobId,
      status,
      user.id,
      reason,
      metadata
    );

    // Get updated job stats
    const stats = await jobStatusService.getJobStats(jobId);

    apiLogger.info('Job status updated via API', {
      jobId,
      status,
      updatedBy: user.id,
      reason
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        status,
        stats,
        updatedBy: user.id,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}