import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { notificationService } from '@/services/notification.service';

/**
 * GET /api/notifications - Get user notifications with pagination
 */
export const GET = withRateLimit('standard',
  withAuth(async (req: NextRequest): Promise<NextResponse> => {
    try {
      const userId = req.user!.id;
      const { searchParams } = new URL(req.url);
      
      const limit = parseInt(searchParams.get('limit') || '20');
      const offset = parseInt(searchParams.get('offset') || '0');
      const unreadOnly = searchParams.get('unreadOnly') === 'true';
      const category = searchParams.get('category') as any;

      apiLogger.info('Fetching user notifications', {
        userId,
        limit,
        offset,
        unreadOnly,
        category
      });

      const result = await notificationService.getUserNotifications(userId, {
        limit,
        offset,
        unreadOnly,
        category
      });

      return NextResponse.json({
        success: true,
        data: {
          notifications: result.notifications,
          pagination: {
            total: result.total,
            limit,
            offset,
            hasMore: offset + limit < result.total
          },
          unreadCount: result.unreadCount
        }
      });

    } catch (error) {
      apiLogger.error('Failed to fetch notifications', {
        userId: req.user?.id,
        error: String(error)
      });
      return handleApiError(error);
    }
  })
);

/**
 * POST /api/notifications - Send a notification (admin/system use)
 */
export const POST = withRateLimit('create',
  withAuth(async (req: NextRequest): Promise<NextResponse> => {
    try {
      const userId = req.user!.id;
      const body = await req.json();

      const {
        targetUserId,
        type,
        data,
        customTitle,
        customMessage,
        actions,
        overridePreferences
      } = body;

      // Only allow users to send notifications to themselves or if they're admin
      if (targetUserId !== userId && req.user!.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized to send notifications to other users' },
          { status: 403 }
        );
      }

      apiLogger.info('Sending notification', {
        fromUserId: userId,
        targetUserId,
        type
      });

      const result = await notificationService.sendNotification({
        userId: targetUserId,
        type,
        data,
        customTitle,
        customMessage,
        actions,
        overridePreferences
      });

      return NextResponse.json({
        success: true,
        data: {
          inAppSent: result.inApp,
          emailSent: result.email
        }
      });

    } catch (error) {
      apiLogger.error('Failed to send notification', {
        userId: req.user?.id,
        error: String(error)
      });
      return handleApiError(error);
    }
  })
);