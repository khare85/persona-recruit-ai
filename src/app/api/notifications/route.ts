import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/notification.service';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Get user notifications
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const notifications = await notificationService.getUserNotifications(user.id, limit, offset);

    return NextResponse.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    return handleApiError(error);
  }
}