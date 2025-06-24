import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/recruiter/analytics - Get analytics for recruiter's performance
 */
export const GET = withAuth(
  withRole(['recruiter'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const recruiterId = req.user!.id;
      const companyId = req.user!.companyId;
      const searchParams = req.nextUrl.searchParams;
      const timeRange = searchParams.get('timeRange') || 'last-3-months';

      if (!companyId) {
        return NextResponse.json({ error: 'Recruiter not associated with a company' }, { status: 400 });
      }

      apiLogger.info('Fetching recruiter analytics', { recruiterId, companyId, timeRange });

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case 'last-month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'last-6-months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case 'last-year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default: // last-3-months
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      }

      // Get recruiter's jobs
      const jobs = await databaseService.listJobs({ recruiterId });
      const recruiterJobIds = jobs.items.map(job => job.id);

      // Get applications for recruiter's jobs
      const allApplications = await databaseService.getCompanyApplications({ companyId });
      const recruiterApplications = allApplications.filter(app => 
        recruiterJobIds.includes(app.jobId) &&
        new Date(app.createdAt) >= startDate
      );

      // Get interviews for recruiter's jobs
      const allInterviews = await databaseService.getInterviews({ companyId });
      const recruiterInterviews = allInterviews.filter(interview => 
        recruiterJobIds.includes(interview.jobId) &&
        new Date(interview.scheduledAt) >= startDate
      );

      // Calculate metrics
      const totalApplications = recruiterApplications.length;
      const totalHires = recruiterApplications.filter(app => app.status === 'hired').length;
      const totalInterviews = recruiterInterviews.length;
      const completedInterviews = recruiterInterviews.filter(i => i.status === 'completed').length;
      
      const hireRate = totalApplications > 0 ? (totalHires / totalApplications) * 100 : 0;
      const interviewConversionRate = totalInterviews > 0 ? (totalHires / totalInterviews) * 100 : 0;

      // Calculate average time to hire (mock calculation)
      const avgTimeToHire = 18; // This would be calculated from actual data

      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const applicationsThisMonth = recruiterApplications.filter(app => 
        new Date(app.createdAt) >= thisMonth
      ).length;
      const hiresThisMonth = recruiterApplications.filter(app => 
        app.status === 'hired' && new Date(app.updatedAt || app.createdAt) >= thisMonth
      ).length;

      const metrics = {
        totalApplications,
        activeJobs: jobs.items.filter(job => job.status === 'active').length,
        hireRate: Math.round(hireRate * 10) / 10,
        avgTimeToHire,
        interviewConversionRate: Math.round(interviewConversionRate * 10) / 10,
        totalHires,
        applicationsThisMonth,
        hiresThisMonth
      };

      // Job performance analysis
      const jobPerformance = jobs.items.map(job => {
        const jobApplications = recruiterApplications.filter(app => app.jobId === job.id);
        const jobHires = jobApplications.filter(app => app.status === 'hired').length;
        const conversionRate = jobApplications.length > 0 ? (jobHires / jobApplications.length) * 100 : 0;
        
        return {
          id: job.id,
          title: job.title,
          applications: jobApplications.length,
          views: job.stats.views || 0,
          hires: jobHires,
          conversionRate: Math.round(conversionRate * 10) / 10,
          avgTimeToFill: Math.floor(Math.random() * 30) + 10, // Mock data
          status: job.status
        };
      });

      // Monthly trends
      const monthlyTrends = [];
      for (let i = 2; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthApplications = recruiterApplications.filter(app => {
          const appDate = new Date(app.createdAt);
          return appDate >= monthStart && appDate <= monthEnd;
        });
        
        const monthInterviews = recruiterInterviews.filter(interview => {
          const interviewDate = new Date(interview.scheduledAt);
          return interviewDate >= monthStart && interviewDate <= monthEnd;
        });
        
        const monthHires = monthApplications.filter(app => app.status === 'hired');
        
        monthlyTrends.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          applications: monthApplications.length,
          interviews: monthInterviews.length,
          hires: monthHires.length
        });
      }

      // Source metrics (mock data - would come from actual application sources)
      const sourceMetrics = [
        { source: 'LinkedIn', applications: Math.floor(totalApplications * 0.4), hires: Math.floor(totalHires * 0.5), conversionRate: 6.1 },
        { source: 'Indeed', applications: Math.floor(totalApplications * 0.3), hires: Math.floor(totalHires * 0.25), conversionRate: 4.5 },
        { source: 'Company Website', applications: Math.floor(totalApplications * 0.2), hires: Math.floor(totalHires * 0.17), conversionRate: 4.4 },
        { source: 'Referrals', applications: Math.floor(totalApplications * 0.1), hires: Math.floor(totalHires * 0.08), conversionRate: 4.3 }
      ];

      return NextResponse.json({
        success: true,
        data: {
          metrics,
          jobPerformance,
          monthlyTrends,
          sourceMetrics
        }
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);