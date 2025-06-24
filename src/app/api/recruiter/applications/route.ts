import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/recruiter/applications - Get applications for recruiter's jobs
 */
export const GET = withAuth(
  withRole(['recruiter'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const recruiterId = req.user!.id;
      const companyId = req.user!.companyId;

      if (!companyId) {
        return NextResponse.json({ error: 'Recruiter not associated with a company' }, { status: 400 });
      }

      apiLogger.info('Fetching recruiter applications', { recruiterId, companyId });

      // Get jobs assigned to this recruiter
      const jobs = await databaseService.listJobs({ recruiterId });
      const recruiterJobIds = jobs.items.map(job => job.id);

      // Get applications for those jobs
      const allApplications = await databaseService.getCompanyApplications({ companyId });
      const recruiterApplications = allApplications.filter(app => 
        recruiterJobIds.includes(app.jobId)
      );

      // Calculate stats
      const stats = {
        total: recruiterApplications.length,
        pending: recruiterApplications.filter(app => app.status === 'pending').length,
        reviewed: recruiterApplications.filter(app => app.status === 'reviewed').length,
        interviewed: recruiterApplications.filter(app => app.status === 'interviewed').length,
        hired: recruiterApplications.filter(app => app.status === 'hired').length,
        rejected: recruiterApplications.filter(app => app.status === 'rejected').length,
      };

      // Enrich applications with job details
      const enrichedApplications = recruiterApplications.map(app => {
        const job = jobs.items.find(j => j.id === app.jobId);
        return {
          ...app,
          jobTitle: job?.title || 'Unknown Job',
          department: job?.department || 'Unknown Department'
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          applications: enrichedApplications,
          stats
        }
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);

/**
 * PUT /api/recruiter/applications - Update application status (bulk)
 */
export const PUT = withAuth(
  withRole(['recruiter'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const recruiterId = req.user!.id;
      const companyId = req.user!.companyId;
      const { applicationIds, status } = await req.json();

      if (!companyId) {
        return NextResponse.json({ error: 'Recruiter not associated with a company' }, { status: 400 });
      }

      if (!applicationIds || !Array.isArray(applicationIds) || !status) {
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
      }

      apiLogger.info('Bulk updating application status', { 
        recruiterId, 
        companyId, 
        applicationIds, 
        status 
      });

      // Verify recruiter has access to these applications
      const jobs = await databaseService.listJobs({ recruiterId });
      const recruiterJobIds = jobs.items.map(job => job.id);

      for (const applicationId of applicationIds) {
        const application = await databaseService.getApplicationById(applicationId);
        if (!application || !recruiterJobIds.includes(application.jobId)) {
          return NextResponse.json({ 
            error: 'Unauthorized access to application' 
          }, { status: 403 });
        }

        await databaseService.updateApplication(applicationId, { 
          status,
          updatedAt: new Date().toISOString()
        });
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${applicationIds.length} applications`
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);