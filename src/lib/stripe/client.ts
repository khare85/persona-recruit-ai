'use client';

import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<any> | undefined;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};