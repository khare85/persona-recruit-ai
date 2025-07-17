import { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase/server';
import { apiLogger } from '@/lib/logger';

export interface AuthenticatedUser {
  uid: string;
  id: string;
  email?: string;
  role?: string;
  companyId?: string;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error?: string;
}

/**
 * Verify Firebase ID token from request headers
 * @param req NextRequest object
 * @returns AuthResult with user data or error
 */
export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
  try {
    const authorization = req.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      apiLogger.warn('Missing or invalid authorization header');
      return { user: null, error: 'Missing authorization header' };
    }

    const token = authorization.split(' ')[1];
    
    if (!token) {
      apiLogger.warn('Missing token in authorization header');
      return { user: null, error: 'Missing token' };
    }

    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      const user: AuthenticatedUser = {
        uid: decodedToken.uid,
        id: decodedToken.uid, // Both uid and id for compatibility
        email: decodedToken.email,
        role: decodedToken.role || 'candidate',
        companyId: decodedToken.companyId
      };

      apiLogger.info('Token verified successfully', { 
        userId: user.uid, 
        role: user.role,
        hasCompanyId: !!user.companyId
      });
      
      return { user };
    } catch (error) {
      apiLogger.error('Token verification failed', { 
        error: String(error),
        tokenLength: token.length
      });
      return { user: null, error: 'Invalid token' };
    }
  } catch (error) {
    apiLogger.error('Auth verification error', { error: String(error) });
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Verify auth and require specific role
 * @param req NextRequest object
 * @param requiredRole Required user role
 * @returns AuthResult with user data or error
 */
export async function verifyAuthWithRole(req: NextRequest, requiredRole: string): Promise<AuthResult> {
  const authResult = await verifyAuth(req);
  
  if (!authResult.user) {
    return authResult;
  }

  if (authResult.user.role !== requiredRole) {
    apiLogger.warn('Insufficient permissions', { 
      userId: authResult.user.uid, 
      userRole: authResult.user.role, 
      requiredRole 
    });
    return { user: null, error: 'Insufficient permissions' };
  }

  return authResult;
}

/**
 * Verify auth and require one of multiple roles
 * @param req NextRequest object
 * @param allowedRoles Array of allowed roles
 * @returns AuthResult with user data or error
 */
export async function verifyAuthWithRoles(req: NextRequest, allowedRoles: string[]): Promise<AuthResult> {
  const authResult = await verifyAuth(req);
  
  if (!authResult.user) {
    return authResult;
  }

  if (!allowedRoles.includes(authResult.user.role || '')) {
    apiLogger.warn('Insufficient permissions', { 
      userId: authResult.user.uid, 
      userRole: authResult.user.role, 
      allowedRoles 
    });
    return { user: null, error: 'Insufficient permissions' };
  }

  return authResult;
}

/**
 * Extract user ID from request headers (for use in middleware)
 * @param req NextRequest object
 * @returns User ID or null
 */
export async function getUserId(req: NextRequest): Promise<string | null> {
  const authResult = await verifyAuth(req);
  return authResult.user?.uid || null;
}