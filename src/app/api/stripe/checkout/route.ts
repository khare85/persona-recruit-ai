import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { stripeService } from '@/services/stripe.service';
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';

const checkoutSchema = z.object({
  planId: z.enum(['starter', 'professional', 'enterprise']),
  companyId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const user = (req as any).user;
    
    // Only company admins can create subscriptions
    if (!['company_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { planId, companyId, successUrl, cancelUrl } = validation.data;

    // Verify user has access to this company
    if (user.role === 'company_admin' && user.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot create subscription for other companies' },
        { status: 403 }
      );
    }

    // Check if company already has active subscription
    const existingSubscription = await stripeService.getCompanySubscription(companyId);
    if (existingSubscription?.status === 'active') {
      return NextResponse.json(
        { error: 'Company already has an active subscription' },
        { status: 400 }
      );
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      user.uid,
      companyId,
      planId,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
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

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        hasActiveSubscription: subscription?.status === 'active'
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});