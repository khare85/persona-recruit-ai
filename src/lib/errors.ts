import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { apiLogger } from './logger';
import { captureException } from './sentry';

/**
 * Custom error classes for different types of application errors
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly details: any;

  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string) {
    super(`${service} service error: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * Error handler for API routes
 */
export function handleApiError(error: unknown, requestId?: string): NextResponse {
  const logMetadata = { requestId };

  // Handle known application errors
  if (error instanceof AppError) {
    apiLogger.warn(
      `Application error: ${error.message}`,
      { ...logMetadata, code: error.code, statusCode: error.statusCode }
    );

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && { details: error.details })
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    apiLogger.warn('Validation error', { ...logMetadata, issues: error.issues });

    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  // Handle unexpected errors
  if (error instanceof Error) {
    apiLogger.error(
      `Unexpected error: ${error.message}`,
      logMetadata,
      error
    );

    // Capture exception in Sentry for unexpected errors
    captureException(error, { requestId, context: 'api_error' });

    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message;

    return NextResponse.json(
      {
        error: message,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  apiLogger.error(
    'Unknown error type',
    { ...logMetadata, error: String(error) }
  );

  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    },
    { status: 500 }
  );
}

/**
 * Async error wrapper for API route handlers
 */
export function asyncHandler(
  fn: (...args: any[]) => Promise<NextResponse>
) {
  return async (...args: any[]): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(): void {
  const required = [
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'GOOGLE_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(): void {
  const shutdown = (signal: string) => {
    apiLogger.info(`Received ${signal}, starting graceful shutdown`);
    
    // Close database connections, finish ongoing requests, etc.
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}