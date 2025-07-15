
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard - onboarding is now handled via modal
    router.replace('/candidates/dashboard');
  }, [router]);

  return null;
}
