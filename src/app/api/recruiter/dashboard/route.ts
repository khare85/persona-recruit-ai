
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
      apiLogger.info('Fetching recruiter dashboard data', { recruiterId });

      // 1. Get jobs for the recruiter
      const jobsResult = await databaseService.listJobs({ recruiterId });
      const recruiterJobs = jobsResult.items;
      const recruiterJobIds = recruiterJobs.map(job => job.id);

      if (recruiterJobIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            activeJobs: 0,
            newApplications: 0,
            upcomingInterviews: 0,
            hiresThisMonth: 0,
            upcomingInterviewList: [],
            recentApplicationList: [],
          },
        });
      }

      // 2. Fetch applications & interviews for those jobs
      const [applications, interviews] = await Promise.all([
        databaseService.getApplicationsForJobs(recruiterJobIds),
        databaseService.getInterviewsForJobs(recruiterJobIds),
      ]);
      
      const allCandidates = await databaseService.listUsers({ role: 'candidate' });

      // 3. Calculate metrics
      const activeJobs = recruiterJobs.filter(j => j.status === 'active').length;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newApplications = applications.filter(app => new Date(app.appliedAt) > sevenDaysAgo).length;
      const upcomingInterviews = interviews.filter(i => new Date(i.scheduledFor) > new Date() && i.status === 'scheduled').length;
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const hiresThisMonth = applications.filter(app => 
        app.status === 'hired' && new Date(app.lastActivityAt) > thirtyDaysAgo
      ).length;

      // 4. Prepare data for UI
      const upcomingInterviewList = interviews
        .filter(i => new Date(i.scheduledFor) > new Date() && i.status === 'scheduled')
        .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
        .slice(0, 5)
        .map(i => {
          const job = recruiterJobs.find(j => j.id === i.jobId);
          const candidate = allCandidates.items.find(c => c.id === i.candidateId);
          return {
            id: i.id,
            candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown Candidate',
            jobTitle: job?.title || 'Unknown Job',
            scheduledFor: i.scheduledFor,
            duration: i.duration,
          };
        });

      const recentApplicationList = applications
        .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
        .slice(0, 5)
        .map(app => {
          const job = recruiterJobs.find(j => j.id === app.jobId);
          const candidate = allCandidates.items.find(c => c.id === app.candidateId);
          return {
            id: app.id,
            candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown Candidate',
            jobTitle: job?.title || 'Unknown Job',
            appliedAt: app.appliedAt,
            status: app.status,
            aiMatchScore: app.matchScore?.overall || 0,
          };
        });

      const data = {
        activeJobs,
        newApplications,
        upcomingInterviews,
        hiresThisMonth,
        upcomingInterviewList,
        recentApplicationList,
      };

      return NextResponse.json({
        success: true,
        data,
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);
