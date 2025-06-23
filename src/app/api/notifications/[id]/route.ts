import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { notificationService } from '@/services/notification.service';

/**
 * PATCH /api/notifications/[id] - Mark notification as read
 */
export const PATCH = withRateLimit('standard',
  withAuth(async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
    try {
      const userId = req.user!.id;
      const notificationId = params.id;
      const body = await req.json();

      const { action } = body;

      if (action === 'mark_read') {
        apiLogger.info('Marking notification as read', {
          userId,
          notificationId
        });

        const success = await notificationService.markAsRead(userId, notificationId);

        if (!success) {
          return NextResponse.json(
            { error: 'Failed to mark notification as read' },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Notification marked as read'
        });
      }

      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );

    } catch (error) {
      apiLogger.error('Failed to update notification', {
        userId: req.user?.id,
        notificationId: params.id,
        error: String(error)
      });
      return handleApiError(error);
    }
  })
);

/**
 * DELETE /api/notifications/[id] - Delete notification
 */
export const DELETE = withRateLimit('delete',
  withAuth(async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
    try {
      const userId = req.user!.id;
      const notificationId = params.id;

      apiLogger.info('Deleting notification', {
        userId,
        notificationId
      });

      const success = await notificationService.deleteNotification(userId, notificationId);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to delete notification' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notification deleted successfully'
      });

    } catch (error) {
      apiLogger.error('Failed to delete notification', {
        userId: req.user?.id,
        notificationId: params.id,
        error: String(error)
      });
      return handleApiError(error);
    }
  })
);