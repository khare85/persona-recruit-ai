import { NextRequest, NextResponse } from 'next/server';
import { aiProcessingService } from '@/services/aiProcessingService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Start video analysis with real-time updates
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { interviewId, videoUrl } = body;

    if (!interviewId || !videoUrl) {
      return NextResponse.json(
        { error: 'Interview ID and video URL are required' },
        { status: 400 }
      );
    }

    // Start processing asynchronously
    const processingPromise = aiProcessingService.processVideoAnalysisWithUpdates(
      user.id,
      interviewId,
      videoUrl
    );

    // Don't await the processing, just return the processing ID
    const processingId = await aiProcessingService.startProcessing(
      user.id,
      'video_analysis',
      { interviewId, videoUrl }
    );

    // Process in background
    processingPromise.catch(error => {
      console.error('Video analysis failed:', error);
    });

    return NextResponse.json({
      success: true,
      data: {
        processingId,
        message: 'Video analysis started'
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}