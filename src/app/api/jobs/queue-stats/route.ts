/**
 * Queue Statistics API
 * Provides monitoring data for background job queues
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { BackgroundJobService } from '@/lib/backgroundJobs';

/**
 * GET /api/jobs/queue-stats - Get queue statistics (admin only)
 */
export const GET = withRateLimit('standard',
  withAuth(
    withRole(['admin', 'super_admin'], async (request: NextRequest): Promise<NextResponse> => {
      try {
        const queueStats = await BackgroundJobService.getQueueStats();
        const healthCheck = await BackgroundJobService.healthCheck();

        apiLogger.info('Queue statistics retrieved', {
          userId: request.user?.id,
          totalJobs: queueStats.video.total + queueStats.document.total + queueStats.ai.total
        });

        return NextResponse.json({
          success: true,
          data: {
            stats: queueStats,
            health: healthCheck,
            summary: {
              totalActiveJobs: queueStats.video.active + queueStats.document.active + queueStats.ai.active,
              totalWaitingJobs: queueStats.video.waiting + queueStats.document.waiting + queueStats.ai.waiting,
              totalFailedJobs: queueStats.video.failed + queueStats.document.failed + queueStats.ai.failed,
              totalCompletedJobs: queueStats.video.completed + queueStats.document.completed + queueStats.ai.completed,
            }
          }
        });

      } catch (error) {
        apiLogger.error('Failed to get queue statistics', {
          error: String(error),
          userId: request.user?.id
        });
        return handleApiError(error);
      }
    })
  )
);