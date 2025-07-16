import { stripe, STRIPE_CONFIG, SubscriptionPlan } from '@/lib/stripe/config';
import { databaseService } from './database.service';
import { emailService } from './email.service';
import { apiLogger } from '@/lib/logger';
import Stripe from 'stripe';

export interface SubscriptionData {
  id: string;
  userId: string;
  companyId: string;
  planId: SubscriptionPlan;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class StripeService {
  private static instance: StripeService;

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Create or retrieve a Stripe customer
   */
  async createOrGetCustomer(userId: string, email: string, name: string): Promise<Stripe.Customer> {
    try {
      // Check if customer already exists
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId
        }
      });

      apiLogger.info('Stripe customer created', { customerId: customer.id, userId });
      return customer;
    } catch (error) {
      apiLogger.error('Failed to create Stripe customer', { error: String(error), userId });
      throw error;
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    companyId: string,
    planId: SubscriptionPlan,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const user = await databaseService.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const customer = await this.createOrGetCustomer(
        userId,
        user.email,
        `${user.firstName} ${user.lastName}`
      );

      const plan = STRIPE_CONFIG.plans[planId];
      
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          companyId,
          planId
        },
        subscription_data: {
          metadata: {
            userId,
            companyId,
            planId
          }
        }
      });

      apiLogger.info('Checkout session created', { sessionId: session.id, userId, planId });
      return session;
    } catch (error) {
      apiLogger.error('Failed to create checkout session', { error: String(error), userId, planId });
      throw error;
    }
  }

  /**
   * Create a billing portal session
   */
  async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      apiLogger.info('Billing portal session created', { sessionId: session.id, customerId });
      return session;
    } catch (error) {
      apiLogger.error('Failed to create billing portal session', { error: String(error), customerId });
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      apiLogger.error('Failed to get subscription', { error: String(error), subscriptionId });
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    try {
      if (immediately) {
        return await stripe.subscriptions.cancel(subscriptionId);
      } else {
        return await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      }
    } catch (error) {
      apiLogger.error('Failed to cancel subscription', { error: String(error), subscriptionId });
      throw error;
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscriptionPlan(
    subscriptionId: string,
    newPlanId: SubscriptionPlan
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const newPlan = STRIPE_CONFIG.plans[newPlanId];

      return await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPlan.stripePriceId,
          },
        ],
        proration_behavior: 'always_invoice',
      });
    } catch (error) {
      apiLogger.error('Failed to update subscription plan', { error: String(error), subscriptionId, newPlanId });
      throw error;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        
        default:
          apiLogger.info('Unhandled webhook event', { eventType: event.type });
      }
    } catch (error) {
      apiLogger.error('Webhook handler error', { error: String(error), eventType: event.type });
      throw error;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const { userId, companyId, planId } = session.metadata!;
    
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      
      // Create subscription record in database
      await this.createSubscriptionRecord(
        userId,
        companyId,
        planId as SubscriptionPlan,
        session.customer as string,
        subscription
      );
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      // Update subscription status to active
      await this.updateSubscriptionStatus(invoice.subscription as string, 'active');
      
      // Send welcome email for new subscriptions
      const subscription = await this.getSubscription(invoice.subscription as string);
      if (subscription) {
        const subscriptionData = await this.getCompanySubscriptionByStripeId(subscription.id);
        if (subscriptionData) {
          const user = await databaseService.getUser(subscriptionData.userId);
          if (user) {
            const plan = STRIPE_CONFIG.plans[subscriptionData.planId];
            await emailService.sendSubscriptionWelcome(
              user.email,
              user.firstName,
              plan.name,
              plan.price,
              new Date(subscription.current_period_end * 1000).toLocaleDateString(),
              plan.features,
              `${process.env.NEXT_PUBLIC_APP_URL}/company/dashboard`,
              `${process.env.NEXT_PUBLIC_APP_URL}/company/billing`
            );
          }
        }
      }
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      // Update subscription status to past_due
      await this.updateSubscriptionStatus(invoice.subscription as string, 'past_due');
      
      // Send payment failed email
      const subscription = await this.getSubscription(invoice.subscription as string);
      if (subscription) {
        const subscriptionData = await this.getCompanySubscriptionByStripeId(subscription.id);
        if (subscriptionData) {
          const user = await databaseService.getUser(subscriptionData.userId);
          if (user && invoice.amount_due) {
            const plan = STRIPE_CONFIG.plans[subscriptionData.planId];
            await emailService.sendPaymentFailed(
              user.email,
              user.firstName,
              plan.name,
              invoice.amount_due / 100, // Convert from cents
              invoice.payment_intent?.payment_method?.type || 'card',
              new Date(invoice.created * 1000).toLocaleDateString(),
              `${process.env.NEXT_PUBLIC_APP_URL}/company/billing`
            );
          }
        }
      }
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    await this.updateSubscriptionRecord(subscription);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await this.updateSubscriptionStatus(subscription.id, 'canceled');
    
    // Send cancellation email
    const subscriptionData = await this.getCompanySubscriptionByStripeId(subscription.id);
    if (subscriptionData) {
      const user = await databaseService.getUser(subscriptionData.userId);
      if (user) {
        const plan = STRIPE_CONFIG.plans[subscriptionData.planId];
        await emailService.sendSubscriptionCanceled(
          user.email,
          user.firstName,
          plan.name,
          new Date(subscription.current_period_end * 1000).toLocaleDateString(),
          new Date().toLocaleDateString(),
          `${process.env.NEXT_PUBLIC_APP_URL}/company/billing`,
          `${process.env.NEXT_PUBLIC_APP_URL}/feedback`
        );
      }
    }
  }

  private async createSubscriptionRecord(
    userId: string,
    companyId: string,
    planId: SubscriptionPlan,
    customerId: string,
    subscription: Stripe.Subscription
  ): Promise<void> {
    const subscriptionData: Omit<SubscriptionData, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      companyId,
      planId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
    };

    await databaseService.create('subscriptions', subscriptionData);
    apiLogger.info('Subscription record created', { subscriptionId: subscription.id, userId, planId });
  }

  private async updateSubscriptionRecord(subscription: Stripe.Subscription): Promise<void> {
    const updates = {
      status: subscription.status as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
    };

    await databaseService.update('subscriptions', subscription.id, updates);
    apiLogger.info('Subscription record updated', { subscriptionId: subscription.id });
  }

  private async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionData['status']): Promise<void> {
    await databaseService.update('subscriptions', subscriptionId, { status });
    apiLogger.info('Subscription status updated', { subscriptionId, status });
  }

  /**
   * Get company subscription
   */
  async getCompanySubscription(companyId: string): Promise<SubscriptionData | null> {
    const subscriptions = await databaseService.findMany('subscriptions', {
      where: [{ field: 'companyId', operator: '==', value: companyId }],
      limit: 1
    });

    return subscriptions.length > 0 ? subscriptions[0] : null;
  }

  /**
   * Get subscription by Stripe subscription ID
   */
  async getCompanySubscriptionByStripeId(stripeSubscriptionId: string): Promise<SubscriptionData | null> {
    const subscriptions = await databaseService.findMany('subscriptions', {
      where: [{ field: 'stripeSubscriptionId', operator: '==', value: stripeSubscriptionId }],
      limit: 1
    });

    return subscriptions.length > 0 ? subscriptions[0] : null;
  }

  /**
   * Check if company has active subscription
   */
  async hasActiveSubscription(companyId: string): Promise<boolean> {
    const subscription = await this.getCompanySubscription(companyId);
    return subscription?.status === 'active' || false;
  }

  /**
   * Get plan limits for company
   */
  async getPlanLimits(companyId: string): Promise<typeof STRIPE_CONFIG.plans[SubscriptionPlan]['limits'] | null> {
    const subscription = await this.getCompanySubscription(companyId);
    if (!subscription) return null;

    return STRIPE_CONFIG.plans[subscription.planId].limits;
  }
}

export const stripeService = StripeService.getInstance();