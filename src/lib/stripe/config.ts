import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  currency: 'usd',
  
  // Subscription Plans
  plans: {
    starter: {
      id: 'starter',
      name: 'Starter',
      price: 99,
      interval: 'month',
      stripePriceId: process.env.STRIPE_STARTER_PRICE_ID!,
      features: [
        'Up to 10 active job postings',
        'AI-powered candidate screening',
        'Basic video interviews',
        'Standard support',
        'Up to 100 candidates per month'
      ],
      limits: {
        jobPostings: 10,
        candidatesPerMonth: 100,
        videoInterviews: 50,
        teamMembers: 3
      }
    },
    professional: {
      id: 'professional',
      name: 'Professional',
      price: 199,
      interval: 'month',
      stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
      features: [
        'Up to 50 active job postings',
        'Advanced AI matching',
        'Unlimited video interviews',
        'Priority support',
        'Up to 500 candidates per month',
        'Custom branding',
        'Analytics dashboard'
      ],
      limits: {
        jobPostings: 50,
        candidatesPerMonth: 500,
        videoInterviews: -1, // unlimited
        teamMembers: 10
      }
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      interval: 'month',
      stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
      features: [
        'Unlimited job postings',
        'Advanced AI features',
        'Unlimited video interviews',
        'Dedicated support',
        'Unlimited candidates',
        'Custom integrations',
        'Advanced analytics',
        'White-label options'
      ],
      limits: {
        jobPostings: -1, // unlimited
        candidatesPerMonth: -1, // unlimited
        videoInterviews: -1, // unlimited
        teamMembers: -1 // unlimited
      }
    }
  }
} as const;

export type SubscriptionPlan = keyof typeof STRIPE_CONFIG.plans;
export type PlanDetails = typeof STRIPE_CONFIG.plans[SubscriptionPlan];