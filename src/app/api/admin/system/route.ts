import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { healthMonitor } from '@/lib/serverHealth';

/**
 * GET /api/admin/system - Get system health and monitoring data
 */
export const GET = withAuth(
  withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      apiLogger.info('Fetching system health data', { userId: req.user?.id });

      // Get health status from the health monitor
      const healthStatus = healthMonitor.getStatus();
      
      // Mock data for demonstration - in a real system, this would come from monitoring services
      const systemData = {
        overall: healthStatus.healthy ? 'healthy' : 'warning',
        uptime: 99.92,
        lastIncident: '12 days ago',
        services: [
          { name: 'Web Application', status: 'healthy', uptime: 99.95, responseTime: 142 },
          { name: 'API Gateway', status: 'healthy', uptime: 99.98, responseTime: 89 },
          { name: 'Database', status: 'healthy', uptime: 99.87, responseTime: 23 },
          { name: 'Firebase Auth', status: healthStatus.healthy ? 'healthy' : 'warning', uptime: 99.92, responseTime: 134 },
          { name: 'Firebase Storage', status: 'healthy', uptime: 99.99, responseTime: 67 },
          { name: 'AI Services', status: 'warning', uptime: 98.45, responseTime: 256 },
          { name: 'Email Service', status: 'healthy', uptime: 99.78, responseTime: 890 }
        ],
        servers: [
          { name: 'App Server 1', cpu: Math.floor(Math.random() * 30) + 20, memory: Math.floor(Math.random() * 40) + 40, disk: Math.floor(Math.random() * 30) + 30, status: 'healthy', location: 'US-Central' },
          { name: 'App Server 2', cpu: Math.floor(Math.random() * 30) + 25, memory: Math.floor(Math.random() * 40) + 35, disk: Math.floor(Math.random() * 30) + 35, status: 'healthy', location: 'US-West' },
          { name: 'Database Primary', cpu: Math.floor(Math.random() * 20) + 50, memory: Math.floor(Math.random() * 30) + 60, disk: Math.floor(Math.random() * 20) + 45, status: 'healthy', location: 'US-Central' },
          { name: 'Firebase Services', cpu: Math.floor(Math.random() * 20) + 15, memory: Math.floor(Math.random() * 25) + 25, disk: Math.floor(Math.random() * 30) + 40, status: 'healthy', location: 'Global' }
        ],
        metrics: {
          totalRequests: 2456789 + Math.floor(Math.random() * 10000),
          successRate: 99.94,
          avgResponseTime: 167 + Math.floor(Math.random() * 50),
          concurrentUsers: 1247 + Math.floor(Math.random() * 200),
          dataTransfer: 2.4 + (Math.random() * 0.5),
          errorRate: 0.06
        },
        security: {
          threatBlocked: 1247 + Math.floor(Math.random() * 50),
          lastScan: '2 hours ago',
          vulnerabilities: healthStatus.failedChecks.length,
          ssl: 'A+',
          compliance: 'SOC2, GDPR',
          lastUpdate: '1 day ago'
        },
        healthChecks: healthStatus.checks,
        failedChecks: healthStatus.failedChecks
      };

      return NextResponse.json({
        success: true,
        data: systemData
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);