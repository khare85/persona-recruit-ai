import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth as adminAuth } from '@/lib/firebase/server';
import { ApiResponse, APIError, handleApiError } from '@/lib/api-response';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import type { UserRole } from '@/contexts/AuthContext';

// Enhanced request type with user context
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    role: UserRole;
    companyId?: string;
    emailVerified: boolean;
  };
  requestId?: string;
  startTime?: number;
}

// Handler types for different middleware layers
export type Handler = (req: NextRequest, ...args: any[]) => Promise<NextResponse>;
export type AuthenticatedHandler = (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>;
export type ValidatedHandler<T> = (req: AuthenticatedRequest, data: T, ...args: any[]) => Promise<NextResponse>;

// Rate limiting configuration
const rateLimiters = {
  auth: { requests: 5, window: 60 }, // 5 requests per minute for auth
  api: { requests: 100, window: 60 }, // 100 requests per minute for general API
  upload: { requests: 10, window: 60 }, // 10 uploads per minute
  admin: { requests: 200, window: 60 }, // 200 requests per minute for admin
} as const;

// Request correlation and tracing middleware
export const withRequestTracing = (handler: Handler): Handler => {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Add request ID to headers for tracking
    req.headers.set('X-Request-ID', requestId);
    
    // Create enhanced request object
    const enhancedReq = req as AuthenticatedRequest;
    enhancedReq.requestId = requestId;
    enhancedReq.startTime = startTime;

    apiLogger.info('API request started', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
      ip: req.ip
    });

    try {
      const response = await handler(enhancedReq, ...args);
      
      // Add tracing headers to response
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
      
      apiLogger.info('API request completed', {
        requestId,
        status: response.status,
        duration: Date.now() - startTime
      });
      
      return response;
    } catch (error) {
      apiLogger.error('API request failed', {
        requestId,
        method: req.method,
        url: req.url,
        error: String(error),
        duration: Date.now() - startTime
      });
      
      return handleApiError(error);
    }
  };
};

// Enhanced authentication middleware
export const withAuth = (handler: AuthenticatedHandler): Handler => {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      
      if (!token) {
        throw APIError.unauthorized('Authentication token required');
      }

      // Verify Firebase ID token
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Extract user information from token
      const user = {
        uid: decodedToken.uid,
        email: decodedToken.email!,
        role: (decodedToken.role as UserRole) || 'candidate',
        companyId: decodedToken.companyId as string | undefined,
        emailVerified: decodedToken.email_verified || false
      };

      // Add user to request object
      const authReq = req as AuthenticatedRequest;
      authReq.user = user;

      apiLogger.debug('User authenticated', {
        userId: user.uid,
        role: user.role,
        requestId: authReq.requestId
      });

      return await handler(authReq, ...args);
    } catch (error: any) {
      if (error.code?.startsWith('auth/')) {
        throw APIError.unauthorized('Invalid or expired token');
      }
      throw error;
    }
  };
};

// Role-based authorization middleware
export const withRole = (allowedRoles: UserRole[], handler: AuthenticatedHandler): AuthenticatedHandler => {
  return async (req: AuthenticatedRequest, ...args: any[]): Promise<NextResponse> => {
    if (!req.user) {
      throw APIError.unauthorized('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      apiLogger.warn('Access denied - insufficient role', {
        userId: req.user.uid,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        requestId: req.requestId
      });
      
      throw APIError.forbidden(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    return await handler(req, ...args);
  };
};

// Input validation middleware
export const withValidation = <T>(schema: z.ZodSchema<T>) => {
  return (handler: ValidatedHandler<T>): AuthenticatedHandler => {
    return async (req: AuthenticatedRequest, ...args: any[]): Promise<NextResponse> => {
      try {
        const body = await req.json();
        
        // Parse and validate input
        const result = schema.safeParse(body);
        
        if (!result.success) {
          apiLogger.warn('Validation failed', {
            errors: result.error.errors,
            requestId: req.requestId
          });
          
          throw APIError.validation('Invalid request data', result.error.format());
        }

        apiLogger.debug('Input validation successful', {
          requestId: req.requestId
        });

        return await handler(req, result.data, ...args);
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw APIError.validation('Invalid JSON in request body');
        }
        throw error;
      }
    };
  };
};

// Query parameter validation middleware
export const withQueryValidation = <T>(schema: z.ZodSchema<T>) => {
  return (handler: ValidatedHandler<T>): AuthenticatedHandler => {
    return async (req: AuthenticatedRequest, ...args: any[]): Promise<NextResponse> => {
      const { searchParams } = new URL(req.url);
      const queryObject = Object.fromEntries(searchParams.entries());
      
      const result = schema.safeParse(queryObject);
      
      if (!result.success) {
        throw APIError.validation('Invalid query parameters', result.error.format());
      }

      return await handler(req, result.data, ...args);
    };
  };
};

// Security headers middleware
export const withSecurityHeaders = (handler: Handler): Handler => {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const response = await handler(req, ...args);
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Add CORS headers if needed
    if (req.method === 'OPTIONS') {
      response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    return response;
  };
};

// Input sanitization middleware
export const withInputSanitization = (handler: Handler): Handler => {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // For POST/PUT requests, sanitize the body
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        const body = await req.json();
        const sanitizedBody = sanitizeInputObject(body);
        
        // Replace the request body with sanitized version
        const sanitizedRequest = new NextRequest(req, {
          method: req.method,
          headers: req.headers,
          body: JSON.stringify(sanitizedBody)
        });
        
        return await handler(sanitizedRequest, ...args);
      } catch (error) {
        // If body parsing fails, continue with original request
        return await handler(req, ...args);
      }
    }
    
    return await handler(req, ...args);
  };
};

// Rate limiting middleware (simplified - in production use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const withRateLimit = (
  limiterType: keyof typeof rateLimiters = 'api', 
  handler: Handler
): Handler => {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const config = rateLimiters[limiterType];
    const identifier = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = config.window * 1000;
    
    const current = requestCounts.get(identifier);
    
    if (!current || now > current.resetTime) {
      // Reset window
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
    } else if (current.count >= config.requests) {
      // Rate limit exceeded
      apiLogger.warn('Rate limit exceeded', {
        identifier,
        limiterType,
        requestId: (req as AuthenticatedRequest).requestId
      });
      
      throw APIError.rateLimit(`Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds`);
    } else {
      // Increment counter
      current.count++;
    }
    
    const response = await handler(req, ...args);
    
    // Add rate limit headers
    const remaining = Math.max(0, config.requests - (requestCounts.get(identifier)?.count || 0));
    response.headers.set('X-RateLimit-Limit', config.requests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(current?.resetTime || now / 1000).toString());
    
    return response;
  };
};

// Composite middleware for protected routes
export const withProtection = (
  roles: UserRole[] = [],
  rateLimit: keyof typeof rateLimiters = 'api'
) => {
  return (handler: AuthenticatedHandler): Handler => {
    return withRequestTracing(
      withSecurityHeaders(
        withInputSanitization(
          withRateLimit(rateLimit,
            withAuth(
              roles.length > 0 
                ? withRole(roles, handler)
                : handler
            )
          )
        )
      )
    );
  };
};

// Company-scoped authorization (ensures user can only access their company's data)
export const withCompanyScope = (handler: AuthenticatedHandler): AuthenticatedHandler => {
  return async (req: AuthenticatedRequest, ...args: any[]): Promise<NextResponse> => {
    if (!req.user?.companyId && !['super_admin'].includes(req.user?.role || '')) {
      throw APIError.forbidden('Company association required');
    }
    
    return await handler(req, ...args);
  };
};

// Utility function to sanitize input objects
function sanitizeInputObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInputObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeInputObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Common validation schemas
export const CommonSchemas = {
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
  }),
  
  search: z.object({
    q: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),
  
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }),
  
  status: z.object({
    status: z.enum(['active', 'inactive', 'pending', 'archived']).optional()
  })
};