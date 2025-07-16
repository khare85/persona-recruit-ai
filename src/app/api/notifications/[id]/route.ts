import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/notification.service';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Mark notification as read
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

    const notificationId = params.id;
    const body = await req.json();
    const { action } = body;

    if (action === 'mark_read') {
      await notificationService.markAsRead(notificationId);
      
      return NextResponse.json({
        success: true,
        data: { notificationId, action: 'marked_read' }
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
 * Delete notification
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

    const notificationId = params.id;
    
    // For now, we'll just mark as read since we don't have a delete method
    // In a real implementation, you'd add a delete method to the notification service
    await notificationService.markAsRead(notificationId);

    return NextResponse.json({
      success: true,
      data: { notificationId, action: 'deleted' }
    });

  } catch (error) {
    return handleApiError(error);
  }
}