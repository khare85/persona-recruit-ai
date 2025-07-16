import { NextRequest, NextResponse } from 'next/server';
import { messagingService } from '@/services/messagingService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Get user conversations
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const conversations = await messagingService.getUserConversations(user.id, limit);

    return NextResponse.json({
      success: true,
      data: conversations
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Create a new conversation
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, participantId, jobId, applicationId } = body;

    if (!type || !participantId) {
      return NextResponse.json(
        { error: 'Type and participant ID are required' },
        { status: 400 }
      );
    }

    let conversation;

    if (type === 'direct') {
      conversation = await messagingService.createDirectConversation(user.id, participantId);
    } else if (type === 'job_application') {
      if (!jobId || !applicationId) {
        return NextResponse.json(
          { error: 'Job ID and Application ID are required for job application conversations' },
          { status: 400 }
        );
      }
      conversation = await messagingService.createJobApplicationConversation(
        user.id,
        participantId,
        jobId,
        applicationId
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid conversation type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    return handleApiError(error);
  }
}