
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/recruiter/dashboard - Get dashboard metrics for a recruiter
 */
export const GET = withAuth(
  withRole(['recruiter'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const recruiterId = req.user!.id;
      const companyId = req.user!.companyId;

      if (!companyId) {
        return NextResponse.json({ error: 'Recruiter not associated with a company' }, { status: 400 });
      }

      apiLogger.info('Fetching recruiter dashboard data', { recruiterId, companyId });

      const [jobs, applications, interviews] = await Promise.all([
        databaseService.listJobs({ recruiterId }),
        databaseService.getCompanyApplications({ companyId }),
        databaseService.getInterviews({ companyId }),
      ]);

      const recruiterJobs = jobs.items;
      const recruiterApplications = applications.filter(app => recruiterJobs.some(j => j.id === app.jobId));
      const recruiterInterviews = interviews.filter(i => recruiterJobs.some(j => j.id === i.jobId));

      const metrics = {
        activeJobs: recruiterJobs.filter(j => j.status === 'active').length,
        totalApplications: recruiterApplications.length,
        interviewsScheduled: recruiterInterviews.filter(i => i.status === 'scheduled').length,
        hires: recruiterApplications.filter(a => a.status === 'hired').length,
        recentJobs: recruiterJobs.slice(0, 3).map(j => ({
          id: j.id,
          title: j.title,
          applicants: j.stats.applications || 0,
          views: j.stats.views || 0,
        })),
      };

      return NextResponse.json({
        success: true,
        data: metrics,
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);
