import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  requestId: string;
  timestamp: string;
  metadata?: {
    pagination?: PaginationMeta;
    filters?: any;
    cached?: boolean;
    performance?: {
      duration: number;
      queries?: number;
    };
  };
}

export interface ApiErrorDetails {
  code?: string;
  field?: string;
  details?: any;
  stack?: string;
}

class ApiResponseBuilder {
  private requestId: string;
  private timestamp: string;
  private performance?: { startTime: number; queries?: number };

  constructor() {
    this.requestId = uuidv4();
    this.timestamp = new Date().toISOString();
  }

  startTiming() {
    this.performance = { startTime: Date.now() };
    return this;
  }

  endTiming(queries?: number) {
    if (this.performance) {
      this.performance = {
        ...this.performance,
        queries
      };
    }
    return this;
  }

  success<T>(
    data: T, 
    message?: string, 
    metadata?: Partial<StandardApiResponse['metadata']>
  ): NextResponse {
    const duration = this.performance 
      ? Date.now() - this.performance.startTime 
      : undefined;

    const response: StandardApiResponse<T> = {
      success: true,
      data,
      message,
      requestId: this.requestId,
      timestamp: this.timestamp,
      metadata: {
        ...metadata,
        ...(duration !== undefined && {
          performance: {
            duration,
            queries: this.performance?.queries
          }
        })
      }
    };

    return NextResponse.json(response);
  }

  error(
    error: string, 
    statusCode: number = 500,
    details?: ApiErrorDetails
  ): NextResponse {
    const duration = this.performance 
      ? Date.now() - this.performance.startTime 
      : undefined;

    const response: StandardApiResponse = {
      success: false,
      error,
      requestId: this.requestId,
      timestamp: this.timestamp,
      ...(details && { details }),
      ...(duration !== undefined && {
        metadata: {
          performance: { duration }
        }
      })
    };

    return NextResponse.json(response, { status: statusCode });
  }

  validationError(errors: any[], message = 'Validation failed'): NextResponse {
    return this.error(message, 400, {
      code: 'VALIDATION_ERROR',
      details: errors
    });
  }

  unauthorized(message = 'Authentication required'): NextResponse {
    return this.error(message, 401, {
      code: 'UNAUTHORIZED'
    });
  }

  forbidden(message = 'Access denied'): NextResponse {
    return this.error(message, 403, {
      code: 'FORBIDDEN'
    });
  }

  notFound(resource = 'Resource', message?: string): NextResponse {
    return this.error(
      message || `${resource} not found`, 
      404, 
      { code: 'NOT_FOUND' }
    );
  }

  conflict(message = 'Resource already exists'): NextResponse {
    return this.error(message, 409, {
      code: 'CONFLICT'
    });
  }

  rateLimit(message = 'Too many requests'): NextResponse {
    return this.error(message, 429, {
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  paginated<T>(
    items: T[], 
    pagination: PaginationMeta, 
    message?: string
  ): NextResponse {
    return this.success(
      { items, pagination }, 
      message,
      { pagination }
    );
  }
}

// Utility functions for creating API responses
export const ApiResponse = {
  create: () => new ApiResponseBuilder(),
  
  // Quick static methods for common cases
  success: <T>(data: T, message?: string) => 
    new ApiResponseBuilder().success(data, message),
    
  error: (error: string, statusCode = 500, details?: ApiErrorDetails) => 
    new ApiResponseBuilder().error(error, statusCode, details),
    
  validationError: (errors: any[], message?: string) => 
    new ApiResponseBuilder().validationError(errors, message),
    
  unauthorized: (message?: string) => 
    new ApiResponseBuilder().unauthorized(message),
    
  forbidden: (message?: string) => 
    new ApiResponseBuilder().forbidden(message),
    
  notFound: (resource?: string, message?: string) => 
    new ApiResponseBuilder().notFound(resource, message),
    
  conflict: (message?: string) => 
    new ApiResponseBuilder().conflict(message),
    
  rateLimit: (message?: string) => 
    new ApiResponseBuilder().rateLimit(message)
};

// Custom API error class for better error handling
export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }

  static validation(message: string, details?: any) {
    return new APIError(message, 400, 'VALIDATION_ERROR', details);
  }

  static unauthorized(message = 'Authentication required') {
    return new APIError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Access denied') {
    return new APIError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new APIError(message, 404, 'NOT_FOUND');
  }

  static conflict(message = 'Resource already exists') {
    return new APIError(message, 409, 'CONFLICT');
  }

  static rateLimit(message = 'Too many requests') {
    return new APIError(message, 429, 'RATE_LIMIT_EXCEEDED');
  }

  static internal(message = 'Internal server error') {
    return new APIError(message, 500, 'INTERNAL_ERROR');
  }
}

// Global error handler for API routes
export const handleApiError = (error: any): NextResponse => {
  const response = ApiResponse.create();

  if (error instanceof APIError) {
    return response.error(error.message, error.statusCode, {
      code: error.code,
      details: error.details
    });
  }

  // Handle validation errors from Zod
  if (error.name === 'ZodError') {
    return response.validationError(
      error.errors,
      'Invalid request data'
    );
  }

  // Handle Firebase errors
  if (error.code?.startsWith('auth/')) {
    return response.unauthorized(error.message);
  }

  // Log unexpected errors for debugging
  console.error('Unexpected API error:', error);

  return response.error(
    process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  );
};