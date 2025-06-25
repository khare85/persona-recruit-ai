
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (serviceAccount) {
    const serviceAccountObj = JSON.parse(serviceAccount);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountObj)
    });
  } else {
    // Use default credentials in production/deployment
    admin.initializeApp();
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'super_admin' | 'company_admin' | 'recruiter' | 'candidate' | 'interviewer';
  companyId?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
}

/**
 * Verify Firebase ID token and extract user information
 */
export async function verifyToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user's custom claims (including role)
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};
    
    // Also check Firestore for user role if not in custom claims
    let role = customClaims.role;
    let companyId = customClaims.companyId;
    
    if (!role) {
      // Fallback to checking Firestore
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        role = userData?.role || 'candidate';
        companyId = userData?.companyId;
      }
    }
    
    return {
      id: decodedToken.uid,
      email: decodedToken.email || '',
      role: role || 'candidate',
      companyId: companyId
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Authentication middleware for API routes
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: AuthenticatedRequest, ...args: any[]) => {
    try {
      // Get token from Authorization header or cookies
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7)
        : req.cookies.get('auth-token')?.value;

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Verify token and extract user
      const user = await verifyToken(token);
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Add user to request
      req.user = user;

      // Call the original handler
      return handler(req, ...args);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Role-based authorization middleware
 */
export function withRole(
  allowedRoles: AuthenticatedUser['role'][],
  handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest, ...args: any[]) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(req, ...args);
  });
}

/**
 * Company-scoped authorization (users can only access their company's data)
 */
export function withCompanyScope(
  handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest, ...args: any[]) => {
    const user = req.user!;
    
    // Admin can access all company data
    if (user.role === 'super_admin') {
      return handler(req, ...args);
    }

    // Other roles must have a company association
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Company association required' },
        { status: 403 }
      );
    }

    return handler(req, ...args);
  });
}

/**
 * Set custom claims for a user (admin only)
 */
export async function setUserClaims(uid: string, claims: { role?: string; companyId?: string }) {
  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Failed to set custom claims:', error);
    return false;
  }
}
