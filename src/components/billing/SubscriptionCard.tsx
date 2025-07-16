'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { PlanDetails } from '@/lib/stripe/config';

interface SubscriptionCardProps {
  plan: PlanDetails & { id: string };
  currentPlan?: string;
  onSelect: (planId: string) => void;
  loading?: boolean;
  popular?: boolean;
}

export function SubscriptionCard({
  plan,
  currentPlan,
  onSelect,
  loading = false,
  popular = false
}: SubscriptionCardProps) {
  const isCurrentPlan = currentPlan === plan.id;
  const isUpgrade = currentPlan && currentPlan !== plan.id;

  return (
    <Card className={`relative ${popular ? 'border-2 border-blue-500' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-500 text-white">Most Popular</Badge>
        </div>
      )}
      
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold">${plan.price}</span>
          <span className="text-muted-foreground">/{plan.interval}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Plan Limits</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Job Postings:</span>
              <span>{plan.limits.jobPostings === -1 ? 'Unlimited' : plan.limits.jobPostings}</span>
            </div>
            <div className="flex justify-between">
              <span>Candidates/Month:</span>
              <span>{plan.limits.candidatesPerMonth === -1 ? 'Unlimited' : plan.limits.candidatesPerMonth}</span>
            </div>
            <div className="flex justify-between">
              <span>Video Interviews:</span>
              <span>{plan.limits.videoInterviews === -1 ? 'Unlimited' : plan.limits.videoInterviews}</span>
            </div>
            <div className="flex justify-between">
              <span>Team Members:</span>
              <span>{plan.limits.teamMembers === -1 ? 'Unlimited' : plan.limits.teamMembers}</span>
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => onSelect(plan.id)}
          disabled={loading || isCurrentPlan}
          className="w-full"
          variant={isCurrentPlan ? 'secondary' : 'default'}
        >
          {loading ? 'Processing...' : 
           isCurrentPlan ? 'Current Plan' : 
           isUpgrade ? 'Upgrade' : 'Select Plan'}
        </Button>
      </CardContent>
    </Card>
  );
}