"use client";

import { useDemo } from '@/contexts/DemoContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function DemoModeBanner() {
  const { isDemoMode, demoRole } = useDemo();

  if (!isDemoMode) return null;

  const roleDisplayName = {
    recruiter: 'Recruiter',
    company_admin: 'Company Admin',
    super_admin: 'Super Admin',
    interviewer: 'Interviewer',
    candidate: 'Candidate'
  };

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-800">
      <Info className="h-4 w-4" />
      <AlertDescription>
        You are viewing the platform in <strong>Demo Mode</strong> as a {roleDisplayName[demoRole as keyof typeof roleDisplayName] || 'User'}. 
        Data shown is for demonstration purposes only. To access full features, please sign in or create an account.
      </AlertDescription>
    </Alert>
  );
}