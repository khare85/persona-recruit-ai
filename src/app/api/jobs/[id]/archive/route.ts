import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/jobs/[id]/archive - Archive a job
 */
export const POST = withAuth(
  withRole(['recruiter', 'company_admin'], async (request: NextRequest, { params }: RouteParams) => {
    try {
      const { id } = params;
      const userId = request.user!.id;
      
      // Check if job exists and user has permission
      const existingJob = await databaseService.getJobById(id);
      if (!existingJob) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      // Verify user has access to this job
      if (request.user!.role === 'recruiter' && existingJob.recruiterId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized access to job' },
          { status: 403 }
        );
      }

      // Check if job is already archived
      if (existingJob.status === 'archived') {
        return NextResponse.json(
          { error: 'Job is already archived' },
          { status: 400 }
        );
      }

      // Archive the job
      await databaseService.updateJob(id, {
        status: 'archived',
        closedAt: new Date(),
        updatedAt: new Date()
      });

      const archivedJob = await databaseService.getJobById(id);

      apiLogger.info('Job archived', {
        jobId: id,
        userId,
        jobTitle: existingJob.title
      });
      
      return NextResponse.json({
        success: true,
        message: 'Job archived successfully',
        data: archivedJob
      });
      
    } catch (error) {
      return handleApiError(error);
    }
  })
);

/**
 * DELETE /api/jobs/[id]/archive - Unarchive a job
 */
export const DELETE = withAuth(
  withRole(['recruiter', 'company_admin'], async (request: NextRequest, { params }: RouteParams) => {
    try {
      const { id } = params;
      const userId = request.user!.id;
      
      // Check if job exists and user has permission
      const existingJob = await databaseService.getJobById(id);
      if (!existingJob) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      // Verify user has access to this job
      if (request.user!.role === 'recruiter' && existingJob.recruiterId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized access to job' },
          { status: 403 }
        );
      }

      // Check if job is archived
      if (existingJob.status !== 'archived') {
        return NextResponse.json(
          { error: 'Job is not archived' },
          { status: 400 }
        );
      }

      // Unarchive the job (set to draft for review before making active)
      await databaseService.updateJob(id, {
        status: 'draft',
        closedAt: null,
        updatedAt: new Date()
      });

      const unarchivedJob = await databaseService.getJobById(id);

      apiLogger.info('Job unarchived', {
        jobId: id,
        userId,
        jobTitle: existingJob.title
      });
      
      return NextResponse.json({
        success: true,
        message: 'Job unarchived successfully. Status set to draft for review.',
        data: unarchivedJob
      });
      
    } catch (error) {
      return handleApiError(error);
    }
  })
);