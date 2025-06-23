import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { notificationService } from '@/services/notification.service';

/**
 * POST /api/notifications/mark-all-read - Mark all notifications as read for the user
 */
export const POST = withRateLimit('update',
  withAuth(async (req: NextRequest): Promise<NextResponse> => {
    try {
      const userId = req.user!.id;

      apiLogger.info('Marking all notifications as read', { userId });

      const success = await notificationService.markAllAsRead(userId);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to mark all notifications as read' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });

    } catch (error) {
      apiLogger.error('Failed to mark all notifications as read', {
        userId: req.user?.id,
        error: String(error)
      });
      return handleApiError(error);
    }
  })
);