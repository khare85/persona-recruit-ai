import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import admin from 'firebase-admin';

export interface UserInfo {
  id: string;
  email: string;
  role: 'admin' | 'company_admin' | 'recruiter' | 'interviewer' | 'candidate';
  companyId?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserInfo;
  error?: string;
}

/**
 * Verify user authentication and role permissions using Firebase Auth
 */
export async function verifyUserRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<AuthResult> {
  try {
    // Get Firebase ID token from cookies or Authorization header
    const cookieStore = await cookies();
    let idToken = cookieStore.get('firebase-auth-token')?.value;
    
    if (!idToken) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        idToken = authHeader.substring(7);
      }
    }

    if (!idToken) {
      return {
        success: false,
        error: 'No authentication token provided'
      };
    }

    // Verify Firebase ID token
    let decodedToken: admin.auth.DecodedIdToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (firebaseError) {
      return {
        success: false,
        error: 'Invalid or expired Firebase token'
      };
    }

    // Extract user info from Firebase token and custom claims
    const user: UserInfo = {
      id: decodedToken.uid,
      email: decodedToken.email || '',
      role: (decodedToken.role as any) || 'candidate', // From custom claims
      companyId: decodedToken.companyId as string,
      firstName: decodedToken.firstName as string,
      lastName: decodedToken.lastName as string
    };

    // Check if user role is allowed
    if (!allowedRoles.includes(user.role) && !allowedRoles.includes('system')) {
      return {
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      };
    }

    return {
      success: true,
      user
    };

  } catch (error) {
    return {
      success: false,
      error: 'Authentication verification failed'
    };
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: UserInfo, permission: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'read:all_analytics',
      'write:all_analytics',
      'manage:alert_rules',
      'export:analytics',
      'manage:users',
      'manage:companies'
    ],
    company_admin: [
      'read:company_analytics',
      'write:company_analytics',
      'manage:company_alert_rules',
      'export:company_analytics',
      'manage:company_users'
    ],
    recruiter: [
      'read:company_analytics',
      'write:metrics',
      'read:bias_reports'
    ],
    interviewer: [
      'read:interview_analytics',
      'write:interview_metrics'
    ],
    candidate: [
      'read:own_data'
    ]
  };

  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes(permission);
}

/**
 * Mock user data for development/testing
 */
export function getMockUser(role: string = 'admin'): UserInfo {
  return {
    id: 'mock-user-id',
    email: 'test@example.com',
    role: role as any,
    companyId: 'mock-company-id',
    firstName: 'Test',
    lastName: 'User'
  };
}

/**
 * Get current user from request (for use in API routes)
 */
export async function getCurrentUser(request: NextRequest): Promise<UserInfo | null> {
  const authResult = await verifyUserRole(request, ['admin', 'company_admin', 'recruiter', 'interviewer', 'candidate']);
  return authResult.success ? authResult.user! : null;
}

/**
 * Middleware helper to check authentication using Firebase Auth
 */
export async function requireAuth(
  request: NextRequest,
  allowedRoles: string[] = []
): Promise<{ user: UserInfo } | Response> {
  const authResult = await verifyUserRole(request, allowedRoles.length > 0 ? allowedRoles : ['admin', 'company_admin', 'recruiter']);
  
  if (!authResult.success) {
    return new Response(
      JSON.stringify({ error: authResult.error }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return { user: authResult.user! };
}