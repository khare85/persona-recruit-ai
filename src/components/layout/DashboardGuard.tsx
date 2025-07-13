'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { roleNavigation } from '@/utils/roleRedirection';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole | UserRole[];
}

export default function DashboardGuard({ children, requiredRole }: DashboardGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // If not authenticated, redirect to auth
    if (!user) {
      const currentPath = encodeURIComponent(pathname);
      router.push(`/auth?redirect=${currentPath}`);
      return;
    }

    // Check if user has the required role
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(user.role)) {
      // Redirect to user's appropriate dashboard
      const correctDashboard = roleNavigation.getDashboardPath(user.role);
      router.push(correctDashboard);
      return;
    }
  }, [user, loading, requiredRole, pathname, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-6 w-full max-w-2xl">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // If not authenticated, don't render
  if (!user) {
    return null;
  }

  // If user doesn't have required role, don't render
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}