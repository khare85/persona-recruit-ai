import { NextRequest, NextResponse } from 'next/server';
import { rateLimitConfig, validateAndSanitizeIP } from '@/lib/validation';
import { RateLimitError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

/**
 * In-memory rate limiting store (use Redis in production)
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiting middleware
 */
export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests: number, windowMinutes: number = 1) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  check(identifier: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return {
        allowed: true,
        resetTime: now + this.windowMs,
        remaining: this.maxRequests - 1
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0
      };
    }

    entry.count++;
    rateLimitStore.set(identifier, entry);

    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: this.maxRequests - entry.count
    };
  }

  // Clean up expired entries (run periodically)
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Create rate limiters for different endpoint types
const rateLimiters = {
  auth: new RateLimiter(rateLimitConfig.auth, 1),
  upload: new RateLimiter(rateLimitConfig.upload, 1),
  search: new RateLimiter(rateLimitConfig.search, 1),
  api: new RateLimiter(rateLimitConfig.api, 1),
  ai: new RateLimiter(rateLimitConfig.ai, 1)
};

/**
 * Apply rate limiting to request
 */
export function withRateLimit(
  type: keyof typeof rateLimiters,
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // Get client identifier (IP + User-Agent for better uniqueness)
      const ip = getClientIP(req);
      const userAgent = req.headers.get('user-agent') || '';
      const identifier = `${ip}:${type}:${Buffer.from(userAgent).toString('base64').slice(0, 10)}`;

      const result = rateLimiters[type].check(identifier);

      if (!result.allowed) {
        apiLogger.warn('Rate limit exceeded', {
          ip,
          type,
          identifier: identifier.slice(0, 20) + '...'
        });

        const response = NextResponse.json(
          {
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_ERROR',
            resetTime: result.resetTime
          },
          { status: 429 }
        );

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', rateLimitConfig[type].toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining?.toString() || '0');
        response.headers.set('X-RateLimit-Reset', result.resetTime?.toString() || '0');

        return response;
      }

      // Add rate limit headers to successful responses
      const response = await handler(req, ...args);
      response.headers.set('X-RateLimit-Limit', rateLimitConfig[type].toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining?.toString() || '0');
      response.headers.set('X-RateLimit-Reset', result.resetTime?.toString() || '0');

      return response;
    } catch (error) {
      apiLogger.error('Rate limiting error', { error: String(error) });
      return handler(req, ...args); // Continue without rate limiting on error
    }
  };
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const response = await handler(req, ...args);

    // Security headers
    const securityHeaders = {
      // Prevent XSS attacks
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      
      // HTTPS enforcement
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://api.elevenlabs.io https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://persona-recruit-ai.firebaseapp.com wss://api.elevenlabs.io",
        "media-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions policy
      'Permissions-Policy': [
        'camera=(self)',
        'microphone=(self)',
        'location=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'accelerometer=()',
        'gyroscope=()'
      ].join(', ')
    };

    // Apply security headers
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Remove server information
    response.headers.delete('Server');
    response.headers.delete('X-Powered-By');

    return response;
  };
}

/**
 * CORS middleware for API routes
 */
export function withCORS(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
  } = {}
) {
  const {
    origin = process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_APP_URL : '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials = true
  } = options;

  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 });
      
      if (Array.isArray(origin)) {
        const requestOrigin = req.headers.get('origin');
        if (requestOrigin && origin.includes(requestOrigin)) {
          response.headers.set('Access-Control-Allow-Origin', requestOrigin);
        }
      } else {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
      
      response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
      response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      
      if (credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      response.headers.set('Access-Control-Max-Age', '86400');
      
      return response;
    }

    // Handle actual requests
    const response = await handler(req, ...args);

    if (Array.isArray(origin)) {
      const requestOrigin = req.headers.get('origin');
      if (requestOrigin && origin.includes(requestOrigin)) {
        response.headers.set('Access-Control-Allow-Origin', requestOrigin);
      }
    } else {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    if (credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  };
}

/**
 * Input sanitization middleware
 */
export function withInputSanitization(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Sanitize query parameters
    const url = new URL(req.url);
    const sanitizedParams = new URLSearchParams();
    
    for (const [key, value] of url.searchParams.entries()) {
      // Remove potentially dangerous characters
      const sanitizedKey = key.replace(/[<>\"']/g, '');
      const sanitizedValue = value.replace(/[<>\"']/g, '');
      sanitizedParams.append(sanitizedKey, sanitizedValue);
    }

    // Create new request with sanitized parameters
    const sanitizedUrl = new URL(req.url);
    sanitizedUrl.search = sanitizedParams.toString();
    
    const sanitizedRequest = new NextRequest(sanitizedUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    return handler(sanitizedRequest, ...args);
  };
}

/**
 * Get client IP address
 */
function getClientIP(req: NextRequest): string {
  // Check various headers for real IP
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');

  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    const validIP = ips.find(ip => validateAndSanitizeIP(ip));
    if (validIP) return validIP;
  }

  if (xRealIP) {
    const validIP = validateAndSanitizeIP(xRealIP);
    if (validIP) return validIP;
  }

  if (cfConnectingIP) {
    const validIP = validateAndSanitizeIP(cfConnectingIP);
    if (validIP) return validIP;
  }

  // Fallback to connection IP
  return req.ip || '127.0.0.1';
}

/**
 * Cleanup expired rate limit entries periodically
 */
setInterval(() => {
  Object.values(rateLimiters).forEach(limiter => limiter.cleanup());
}, 5 * 60 * 1000); // Every 5 minutes