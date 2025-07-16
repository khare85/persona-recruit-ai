import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Configure the scope for edge runtime
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry] Edge event would be sent:', event);
      return null;
    }
    
    // Add edge-specific context
    event.tags = {
      ...event.tags,
      runtime: 'edge',
      environment: process.env.NODE_ENV,
    };
    
    return event;
  },
  
  // Additional configuration for edge runtime
  release: process.env.npm_package_version,
  maxBreadcrumbs: 50,
  attachStacktrace: true,
  
  // Ignore specific errors common in edge runtime
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'Non-Error exception captured',
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
});