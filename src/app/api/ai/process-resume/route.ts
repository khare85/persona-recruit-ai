import { NextRequest, NextResponse } from 'next/server';
import { aiProcessingService } from '@/services/aiProcessingService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Start resume processing with real-time updates
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { resumeUrl, candidateId } = body;

    if (!resumeUrl || !candidateId) {
      return NextResponse.json(
        { error: 'Resume URL and candidate ID are required' },
        { status: 400 }
      );
    }

    // Start processing asynchronously
    const processingPromise = aiProcessingService.processResumeWithUpdates(
      user.id,
      resumeUrl,
      candidateId
    );

    // Don't await the processing, just return the processing ID
    const processingId = await aiProcessingService.startProcessing(
      user.id,
      'resume_processing',
      { resumeUrl, candidateId }
    );

    // Process in background
    processingPromise.catch(error => {
      console.error('Resume processing failed:', error);
    });

    return NextResponse.json({
      success: true,
      data: {
        processingId,
        message: 'Resume processing started'
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}