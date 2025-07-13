'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { roleNavigation } from '@/utils/roleRedirection';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: Array<'super_admin' | 'company_admin' | 'recruiter' | 'interviewer' | 'candidate'>;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  allowedRoles
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // If authentication is required but user is not logged in
    if (requireAuth && !user) {
      const currentPath = encodeURIComponent(pathname);
      router.push(`/auth?redirect=${currentPath}`);
      return;
    }

    // If user is logged in but shouldn't be on this page (like landing page)
    if (user && pathname === '/') {
      const dashboardPath = roleNavigation.getDashboardPath(user.role);
      router.push(dashboardPath);
      return;
    }

    // If user is logged in and specific roles are required
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      const redirectPath = roleNavigation.getUnauthorizedRedirect(user.role);
      router.push(redirectPath);
      return;
    }

    // Check if user has access to the current path
    if (user && !roleNavigation.hasAccessToPath(user.role, pathname)) {
      const redirectPath = roleNavigation.getUnauthorizedRedirect(user.role);
      router.push(redirectPath);
      return;
    }
  }, [user, loading, requireAuth, allowedRoles, pathname, router]);

  // Show loading skeleton while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </div>
    );
  }

  // If auth is required but user is not logged in, don't render children
  if (requireAuth && !user) {
    return null;
  }

  // If specific roles are required and user doesn't have access
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}