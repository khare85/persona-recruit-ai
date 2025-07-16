import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
  // Configure the scope to include user information
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry] Event would be sent:', event);
      return null;
    }
    
    // Filter out noisy errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Skip network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return null;
      }
      
      // Skip cancelled requests
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
    }
    
    return event;
  },
  
  // Configure integrations
  integrations: [
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: 'light',
    }),
    Sentry.replayIntegration({
      // Mask all text content, but not inputs
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Performance Monitoring
  profilesSampleRate: 1.0,
  
  // Additional configuration
  release: process.env.npm_package_version,
  maxBreadcrumbs: 50,
  attachStacktrace: true,
  
  // Ignore specific errors
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'Non-Error exception captured',
    'ChunkLoadError',
    'Loading chunk',
    'Importing a module',
    'ResizeObserver loop limit exceeded',
    'Script error.',
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    'AbortError',
    'The request was aborted',
    'cancelled',
    'timeout',
    'Auth token refresh failed',
    'Firebase: Error (auth/popup-closed-by-user)',
    'Firebase: Error (auth/cancelled-popup-request)',
    'Firebase: Error (auth/popup-blocked)',
  ],
  
  // Ignore specific URLs
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i,
  ],
});