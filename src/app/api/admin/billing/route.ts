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

      // Mock billing data - in a real app, this would come from billing provider (Stripe, etc.)
      const billingData = {
        revenue: {
          monthly: 47250,
          quarterly: 139500,
          yearly: 543200,
          growth: {
            monthly: 12.5,
            quarterly: 8.3,
            yearly: 23.7
          }
        },
        subscriptions: {
          total: 156,
          active: 142,
          cancelled: 8,
          churned: 6,
          byPlan: {
            starter: { count: 89, mrr: 4405 }, // 89 * $49.5 avg
            pro: { count: 47, mrr: 7003 }, // 47 * $149 avg  
            enterprise: { count: 6, mrr: 2994 } // 6 * $499 avg
          }
        },
        metrics: {
          arpu: 303.52, // Average Revenue Per User
          ltv: 2428.16, // Customer Lifetime Value
          churnRate: 4.2,
          conversionRate: 3.8
        },
        recentTransactions: [
          {
            id: 'txn_001',
            companyName: 'TechCorp Inc',
            plan: 'enterprise',
            amount: 499,
            status: 'paid',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            invoiceId: 'inv_001'
          },
          {
            id: 'txn_002',
            companyName: 'StartupXYZ',
            plan: 'pro',
            amount: 149,
            status: 'paid',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            invoiceId: 'inv_002'
          },
          {
            id: 'txn_003',
            companyName: 'Small Business LLC',
            plan: 'starter',
            amount: 49,
            status: 'failed',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            invoiceId: 'inv_003'
          },
          {
            id: 'txn_004',
            companyName: 'MegaCorp Solutions',
            plan: 'enterprise',
            amount: 499,
            status: 'paid',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            invoiceId: 'inv_004'
          },
          {
            id: 'txn_005',
            companyName: 'Digital Agency Pro',
            plan: 'pro',
            amount: 149,
            status: 'pending',
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
            invoiceId: 'inv_005'
          }
        ],
        monthlyRevenue: [
          { month: 'Jan', revenue: 42300, subscriptions: 134 },
          { month: 'Feb', revenue: 45100, subscriptions: 141 },
          { month: 'Mar', revenue: 43800, subscriptions: 138 },
          { month: 'Apr', revenue: 46900, subscriptions: 145 },
          { month: 'May', revenue: 48200, subscriptions: 149 },
          { month: 'Jun', revenue: 47250, subscriptions: 142 }
        ],
        failedPayments: [
          {
            id: 'fail_001',
            companyName: 'Small Business LLC',
            amount: 49,
            reason: 'insufficient_funds',
            attempts: 2,
            nextRetry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
            planStatus: 'grace_period'
          },
          {
            id: 'fail_002',
            companyName: 'Retail Store Co',
            amount: 149,
            reason: 'card_declined',
            attempts: 1,
            nextRetry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
            planStatus: 'active'
          }
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