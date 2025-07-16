import { NextRequest, NextResponse } from 'next/server';
import { aiProcessingService } from '@/services/aiProcessingService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Start job matching with real-time updates
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to run job matching
    if (!['recruiter', 'company_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { jobId, candidateIds } = body;

    if (!jobId || !candidateIds || !Array.isArray(candidateIds)) {
      return NextResponse.json(
        { error: 'Job ID and candidate IDs array are required' },
        { status: 400 }
      );
    }

    if (candidateIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one candidate ID is required' },
        { status: 400 }
      );
    }

    // Start processing asynchronously
    const processingPromise = aiProcessingService.processJobMatchingWithUpdates(
      user.id,
      jobId,
      candidateIds
    );

    // Don't await the processing, just return the processing ID
    const processingId = await aiProcessingService.startProcessing(
      user.id,
      'job_matching',
      { jobId, candidateCount: candidateIds.length }
    );

    // Process in background
    processingPromise.catch(error => {
      console.error('Job matching failed:', error);
    });

    return NextResponse.json({
      success: true,
      data: {
        processingId,
        message: `Job matching started for ${candidateIds.length} candidates`
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}