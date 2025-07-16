import { NextRequest, NextResponse } from 'next/server';
import { aiProcessingService } from '@/services/aiProcessingService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Cancel AI processing
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const processingId = params.id;
    
    // Get processing status to verify ownership
    const processing = await aiProcessingService.getProcessingStatus(processingId);
    if (!processing) {
      return NextResponse.json({ error: 'Processing not found' }, { status: 404 });
    }

    if (processing.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (processing.status === 'completed' || processing.status === 'failed') {
      return NextResponse.json({ error: 'Processing already completed' }, { status: 400 });
    }

    await aiProcessingService.cancelProcessing(processingId);

    return NextResponse.json({
      success: true,
      data: {
        processingId,
        message: 'Processing cancelled'
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}