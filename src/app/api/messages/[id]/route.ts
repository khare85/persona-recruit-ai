import { NextRequest, NextResponse } from 'next/server';
import { messagingService } from '@/services/messagingService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Mark message as read
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

    const messageId = params.id;
    const body = await req.json();
    const { action } = body;

    if (action === 'mark_read') {
      await messagingService.markAsRead(messageId, user.id);
      
      return NextResponse.json({
        success: true,
        data: { messageId, action: 'marked_read' }
      });
    }

    if (action === 'add_reaction') {
      const { emoji } = body;
      if (!emoji) {
        return NextResponse.json(
          { error: 'Emoji is required for reaction' },
          { status: 400 }
        );
      }

      await messagingService.addReaction(messageId, user.id, emoji);
      
      return NextResponse.json({
        success: true,
        data: { messageId, action: 'reaction_added', emoji }
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

/**
 * Delete message
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = params.id;
    await messagingService.deleteMessage(messageId, user.id);

    return NextResponse.json({
      success: true,
      data: { messageId, action: 'deleted' }
    });

  } catch (error) {
    return handleApiError(error);
  }
}