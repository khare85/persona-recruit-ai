import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/company/analytics - Get company analytics data
 */
export const GET = withRateLimit('analytics',
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const searchParams = req.nextUrl.searchParams;

        let companyId: string | undefined;

        if (userRole === 'super_admin') {
          companyId = searchParams.get('companyId') || undefined;
          if (!companyId) {
            return NextResponse.json(
              { error: 'Company ID is required for super admin' },
              { status: 400 }
            );
          }
        } else {
          const user = await databaseService.getUserById(userId);
          companyId = user?.companyId;
        }

        if (!companyId) {
          return NextResponse.json(
            { error: 'Company not found' },
            { status: 404 }
          );
        }

        apiLogger.info('Fetching company analytics', { userId, userRole, companyId });

        const analytics = await databaseService.getCompanyAnalytics(companyId);

        return NextResponse.json({
          success: true,
          analytics
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);