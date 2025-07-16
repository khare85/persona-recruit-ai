import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { stripeService } from '@/services/stripe.service';
import { z } from 'zod';
import { handleApiError } from '@/lib/errors';

const portalSchema = z.object({
  companyId: z.string(),
  returnUrl: z.string().url(),
});

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const user = (req as any).user;
    
    // Only company admins can access billing portal
    if (!['company_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = portalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { companyId, returnUrl } = validation.data;

    // Verify user has access to this company
    if (user.role === 'company_admin' && user.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot access other companies' },
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

    // Create billing portal session
    const session = await stripeService.createBillingPortalSession(
      subscription.stripeCustomerId,
      returnUrl
    );

    return NextResponse.json({
      success: true,
      data: {
        url: session.url
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});