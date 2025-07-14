/**
 * Job Status Tracking API
 * Provides real-time status updates for background jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { BackgroundJobService } from '@/lib/backgroundJobs';

/**
 * GET /api/jobs/status?jobId=xxx&queue=video
 */
export const GET = withRateLimit('standard',
  withAuth(async (request: NextRequest): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(request.url);
      const jobId = searchParams.get('jobId');
      const queueName = searchParams.get('queue') as 'video' | 'document' | 'ai';

      if (!jobId) {
        return NextResponse.json(
          { error: 'Job ID is required' },
          { status: 400 }
        );
      }

      if (!queueName || !['video', 'document', 'ai'].includes(queueName)) {
        return NextResponse.json(
          { error: 'Valid queue name is required (video, document, ai)' },
          { status: 400 }
        );
      }

      const jobStatus = await BackgroundJobService.getJobStatus(jobId, queueName);

      if (jobStatus.status === 'not_found') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      apiLogger.info('Job status retrieved', {
        jobId,
        queueName,
        status: jobStatus.status,
        userId: request.user?.id
      });

      return NextResponse.json({
        success: true,
        data: jobStatus
      });

    } catch (error) {
      apiLogger.error('Failed to get job status', {
        error: String(error),
        userId: request.user?.id
      });
      return handleApiError(error);
    }
  })
);

/**
 * GET /api/jobs/status/multiple - Get status for multiple jobs
 */
export const POST = withRateLimit('standard',
  withAuth(async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const { jobs } = body;

      if (!Array.isArray(jobs) || jobs.length === 0) {
        return NextResponse.json(
          { error: 'Jobs array is required' },
          { status: 400 }
        );
      }

      if (jobs.length > 20) {
        return NextResponse.json(
          { error: 'Maximum 20 jobs can be checked at once' },
          { status: 400 }
        );
      }

      const jobStatuses = await Promise.all(
        jobs.map(async (job: { jobId: string; queue: 'video' | 'document' | 'ai' }) => {
          try {
            const status = await BackgroundJobService.getJobStatus(job.jobId, job.queue);
            return {
              jobId: job.jobId,
              queue: job.queue,
              ...status
            };
          } catch (error) {
            return {
              jobId: job.jobId,
              queue: job.queue,
              status: 'error',
              error: String(error)
            };
          }
        })
      );

      apiLogger.info('Multiple job statuses retrieved', {
        jobCount: jobs.length,
        userId: request.user?.id
      });

      return NextResponse.json({
        success: true,
        data: jobStatuses
      });

    } catch (error) {
      apiLogger.error('Failed to get multiple job statuses', {
        error: String(error),
        userId: request.user?.id
      });
      return handleApiError(error);
    }
  })
);