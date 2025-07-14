
'use client';

import { useRouter } from 'next/navigation';

export default function SignupPageRedirect() {
  const router = useRouter();
  
  if (typeof window !== 'undefined') {
    router.replace('/auth');
  }

  return null;
}
