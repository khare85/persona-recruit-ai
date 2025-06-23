import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/company/applications - Get all applications for company
 */
export const GET = withRateLimit('applications',
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const searchParams = req.nextUrl.searchParams;

        // Filter parameters
        const status = searchParams.get('status');
        const jobId = searchParams.get('jobId');
        const department = searchParams.get('department');
        const minScore = searchParams.get('minScore');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let companyId: string | undefined;

        if (userRole === 'super_admin') {
          companyId = searchParams.get('companyId') || undefined;
        } else {
          const user = await databaseService.getUserById(userId);
          companyId = user?.companyId;
        }

        apiLogger.info('Fetching company applications', {
          userId,
          userRole,
          companyId,
          status,
          jobId,
          department,
          minScore
        });

        // Get applications with filters
        const applications = await databaseService.getJobApplications({
          companyId,
          status,
          jobId,
          department,
          minScore: minScore ? parseInt(minScore) : undefined,
          limit,
          offset
        });

        // Enhance applications with candidate and job details
        const enhancedApplications = await Promise.all(
          applications.map(async (application) => {
            const [candidate, candidateProfile, job] = await Promise.all([
              databaseService.getUserById(application.candidateId),
              databaseService.getCandidateProfile(application.candidateId),
              databaseService.getJobById(application.jobId)
            ]);

            return {
              id: application.id,
              candidateId: application.candidateId,
              candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown',
              candidateEmail: candidate?.email || '',
              candidatePhone: candidateProfile?.phone,
              candidateLocation: candidateProfile?.location,
              jobId: application.jobId,
              jobTitle: job?.title || 'Unknown Position',
              department: job?.department || 'Unknown',
              appliedAt: application.appliedAt,
              status: application.status,
              aiMatchScore: application.aiMatchScore || 0,
              resumeUrl: candidateProfile?.resumeUrl,
              videoIntroUrl: candidateProfile?.videoIntroUrl,
              coverLetter: application.coverLetter,
              experience: candidateProfile?.summary || '',
              skills: candidateProfile?.skills || [],
              currentTitle: candidateProfile?.currentTitle || '',
              lastUpdated: application.lastUpdated || application.appliedAt
            };
          })
        );

        // Sort by application date (newest first)
        enhancedApplications.sort((a, b) => 
          new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
        );

        apiLogger.info('Applications fetched successfully', {
          companyId,
          applicationsCount: enhancedApplications.length
        });

        return NextResponse.json({
          success: true,
          applications: enhancedApplications,
          total: enhancedApplications.length,
          hasMore: enhancedApplications.length === limit
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);