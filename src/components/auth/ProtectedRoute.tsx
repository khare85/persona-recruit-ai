'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo);
        return;
      }

      if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (user.role && !allowedRoles.includes(user.role)) {
          // Redirect user to their own dashboard if they access a forbidden page
          let redirectPath = '/login'; // Default redirect
          switch (user.role) {
            case 'super_admin':
              redirectPath = '/admin/dashboard';
              break;
            case 'company_admin':
              redirectPath = '/company/dashboard';
              break;
            case 'recruiter':
              redirectPath = '/recruiter/dashboard';
              break;
            case 'candidate':
              redirectPath = '/candidates/dashboard';
              break;
            case 'interviewer':
              redirectPath = '/interviewer/dashboard';
              break;
          }
          router.push(redirectPath);
          return;
        }
      }
    }
  }, [user, loading, requiredRole, redirectTo, router]);

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

  if (!user) {
    return null;
  }

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (user.role && !allowedRoles.includes(user.role)) {
      return null;
    }
  }

  return <>{children}</>;
}
