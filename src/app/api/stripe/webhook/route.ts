import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { stripeService } from '@/services/stripe.service';
import { apiLogger } from '@/lib/logger';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      apiLogger.error('Missing stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      apiLogger.error('Webhook signature verification failed', { error: String(error) });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    apiLogger.info('Stripe webhook received', { 
      eventType: event.type, 
      eventId: event.id 
    });

    // Handle the event
    await stripeService.handleWebhook(event);

    return NextResponse.json({ received: true });

  } catch (error) {
    apiLogger.error('Webhook processing failed', { error: String(error) });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}