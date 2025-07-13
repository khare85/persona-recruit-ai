"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CandidateDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/candidates/dashboard');
  }, [router]);

  return null;
}