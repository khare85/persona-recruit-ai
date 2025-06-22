import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// JWT Secret for token verification
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'recruiter' | 'candidate' | 'interviewer' | 'company_admin';
  companyId?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
}

/**
 * Verify JWT token and extract user information
 */
export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId
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
      const user = verifyToken(token);
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
    if (user.role === 'admin') {
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
 * Generate JWT token for user
 */
export function generateToken(user: Omit<AuthenticatedUser, 'id'> & { id: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Refresh token if it's about to expire
 */
export function refreshTokenIfNeeded(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as any;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;

    // Refresh if token expires within 1 hour
    if (timeUntilExpiry < 3600) {
      return generateToken({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        companyId: decoded.companyId
      });
    }

    return null; // No refresh needed
  } catch (error) {
    console.error('Token refresh check failed:', error);
    return null;
  }
}