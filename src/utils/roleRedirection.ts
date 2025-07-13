/**
 * Centralized role-based redirection utility
 * Ensures consistent navigation based on user roles
 */

import type { UserRole } from '@/contexts/AuthContext';

/**
 * Get the dashboard URL for a specific user role
 */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return '/admin/dashboard';
    case 'company_admin':
      return '/company/dashboard';
    case 'recruiter':
      return '/recruiter/dashboard';
    case 'interviewer':
      return '/interviewer/dashboard';
    case 'candidate':
    default:
      return '/candidates/dashboard';
  }
}

/**
 * Get the default landing page after login based on role
 */
export function getDefaultRedirectPath(role: UserRole): string {
  return getDashboardPath(role);
}

/**
 * Check if a user has access to a specific path based on their role
 */
export function hasAccessToPath(userRole: UserRole, path: string): boolean {
  const rolePaths: Record<UserRole, string[]> = {
    super_admin: ['/admin', '/company', '/recruiter', '/interviewer', '/candidates'],
    company_admin: ['/company', '/recruiter', '/interviewer', '/candidates'],
    recruiter: ['/recruiter', '/candidates'],
    interviewer: ['/interviewer', '/candidates'],
    candidate: ['/candidates']
  };

  const allowedPaths = rolePaths[userRole] || [];
  return allowedPaths.some(allowedPath => path.startsWith(allowedPath));
}

/**
 * Get appropriate redirect for unauthorized access
 */
export function getUnauthorizedRedirect(userRole: UserRole): string {
  return getDashboardPath(userRole);
}

/**
 * Role-based navigation helper
 */
export const roleNavigation = {
  getDashboardPath,
  getDefaultRedirectPath,
  hasAccessToPath,
  getUnauthorizedRedirect
};