
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

      const [applications, interviews] = await Promise.all([
        databaseService.getCandidateApplications(candidateId),
        databaseService.getInterviews({ candidateId }),
      ]);

      const offers = applications.filter(app => app.status === 'offered' || app.status === 'hired');

      const metrics = {
        applicationsApplied: applications.length,
        upcomingInterviews: interviews.filter(i => new Date(i.scheduledFor) > new Date() && i.status === 'scheduled').length,
        offersReceived: offers.length,
      };

      // In a real app, this would come from an AI recommendation engine
      const recentJobs = await databaseService.getRecentJobs(3);
      
      const dashboardData = {
        ...metrics,
        aiRecommendedJobs: recentJobs.length,
        recentJobs: recentJobs.map(job => ({
          id: job.id,
          title: job.title,
          company: job.companyName || 'A Company',
          jobIdForLink: job.id,
        })),
        // Add more data as needed
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
