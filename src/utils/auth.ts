import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';

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
 * Verify user authentication and role permissions
 */
export async function verifyUserRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<AuthResult> {
  try {
    // Get token from cookies or Authorization header
    const cookieStore = await cookies();
    let token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided'
      };
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return {
        success: false,
        error: 'JWT secret not configured'
      };
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    // Extract user info from token
    const user: UserInfo = {
      id: decoded.id || decoded.uid,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
      firstName: decoded.firstName,
      lastName: decoded.lastName
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
 * Create JWT token for user (for testing/development)
 */
export function createAuthToken(user: UserInfo): string {
  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      firstName: user.firstName,
      lastName: user.lastName
    },
    jwtSecret,
    { expiresIn: '24h' }
  );
}

/**
 * Middleware helper to check authentication
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