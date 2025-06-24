
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/company/dashboard - Get dashboard metrics for a company
 */
export const GET = withAuth(
  withRole(['company_admin', 'recruiter'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const companyId = req.user!.companyId;

      if (!companyId) {
        return NextResponse.json({ error: 'User not associated with a company' }, { status: 400 });
      }

      apiLogger.info('Fetching company dashboard data', { userId: req.user?.id, companyId });
      
      const company = await databaseService.getCompanyById(companyId);
      const jobs = await databaseService.listJobs({ companyId });
      const applications = await databaseService.getCompanyApplications({ companyId });

      const metrics = {
        companyName: company?.name || 'Your Company',
        totalEmployees: company?.stats.totalEmployees || 0,
        activeJobs: jobs.items.filter(j => j.status === 'active').length,
        candidatesInPipeline: applications.filter(a => !['hired', 'rejected'].includes(a.status)).length,
        monthlyBudget: 75000, // Placeholder
        avgTimeToHire: 16, // Placeholder
        departments: [ // Placeholder
          { name: "Engineering", openPositions: 12, budget: 45000 },
          { name: "Marketing", openPositions: 3, budget: 15000 },
          { name: "Sales", openPositions: 3, budget: 18000 },
          { name: "Product", openPositions: 2, budget: 12000 }
        ],
        recentJobs: jobs.items.slice(0, 3).map(job => ({
          id: job.id,
          title: job.title,
          applicants: job.stats.applications || 0,
          views: job.stats.views || 0,
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
