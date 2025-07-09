"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDemo } from '@/contexts/DemoContext';

export default function CandidateDashboardRedirect() {
  const router = useRouter();
  const { setDemoMode } = useDemo();

  useEffect(() => {
    // If accessing /candidate/dashboard, set demo mode for candidate
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      setDemoMode('candidate');
    }
    
    // Redirect to the actual candidates dashboard (plural)
    router.replace('/candidates/dashboard');
  }, [router, setDemoMode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}