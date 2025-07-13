'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { roleNavigation } from '@/utils/roleRedirection';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Public paths that don't require authentication
    const publicPaths = [
      '/auth',
      '/auth/register/candidate',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/privacy',
      '/terms',
      '/about',
      '/support',
      '/careers'
    ];

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
    const isHomePage = pathname === '/';

    // If user is logged in and tries to access auth pages, redirect to their dashboard
    if (user && (pathname.startsWith('/auth') && pathname !== '/auth/logout')) {
      const dashboardPath = roleNavigation.getDashboardPath(user.role);
      router.push(dashboardPath);
      return;
    }

    // If user is logged in and on homepage, redirect to their dashboard
    if (user && isHomePage) {
      const dashboardPath = roleNavigation.getDashboardPath(user.role);
      router.push(dashboardPath);
      return;
    }

    // If user is not logged in and tries to access protected pages
    if (!user && !isPublicPath && !isHomePage) {
      const currentPath = encodeURIComponent(pathname);
      router.push(`/auth?redirect=${currentPath}`);
      return;
    }

    // If user is logged in, check if they have access to the current path
    if (user && !isPublicPath && !isHomePage) {
      if (!roleNavigation.hasAccessToPath(user.role, pathname)) {
        const redirectPath = roleNavigation.getUnauthorizedRedirect(user.role);
        router.push(redirectPath);
        return;
      }
    }
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}