
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/candidates/dashboard - Get dashboard metrics for a candidate
 */
export const GET = withAuth(
  withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const candidateId = req.user!.id;
      apiLogger.info('Fetching candidate dashboard data', { candidateId });

      const [applications, interviews, recentJobsResult] = await Promise.all([
        databaseService.getCandidateApplications(candidateId),
        databaseService.getInterviews({ candidateId }),
        databaseService.listJobs({ 
          status: 'active', 
          limit: 3, 
          orderBy: { field: 'publishedAt', direction: 'desc' } 
        }),
      ]);

      const offers = applications.filter(app => app.status === 'offered' || app.status === 'hired');

      const metrics = {
        applicationsApplied: applications.length,
        upcomingInterviews: interviews.filter(i => i.scheduledFor && new Date(i.scheduledFor) > new Date() && i.status === 'scheduled').length,
        offersReceived: offers.length,
      };

      const recentJobs = recentJobsResult.items;

      // Enrich jobs with company info
      const companyIds = [...new Set(recentJobs.map(j => j.companyId))];
      const companies = companyIds.length > 0 ? await databaseService.getCompaniesByIds(companyIds) : [];
      const companyMap = new Map(companies.map(c => [c.id, c.name]));

      const dashboardData = {
        ...metrics,
        aiRecommendedJobs: recentJobs.length,
        recentJobs: recentJobs.map(job => ({
          id: job.id,
          title: job.title,
          company: companyMap.get(job.companyId) || 'A Company',
          jobIdForLink: job.id,
        })),
      };

      return NextResponse.json({
        success: true,
        data: dashboardData,
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);
