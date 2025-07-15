
import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database.service';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { z } from 'zod';

// Job update schema
const jobUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(100).optional(),
  type: z.enum(['full-time', 'part-time', 'contract', 'remote', 'internship']).optional(),
  department: z.string().min(1).max(50).optional(),
  experience: z.string().optional(),
  salary: z.string().optional(),
  description: z.string().min(50).max(5000).optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  status: z.enum(['active', 'closed', 'draft']).optional()
});

// GET /api/jobs/[id] - Get a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const job = await databaseService.getJobById(id);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: job
    });
    
  } catch (error) {
    console.error('GET /api/jobs/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[id] - Update a job
export const PUT = withAuth(
  withRole(['recruiter', 'company_admin'], async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    try {
      const { id } = params;
      const userId = request.user!.id;
      const body = await request.json();
      
      const validation = jobUpdateSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'Invalid update data', 
            details: validation.error.errors 
          },
          { status: 400 }
        );
      }

      // Check if user has permission to update this job
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

      const updateData = {
        ...validation.data,
        updatedAt: new Date()
      };

      await databaseService.updateJob(id, updateData);
      const updatedJob = await databaseService.getJobById(id);

      apiLogger.info('Job updated', {
        jobId: id,
        userId,
        updatedFields: Object.keys(validation.data)
      });
      
      return NextResponse.json({
        success: true,
        data: updatedJob
      });
      
    } catch (error) {
      return handleApiError(error);
    }
  })
);

// DELETE /api/jobs/[id] - Delete a job
export const DELETE = withAuth(
  withRole(['company_admin'], async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
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

      // Only allow deletion if job has no applications or it's in draft status
      const applications = await databaseService.getJobApplications(id);
      if (applications.length > 0 && existingJob.status !== 'draft') {
        return NextResponse.json(
          { error: 'Cannot delete job with existing applications. Archive it instead.' },
          { status: 400 }
        );
      }

      await databaseService.deleteJob(id);

      apiLogger.info('Job deleted', {
        jobId: id,
        userId,
        jobTitle: existingJob.title
      });
      
      return NextResponse.json({
        success: true,
        message: 'Job deleted successfully'
      });
      
    } catch (error) {
      return handleApiError(error);
    }
  })
);
