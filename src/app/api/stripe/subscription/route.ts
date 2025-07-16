import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { stripeService } from '@/services/stripe.service';
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';

const updateSubscriptionSchema = z.object({
  companyId: z.string(),
  planId: z.enum(['starter', 'professional', 'enterprise']).optional(),
  action: z.enum(['update', 'cancel', 'reactivate']),
  immediately: z.boolean().optional().default(false),
});

export const PUT = withAuth(async (req: NextRequest) => {
  try {
    const user = (req as any).user;
    
    // Only company admins can manage subscriptions
    if (!['company_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = updateSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { companyId, planId, action, immediately } = validation.data;

    // Verify user has access to this company
    if (user.role === 'company_admin' && user.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot manage other companies' },
        { status: 403 }
      );
    }

    // Get company subscription
    const subscription = await stripeService.getCompanySubscription(companyId);
    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found for this company' },
        { status: 404 }
      );
    }

    let result;
    switch (action) {
      case 'update':
        if (!planId) {
          return NextResponse.json(
            { error: 'Plan ID is required for update action' },
            { status: 400 }
          );
        }
        result = await stripeService.updateSubscriptionPlan(
          subscription.stripeSubscriptionId,
          planId
        );
        break;
      
      case 'cancel':
        result = await stripeService.cancelSubscription(
          subscription.stripeSubscriptionId,
          immediately
        );
        break;
      
      case 'reactivate':
        // Reactivate by removing cancel_at_period_end
        result = await stripeService.getSubscription(subscription.stripeSubscriptionId);
        if (result.cancel_at_period_end) {
          const stripe = (await import('@/lib/stripe/config')).stripe;
          result = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: false
          });
        }
        break;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Subscription ${action} successful`
    });

  } catch (error) {
    return handleApiError(error);
  }
});

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const user = (req as any).user;
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    if (user.role === 'company_admin' && user.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot access other companies' },
        { status: 403 }
      );
    }

    const subscription = await stripeService.getCompanySubscription(companyId);
    const planLimits = await stripeService.getPlanLimits(companyId);

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        planLimits,
        hasActiveSubscription: subscription?.status === 'active'
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});