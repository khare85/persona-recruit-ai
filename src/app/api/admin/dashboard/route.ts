
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/admin/dashboard - Get dashboard metrics for super admin
 */
export const GET = withAuth(
  withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      apiLogger.info('Fetching admin dashboard data', { userId: req.user?.id });

      const [systemAnalytics, healthStatus] = await Promise.all([
        databaseService.getSystemAnalytics(),
        databaseService.getSystemHealth(), // Assuming a method to get health status
      ]);

      const data = {
        totalUsers: systemAnalytics.overview.totalUsers,
        totalCompanies: systemAnalytics.overview.totalCompanies,
        systemHealth: healthStatus.overall === 'healthy' ? 99.8 : 65.2, // Simplified health score
        monthlyRevenue: 124800, // Placeholder
        activeJobs: systemAnalytics.overview.activeJobs,
        supportTickets: 18, // Placeholder
        recentActivity: [
          { type: "user", message: "New user registration: sarah.johnson@email.com", time: "2 minutes ago" },
          { type: "company", message: "CloudScale Solutions upgraded to Enterprise plan", time: "15 minutes ago" },
          { type: "system", message: "AI model training completed successfully", time: "1 hour ago" },
        ],
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

// Assuming a getSystemHealth method in databaseService for demonstration
declare module '@/services/database.service' {
  interface DatabaseService {
    getSystemHealth(): Promise<{ overall: 'healthy' | 'degraded' | 'unhealthy' }>;
  }
}

(databaseService as any).getSystemHealth = async function() {
  // Mock implementation, replace with actual health check logic
  return { overall: 'healthy' };
};
