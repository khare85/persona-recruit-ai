
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/admin/support - Get support tickets
 */
export const GET = withAuth(
  withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      apiLogger.info('Fetching support tickets', { userId: req.user?.id });

      // Mock support tickets
      const tickets = [
        {
          id: 'tick_001',
          subject: 'Unable to upload resume',
          user: 'John Doe',
          userEmail: 'candidate@example.com',
          priority: 'high',
          status: 'open',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          lastResponse: '1h ago',
        },
        {
          id: 'tick_002',
          subject: 'Job posting not appearing',
          user: 'Jane Smith',
          userEmail: 'recruiter@techcorp.com',
          priority: 'medium',
          status: 'in_progress',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          lastResponse: '3h ago',
        },
        {
          id: 'tick_003',
          subject: 'Billing question',
          user: 'Mike Johnson',
          userEmail: 'admin@techcorp.com',
          priority: 'low',
          status: 'resolved',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          lastResponse: '1d ago',
        }
      ];

      const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
      };

      return NextResponse.json({
        success: true,
        data: {
          tickets,
          stats
        }
      });
    } catch (error) {
      return handleApiError(error);
    }
  })
);
