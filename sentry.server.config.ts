import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Configure the scope to include additional context
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry] Server event would be sent:', event);
      return null;
    }
    
    // Add additional context
    if (event.request) {
      event.tags = {
        ...event.tags,
        component: 'server',
        environment: process.env.NODE_ENV,
      };
    }
    
    // Filter out noisy errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Skip Firebase auth errors that are expected
      if (error instanceof Error) {
        if (error.message.includes('auth/user-not-found') ||
            error.message.includes('auth/wrong-password') ||
            error.message.includes('auth/too-many-requests')) {
          return null;
        }
        
        // Skip Stripe webhook validation errors (they're expected)
        if (error.message.includes('webhook') && error.message.includes('signature')) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  // Performance Monitoring
  profilesSampleRate: 1.0,
  
  // Additional configuration
  release: process.env.npm_package_version,
  maxBreadcrumbs: 50,
  attachStacktrace: true,
  
  // Server-specific configuration
  integrations: [
    Sentry.httpIntegration({
      tracing: {
        shouldCreateSpanForRequest: (url) => {
          // Don't create spans for health checks or static assets
          return !url.includes('/health') && 
                 !url.includes('/api/health') &&
                 !url.includes('/_next/') &&
                 !url.includes('/favicon.ico');
        },
      },
    }),
    Sentry.prismaIntegration(),
  ],
  
  // Ignore specific errors
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'Non-Error exception captured',
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
    'DYNAMIC_SERVER_USAGE',
    'Firebase: Error (auth/user-not-found)',
    'Firebase: Error (auth/wrong-password)',
    'Firebase: Error (auth/too-many-requests)',
    'Firebase: Error (auth/email-already-in-use)',
    'Stripe webhook signature verification failed',
    'Rate limit exceeded',
    'Unauthorized',
    'Forbidden',
    'Not Found',
    'Method Not Allowed',
    'Validation Error',
    'AbortError',
    'TimeoutError',
    'NetworkError',
    'TypeError: fetch failed',
    'TypeError: Failed to fetch',
    'Connection refused',
    'Socket hang up',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
  ],
  
  // Transaction naming
  beforeSendTransaction(event) {
    // Don't send transactions in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // Skip health check transactions
    if (event.transaction?.includes('/health') || 
        event.transaction?.includes('/api/health')) {
      return null;
    }
    
    return event;
  },
});