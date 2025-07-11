
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';
import { aiAnalyticsService } from '@/services/aiAnalytics.service';
import { AnalyticsFilters } from '@/types/analytics.types';
/**
 * GET /api/admin/analytics - Get system-wide analytics data for super admins
 */
export const GET = withAuth(
  withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(req.url);
      
      const timeRange = {
        start: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date(),
        preset: searchParams.get('preset') as any
      };
      
      const filters: AnalyticsFilters = {
        timeRange,
        operationTypes: searchParams.get('operationTypes')?.split(','),
        companyIds: searchParams.get('companyIds')?.split(','),
        models: searchParams.get('models')?.split(','),
      };

      apiLogger.info('Fetching system analytics', { userId: req.user?.id, filters });

      const analytics = await aiAnalyticsService.getDashboardData(filters);

      return NextResponse.json({
        success: true,
        data: analytics,
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);
