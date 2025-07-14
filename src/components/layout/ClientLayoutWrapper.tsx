
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { roleNavigation } from '@/utils/roleRedirection';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

// This component handles top-level routing logic for authenticated users.
// It runs on the client-side to access auth state and pathname.
export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      // Don't perform any redirects while auth state is loading
      return;
    }

    // If a user is logged in, redirect them from the homepage to their dashboard
    if (user && pathname === '/') {
      const dashboardPath = roleNavigation.getDashboardPath(user.role);
      router.push(dashboardPath);
      return;
    }
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}
