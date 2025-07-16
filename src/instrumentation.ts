/**
 * Next.js instrumentation file
 * This runs once when the server starts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Load Sentry configuration for Node.js runtime
    await import('../sentry.server.config');
    
    const { loadSecrets } = await import('./lib/secrets');
    await loadSecrets(); // Load secrets at startup

    // Initialize core services on startup
    const { initializeApp } = await import('@/lib/appInit');
    await initializeApp();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Load Sentry configuration for Edge runtime
    await import('../sentry.edge.config');
  }
}
