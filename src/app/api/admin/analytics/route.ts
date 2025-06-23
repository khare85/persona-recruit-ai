import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/admin/analytics - Get system-wide analytics data for super admins
 */
export const GET = withRateLimit('system_analytics',
  withAuth(
    withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;

        apiLogger.info('Fetching system analytics', { userId });

        const analytics = await databaseService.getSystemAnalytics();

        return NextResponse.json({
          success: true,
          analytics
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);