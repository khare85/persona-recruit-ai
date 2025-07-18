
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/server';

export type UserRole = 'super_admin' | 'company_admin' | 'recruiter' | 'interviewer' | 'candidate';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  companyId?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
}

/**
 * Verify Firebase ID token and extract user information including custom claims.
 */
export async function verifyFirebaseToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const admin = await getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const role = (decodedToken.role as UserRole) || 'candidate';
    const companyId = decodedToken.companyId || undefined;
    
    return {
      id: decodedToken.uid,
      email: decodedToken.email || '',
      role,
      companyId
    };
  } catch (error) {
    console.error('[verifyFirebaseToken] Firebase ID Token verification failed:', error);
    return null;
  }
}

/**
 * Higher-order function (middleware) to protect API routes.
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: AuthenticatedRequest, ...args: any[]) => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required: No token provided.' }, { status: 401 });
    }

    const user = await verifyFirebaseToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });
    }

    req.user = user;
    return handler(req, ...args);
  };
}

/**
 * Role-based authorization middleware.
 */
export function withRole(
  allowedRoles: UserRole[],
  handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>
) {
  return withAuth(async (req, ...args) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions for this action.' }, { status: 403 });
    }
    return handler(req, ...args);
  });
}
