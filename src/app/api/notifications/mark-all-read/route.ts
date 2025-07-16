import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/notification.service';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Mark all notifications as read
 */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await notificationService.markAllAsRead(user.id);

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    return handleApiError(error);
  }
}