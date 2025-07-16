
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
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
  const { user, loading } = useAuth();
  const { isOnboardingComplete, getOnboardingRedirectPath } = useOnboarding();
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
    
    // Check onboarding for candidates - only redirect if we're not already on dashboard
    if (user.role === 'candidate' && !isOnboardingComplete) {
      const onboardingPath = getOnboardingRedirectPath();
      // Allow access to dashboard even if onboarding is incomplete
      if (onboardingPath && pathname !== onboardingPath && !pathname.includes('/dashboard')) {
        router.replace(onboardingPath);
        return;
      }
    }

  }, [user, loading, requiredRole, redirectTo, router, pathname, isOnboardingComplete, getOnboardingRedirectPath]);

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
            // For candidates, allow dashboard access even if onboarding is incomplete
            if (user.role === 'candidate' && !isOnboardingComplete) {
                const onboardingPath = getOnboardingRedirectPath();
                // Only prevent access to non-dashboard pages
                if (onboardingPath && pathname !== onboardingPath && !pathname.includes('/dashboard')) {
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
