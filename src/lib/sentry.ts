import * as Sentry from '@sentry/nextjs';

/**
 * Sentry utilities for error tracking and user context
 */

export interface UserContext {
  id: string;
  email: string;
  role: string;
  companyId?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Configure Sentry scope with user context
 */
export function setSentryUser(user: UserContext) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  });
  
  Sentry.setTag('user.role', user.role);
  
  if (user.companyId) {
    Sentry.setTag('user.companyId', user.companyId);
  }
  
  Sentry.setContext('user_details', {
    role: user.role,
    companyId: user.companyId,
    fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
  Sentry.setTag('user.role', null);
  Sentry.setTag('user.companyId', null);
  Sentry.setContext('user_details', null);
}

/**
 * Set additional context for API requests
 */
export function setSentryContext(context: Record<string, any>) {
  Sentry.setContext('request_context', context);
}

/**
 * Add breadcrumb for important actions
 */
export function addSentryBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception with additional context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  return Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('error_context', context);
    }
    
    scope.setLevel('error');
    return Sentry.captureException(error);
  });
}

/**
 * Capture message with additional context
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  return Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('message_context', context);
    }
    
    scope.setLevel(level);
    return Sentry.captureMessage(message);
  });
}

/**
 * Start a new Sentry transaction
 */
export function startTransaction(name: string, op: string, description?: string) {
  return Sentry.startTransaction({
    name,
    op,
    description,
  });
}

/**
 * Measure performance of a function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const transaction = startTransaction(name, 'function');
  
  if (context) {
    transaction.setContext('performance_context', context);
  }
  
  try {
    const result = await fn();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Wrap API handler with Sentry error handling
 */
export function withSentryErrorHandler<T extends (...args: any[]) => any>(
  handler: T,
  options?: {
    operationName?: string;
    includeRequest?: boolean;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const operationName = options?.operationName || 'api_handler';
    
    return await Sentry.withScope(async (scope) => {
      scope.setTag('operation', operationName);
      
      if (options?.includeRequest && args[0]) {
        const req = args[0];
        if (req.method && req.url) {
          scope.setContext('request', {
            method: req.method,
            url: req.url,
            headers: req.headers,
            // Don't include body for security
          });
        }
      }
      
      try {
        return await handler(...args);
      } catch (error) {
        captureException(error instanceof Error ? error : new Error(String(error)), {
          operationName,
          args: args.length,
        });
        throw error;
      }
    });
  }) as T;
}

/**
 * Sentry performance monitoring utilities
 */
export const performance = {
  /**
   * Mark the start of a performance measurement
   */
  mark: (name: string) => {
    addSentryBreadcrumb(`Performance mark: ${name}`, 'performance', 'info');
  },
  
  /**
   * Measure time between two marks
   */
  measure: (name: string, startMark: string, endMark?: string) => {
    addSentryBreadcrumb(`Performance measure: ${name}`, 'performance', 'info', {
      startMark,
      endMark,
    });
  },
  
  /**
   * Record a custom metric
   */
  metric: (name: string, value: number, unit?: string) => {
    Sentry.metrics.gauge(name, value, {
      unit,
      tags: {
        environment: process.env.NODE_ENV,
      },
    });
  },
};

/**
 * Business logic error tracking
 */
export const business = {
  /**
   * Track authentication failures
   */
  authFailure: (reason: string, email?: string) => {
    captureMessage(`Authentication failure: ${reason}`, 'warning', {
      email,
      reason,
      category: 'auth',
    });
  },
  
  /**
   * Track payment failures
   */
  paymentFailure: (reason: string, amount?: number, currency?: string) => {
    captureMessage(`Payment failure: ${reason}`, 'error', {
      amount,
      currency,
      reason,
      category: 'payment',
    });
  },
  
  /**
   * Track API rate limiting
   */
  rateLimited: (endpoint: string, userId?: string) => {
    captureMessage(`Rate limit exceeded: ${endpoint}`, 'warning', {
      endpoint,
      userId,
      category: 'rate_limit',
    });
  },
  
  /**
   * Track feature usage
   */
  featureUsed: (feature: string, userId: string, metadata?: Record<string, any>) => {
    addSentryBreadcrumb(`Feature used: ${feature}`, 'feature', 'info', {
      feature,
      userId,
      ...metadata,
    });
  },
};

export default {
  setSentryUser,
  clearSentryUser,
  setSentryContext,
  addSentryBreadcrumb,
  captureException,
  captureMessage,
  startTransaction,
  measurePerformance,
  withSentryErrorHandler,
  performance,
  business,
};