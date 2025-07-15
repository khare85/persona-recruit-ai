import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/recruiter/jobs - Get jobs assigned to recruiter
 */
export const GET = withAuth(
  withRole(['recruiter'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const recruiterId = req.user!.id;
      const companyId = req.user!.companyId;

      if (!companyId) {
        return NextResponse.json({ error: 'Recruiter not associated with a company' }, { status: 400 });
      }

      apiLogger.info('Fetching recruiter jobs', { recruiterId, companyId });

      // Get jobs assigned to this recruiter
      const jobs = await databaseService.listJobs({ recruiterId });
      
      // Get applications for all jobs to calculate stats
      const allApplications = await databaseService.getCompanyApplications({ companyId });

      // Calculate stats for each job
      const enrichedJobs = jobs.items.map(job => {
        const jobApplications = allApplications.filter(app => app.jobId === job.id);
        const jobHires = jobApplications.filter(app => app.status === 'hired').length;
        
        return {
          id: job.id,
          title: job.title,
          department: job.department,
          location: job.location,
          employmentType: job.type,
          salaryRange: job.salaryRange,
          status: job.status,
          applications: jobApplications.length,
          views: job.stats.views || 0,
          hires: jobHires,
          postedAt: job.createdAt,
          deadline: job.deadline,
          description: job.description,
          requirements: job.requirements || [],
          benefits: job.benefits || []
        };
      });

      // Calculate overall stats
      const stats = {
        total: enrichedJobs.length,
        active: enrichedJobs.filter(job => job.status === 'active').length,
        paused: enrichedJobs.filter(job => job.status === 'paused').length,
        closed: enrichedJobs.filter(job => job.status === 'closed').length,
        draft: enrichedJobs.filter(job => job.status === 'draft').length,
        totalApplications: enrichedJobs.reduce((sum, job) => sum + job.applications, 0),
        totalViews: enrichedJobs.reduce((sum, job) => sum + job.views, 0),
        totalHires: enrichedJobs.reduce((sum, job) => sum + job.hires, 0)
      };

      return NextResponse.json({
        success: true,
        data: {
          jobs: enrichedJobs,
          stats
        }
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);

/**
 * PUT /api/recruiter/jobs - Update job status
 */
export const PUT = withAuth(
  withRole(['recruiter'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const recruiterId = req.user!.id;
      const { jobId, status } = await req.json();

      if (!jobId || !status) {
        return NextResponse.json({ error: 'Job ID and status are required' }, { status: 400 });
      }

      apiLogger.info('Updating job status', { recruiterId, jobId, status });

      // Verify recruiter has access to this job
      const job = await databaseService.getJobById(jobId);
      if (!job || job.recruiterId !== recruiterId) {
        return NextResponse.json({ 
          error: 'Unauthorized access to job' 
        }, { status: 403 });
      }

      // Update job status
      await databaseService.updateJob(jobId, { 
        status,
        updatedAt: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Job status updated successfully'
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);

/**
 * POST /api/recruiter/jobs - Duplicate a job
 */
export const POST = withAuth(
  withRole(['recruiter'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const recruiterId = req.user!.id;
      const { jobId } = await req.json();

      if (!jobId) {
        return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
      }

      apiLogger.info('Duplicating job', { recruiterId, jobId });

      // Verify recruiter has access to this job
      const originalJob = await databaseService.getJobById(jobId);
      if (!originalJob || originalJob.recruiterId !== recruiterId) {
        return NextResponse.json({ 
          error: 'Unauthorized access to job' 
        }, { status: 403 });
      }

      // Create a duplicate job with modifications
      const duplicatedJobData = {
        ...originalJob,
        title: `${originalJob.title} (Copy)`,
        status: 'draft' as const,
        stats: {
          views: 0,
          applications: 0,
          interviews: 0,
          offers: 0
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: undefined,
        closedAt: undefined,
        deletedAt: undefined
      };

      // Remove fields that shouldn't be duplicated
      delete duplicatedJobData.id;

      const newJobId = await databaseService.createJob(duplicatedJobData);
      const newJob = await databaseService.getJobById(newJobId);

      return NextResponse.json({
        success: true,
        data: newJob,
        message: 'Job duplicated successfully'
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);