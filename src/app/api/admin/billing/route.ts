
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

/**
 * GET /api/admin/billing - Get billing and revenue data
 */
export const GET = withAuth(
  withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      apiLogger.info('Fetching billing data', { userId: req.user?.id });

      // Mock billing data - in a real app, this would come from a billing provider (Stripe, etc.)
      const billingData = {
        monthlyRevenue: 47250,
        totalRevenue: 892450,
        activeSubscriptions: 127,
        pendingPayments: 3,
        recentTransactions: [
          {
            id: 'txn_001',
            company: 'TechCorp Inc',
            plan: 'Enterprise',
            amount: 499,
            status: 'paid',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'txn_002',
            company: 'StartupXYZ',
            plan: 'Professional',
            amount: 149,
            status: 'paid',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'txn_003',
            company: 'Small Business LLC',
            plan: 'Starter',
            amount: 49,
            status: 'failed',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]
      };

      return NextResponse.json({
        success: true,
        data: billingData
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);
