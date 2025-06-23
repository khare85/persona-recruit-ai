/**
 * Middleware for request limits and timeouts
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RequestLimitConfig {
  maxBodySize?: number; // in bytes
  timeout?: number; // in milliseconds
}

const DEFAULT_LIMITS: RequestLimitConfig = {
  maxBodySize: 5 * 1024 * 1024, // 5MB
  timeout: 30000 // 30 seconds
};

// Route-specific limits
const ROUTE_LIMITS: Record<string, RequestLimitConfig> = {
  '/api/candidates/resume': {
    maxBodySize: 10 * 1024 * 1024, // 10MB for resumes
    timeout: 60000 // 60 seconds for processing
  },
  '/api/candidates/video-intro': {
    maxBodySize: 50 * 1024 * 1024, // 50MB for videos
    timeout: 120000 // 2 minutes
  },
  '/api/company/upload': {
    maxBodySize: 5 * 1024 * 1024, // 5MB
    timeout: 45000
  },
  '/api/candidates/resume-process': {
    maxBodySize: 10 * 1024 * 1024, // 10MB
    timeout: 90000 // 90 seconds for AI processing
  }
};

export function withRequestLimits(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  customLimits?: RequestLimitConfig
) {
  return async (req: NextRequest, context?: any) => {
    const pathname = new URL(req.url).pathname;
    const limits = { ...DEFAULT_LIMITS, ...ROUTE_LIMITS[pathname], ...customLimits };

    // Set timeout
    const timeoutPromise = new Promise<NextResponse>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout'));
      }, limits.timeout!);
    });

    try {
      // Handle the request with timeout
      const response = await Promise.race([
        handler(req, context),
        timeoutPromise
      ]);

      return response;
    } catch (error) {
      if (error instanceof Error && error.message === 'Request timeout') {
        return NextResponse.json(
          { error: 'Request timeout', message: 'The request took too long to process' },
          { status: 504 }
        );
      }
      throw error;
    }
  };
}

// Export config for Next.js API routes
export const apiConfig = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
    responseLimit: '5mb',
  },
};

// Route-specific configs
export const resumeApiConfig = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
};

export const videoApiConfig = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '5mb',
  },
};