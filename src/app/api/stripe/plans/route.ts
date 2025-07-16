import { NextRequest, NextResponse } from 'next/server';
import { STRIPE_CONFIG } from '@/lib/stripe/config';
import { handleApiError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const plans = Object.entries(STRIPE_CONFIG.plans).map(([key, plan]) => ({
      id: key,
      ...plan
    }));

    return NextResponse.json({
      success: true,
      data: {
        plans,
        currency: STRIPE_CONFIG.currency
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}