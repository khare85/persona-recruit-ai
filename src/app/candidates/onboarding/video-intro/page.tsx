
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoIntroOnboardingRedirect() {
  const router = useRouter();

  useEffect(() => {
    // This page is deprecated in favor of the onboarding modal.
    // Redirect users to their dashboard, where the modal logic will handle onboarding.
    router.replace('/candidates/dashboard');
  }, [router]);

  return null;
}
