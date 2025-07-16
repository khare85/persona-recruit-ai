import { NextRequest, NextResponse } from 'next/server';
import { messagingService } from '@/services/messagingService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Send a message
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      recipientId, 
      content, 
      type = 'text', 
      conversationId, 
      metadata, 
      replyToId 
    } = body;

    if (!recipientId || !content) {
      return NextResponse.json(
        { error: 'Recipient ID and content are required' },
        { status: 400 }
      );
    }

    const message = await messagingService.sendMessage(
      user.id,
      recipientId,
      content,
      type,
      conversationId,
      metadata,
      replyToId
    );

    return NextResponse.json({
      success: true,
      data: message
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get messages for a conversation
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before') ? new Date(searchParams.get('before')!) : undefined;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const messages = await messagingService.getMessages(
      conversationId,
      limit,
      before,
      user.id
    );

    return NextResponse.json({
      success: true,
      data: messages
    });

  } catch (error) {
    return handleApiError(error);
  }
}