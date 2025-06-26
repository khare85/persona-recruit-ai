import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/admin/jobs - Get all jobs with admin-level details
 */
export const GET = withAuth(
  withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const status = searchParams.get('status') || '';
      const search = searchParams.get('search') || '';

      const options = {
        limit,
        offset: (page - 1) * limit,
        status: status !== 'all' ? status : undefined,
      };

      apiLogger.info('Admin jobs list requested', { userId: req.user?.id, options });

      // Get jobs from database
      let { items: jobs, total, hasMore } = await databaseService.listJobs(options);

      // Filter by search if provided
      if (search) {
        jobs = jobs.filter(job => 
          job.title?.toLowerCase().includes(search.toLowerCase()) ||
          job.description?.toLowerCase().includes(search.toLowerCase()) ||
          job.companyName?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Calculate job statistics
      const jobStats = {
        total: jobs.length,
        active: jobs.filter(job => job.status === 'active').length,
        paused: jobs.filter(job => job.status === 'paused').length,
        closed: jobs.filter(job => job.status === 'closed').length,
        draft: jobs.filter(job => job.status === 'draft').length,
      };

      return NextResponse.json({
        success: true,
        data: {
          jobs: jobs.slice(0, limit),
          stats: jobStats,
          pagination: {
            page,
            limit,
            total: jobs.length,
            totalPages: Math.ceil(jobs.length / limit),
            hasMore: jobs.length > limit * page,
          },
        },
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);