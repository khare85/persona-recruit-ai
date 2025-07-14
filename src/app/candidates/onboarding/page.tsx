
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the first step of the onboarding flow
    router.replace('/candidates/onboarding/resume');
  }, [router]);

  return null;
}
