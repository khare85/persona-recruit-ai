'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CreditCard, Settings, Calendar } from 'lucide-react';
import { SubscriptionCard } from './SubscriptionCard';
import { getStripe } from '@/lib/stripe/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface SubscriptionData {
  id: string;
  planId: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string;
}

interface PlanData {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  limits: {
    jobPostings: number;
    candidatesPerMonth: number;
    videoInterviews: number;
    teamMembers: number;
  };
}

interface SubscriptionManagerProps {
  companyId: string;
}

export function SubscriptionManager({ companyId }: SubscriptionManagerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchSubscription();
  }, [companyId]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/stripe/plans');
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.data.plans);
      } else {
        setError('Failed to load plans');
      }
    } catch (error) {
      setError('Failed to load plans');
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await fetch(`/api/stripe/subscription?companyId=${companyId}`);
      const data = await response.json();
      
      if (data.success) {
        setSubscription(data.data.subscription);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const handlePlanSelect = async (planId: string) => {
    setLoading(true);
    setError(null);

    try {
      const successUrl = `${window.location.origin}/company/billing?success=true`;
      const cancelUrl = `${window.location.origin}/company/billing?canceled=true`;

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          companyId,
          successUrl,
          cancelUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const stripe = await getStripe();
        const { error } = await stripe!.redirectToCheckout({
          sessionId: data.data.sessionId,
        });

        if (error) {
          setError(error.message || 'Failed to redirect to checkout');
        }
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      setError('Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}/company/billing`;

      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          returnUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.data.url;
      } else {
        setError(data.error || 'Failed to create billing portal session');
      }
    } catch (error) {
      setError('Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          action: 'cancel',
          immediately: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Subscription Canceled',
          description: 'Your subscription will be canceled at the end of the current billing period.',
        });
        fetchSubscription();
      } else {
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      setError('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      past_due: 'destructive',
      canceled: 'secondary',
      unpaid: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">
                    {plans.find(p => p.id === subscription.planId)?.name || subscription.planId}
                  </span>
                  {getStatusBadge(subscription.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {subscription.cancelAtPeriodEnd 
                    ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  }
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleManageBilling}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Manage Billing
                </Button>
                {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                  <Button
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {subscription ? 'Upgrade or Change Plan' : 'Choose a Plan'}
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <SubscriptionCard
              key={plan.id}
              plan={plan}
              currentPlan={subscription?.planId}
              onSelect={handlePlanSelect}
              loading={loading}
              popular={index === 1} // Professional plan is popular
            />
          ))}
        </div>
      </div>

      {/* Billing Notice */}
      {!subscription && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need an active subscription to access premium features. 
            Select a plan above to get started.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}