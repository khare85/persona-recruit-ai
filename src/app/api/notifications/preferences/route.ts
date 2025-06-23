import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { notificationService } from '@/services/notification.service';

/**
 * GET /api/notifications/preferences - Get user notification preferences
 */
export const GET = withRateLimit('standard',
  withAuth(async (req: NextRequest): Promise<NextResponse> => {
    try {
      const userId = req.user!.id;

      apiLogger.info('Fetching notification preferences', { userId });

      const preferences = await notificationService.getUserPreferences(userId);

      return NextResponse.json({
        success: true,
        data: preferences
      });

    } catch (error) {
      apiLogger.error('Failed to fetch notification preferences', {
        userId: req.user?.id,
        error: String(error)
      });
      return handleApiError(error);
    }
  })
);

/**
 * PUT /api/notifications/preferences - Update user notification preferences
 */
export const PUT = withRateLimit('update',
  withAuth(async (req: NextRequest): Promise<NextResponse> => {
    try {
      const userId = req.user!.id;
      const body = await req.json();

      const {
        emailNotifications,
        inAppNotifications,
        frequency,
        quietHours
      } = body;

      apiLogger.info('Updating notification preferences', {
        userId,
        preferences: Object.keys(body)
      });

      // Validate preferences structure
      const updates: any = {};
      
      if (emailNotifications) {
        updates.emailNotifications = emailNotifications;
      }
      
      if (inAppNotifications) {
        updates.inAppNotifications = inAppNotifications;
      }
      
      if (frequency && ['immediate', 'daily', 'weekly'].includes(frequency)) {
        updates.frequency = frequency;
      }
      
      if (quietHours) {
        updates.quietHours = quietHours;
      }

      const success = await notificationService.updateUserPreferences(userId, updates);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update notification preferences' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notification preferences updated successfully'
      });

    } catch (error) {
      apiLogger.error('Failed to update notification preferences', {
        userId: req.user?.id,
        error: String(error)
      });
      return handleApiError(error);
    }
  })
);