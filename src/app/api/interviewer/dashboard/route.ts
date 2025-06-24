
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/interviewer/dashboard - Get dashboard metrics for an interviewer
 */
export const GET = withAuth(
  withRole(['interviewer'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const interviewerId = req.user!.id;
      apiLogger.info('Fetching interviewer dashboard data', { interviewerId });

      const interviews = await databaseService.getInterviewsByInterviewer(interviewerId);
      
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const metrics = {
        totalInterviews: interviews.length,
        thisMonth: {
          scheduled: interviews.filter(i => new Date(i.scheduledFor) >= thisMonth && i.status === 'scheduled').length,
          completed: interviews.filter(i => new Date(i.scheduledFor) >= thisMonth && i.status === 'completed').length,
        },
        upcomingInterviews: interviews.filter(i => new Date(i.scheduledFor) > now && i.status === 'scheduled').length,
        feedbackPending: interviews.filter(i => i.status === 'completed' && !i.feedback).length,
      };

      // Mocking some parts for a richer dashboard
      const recentInterviews = interviews
        .filter(i => i.status === 'completed')
        .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())
        .slice(0, 3)
        .map(i => ({
          id: i.id,
          candidateName: i.candidate?.name || 'Unknown Candidate',
          position: i.job?.title || 'Unknown Position',
          completedTime: i.scheduledFor,
          rating: i.rating || 0,
          recommendation: i.recommendation || 'Pending',
        }));

      return NextResponse.json({
        success: true,
        data: {
          ...metrics,
          recentInterviews,
          performance: { averageRating: 4.7, onTimeRate: 98 }, // Mocked for now
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  })
);
