'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { SubscriptionManager } from '@/components/billing/SubscriptionManager';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CompanyBillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.role === 'company_admin' && user.companyId) {
        setCompanyId(user.companyId);
      } else if (user.role === 'super_admin') {
        // Super admin can manage any company - get from URL params
        const urlCompanyId = searchParams.get('companyId');
        if (urlCompanyId) {
          setCompanyId(urlCompanyId);
        }
      } else {
        // Redirect unauthorized users
        router.push('/dashboard');
      }
    }
  }, [user, router, searchParams]);

  // Check for success/cancel parameters
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to determine company ID. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription, billing information, and plan features.
          </p>
        </div>

        {/* Success/Cancel Messages */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Subscription successful! Your new plan is now active.
            </AlertDescription>
          </Alert>
        )}

        {canceled && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <XCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Subscription canceled. You can try again anytime.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Manager */}
        <SubscriptionManager companyId={companyId} />

        {/* Billing Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>
              All billing is handled securely through Stripe. You can update your payment methods
              and billing details using the \"Manage Billing\" button above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h4 className="font-semibold">Payment Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Secured by Stripe with industry-standard encryption
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">PCI DSS Compliant</p>
                  <p className="text-xs text-muted-foreground">256-bit SSL encryption</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Need Help?</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Have questions about billing or need to make changes?
                  </p>
                  <p className="text-sm">
                    Contact us at{' '}
                    <a href="mailto:billing@persona-recruit.ai" className="text-blue-600 hover:underline">
                      billing@persona-recruit.ai
                    </a>
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Billing Cycle</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    All plans are billed monthly in advance
                  </p>
                  <p className="text-sm">
                    You can cancel anytime with no cancellation fees
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}