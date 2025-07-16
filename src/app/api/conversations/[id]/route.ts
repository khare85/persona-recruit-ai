import { NextRequest, NextResponse } from 'next/server';
import { messagingService } from '@/services/messagingService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Get conversation details
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

    const conversationId = params.id;
    const conversation = await messagingService.getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is participant
    if (!conversation.participants.includes(user.id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Update conversation (archive, etc.)
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

    const conversationId = params.id;
    const body = await req.json();
    const { action } = body;

    if (action === 'archive') {
      await messagingService.archiveConversation(conversationId, user.id);
      
      return NextResponse.json({
        success: true,
        data: { conversationId, action: 'archived' }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    return handleApiError(error);
  }
}