import { NextRequest, NextResponse } from 'next/server';
import { jobStatusService } from '@/services/jobStatusService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

/**
 * Get application status history
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

    const applicationId = params.id;
    const history = await jobStatusService.getApplicationStatusHistory(applicationId);

    return NextResponse.json({
      success: true,
      data: history
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Update application status
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

    // Check if user has permission to update application status
    if (!['recruiter', 'company_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const applicationId = params.id;
    const body = await req.json();
    const { status, reason, metadata } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = [
      'submitted',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'rejected',
      'withdrawn',
      'hired'
    ];
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    await jobStatusService.updateApplicationStatus(
      applicationId,
      status,
      user.id,
      reason,
      metadata
    );

    apiLogger.info('Application status updated via API', {
      applicationId,
      status,
      updatedBy: user.id,
      reason
    });

    return NextResponse.json({
      success: true,
      data: {
        applicationId,
        status,
        updatedBy: user.id,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}