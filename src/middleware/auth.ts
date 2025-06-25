
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Use application default credentials in production/cloud environments
      admin.initializeApp();
    }
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
  }
}

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
export async function verifyToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Custom claims are the source of truth for roles and other user metadata
    const role = (decodedToken.role as UserRole) || 'candidate';
    const companyId = decodedToken.companyId || undefined;
    
    return {
      id: decodedToken.uid,
      email: decodedToken.email || '',
      role,
      companyId
    };
  } catch (error) {
    console.error('Firebase ID Token verification failed:', error);
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
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
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    return handler(req, ...args);
  });
}
