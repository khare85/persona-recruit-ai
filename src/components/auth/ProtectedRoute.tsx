
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { roleNavigation } from '@/utils/roleRedirection';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { user, loading, checkOnboardingComplete, getOnboardingRedirectPath } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push(redirectTo);
      return;
    }

    // Check role access
    if (requiredRole) {
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (user.role && !allowedRoles.includes(user.role)) {
        const redirectPath = roleNavigation.getUnauthorizedRedirect(user.role);
        router.push(redirectPath);
        return;
      }
    }
    
    // Check onboarding for candidates
    if (user.role === 'candidate' && !checkOnboardingComplete()) {
      const onboardingPath = getOnboardingRedirectPath();
      if (onboardingPath && pathname !== onboardingPath) {
        router.replace(onboardingPath);
        return;
      }
    }

  }, [user, loading, requiredRole, redirectTo, router, pathname, checkOnboardingComplete, getOnboardingRedirectPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </div>
    );
  }

  // If we are still here after checks and not loading, render the children
  if (user) {
     if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (user.role && allowedRoles.includes(user.role)) {
            // For candidates, also ensure onboarding is complete if they are trying to access a protected page
            if (user.role === 'candidate' && !checkOnboardingComplete()) {
                const onboardingPath = getOnboardingRedirectPath();
                if (onboardingPath && pathname !== onboardingPath) {
                    return null; // Don't render content while redirecting
                }
            }
            return <>{children}</>;
        }
     } else {
        return <>{children}</>;
     }
  }

  return null; // Return null while redirecting
}
