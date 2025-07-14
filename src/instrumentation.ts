/**
 * Next.js instrumentation file
 * This runs once when the server starts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { loadSecrets } = await import('./lib/secrets');
    await loadSecrets(); // Load secrets at startup

    // Initialize core services on startup
    const { initializeApp } = await import('@/lib/appInit');
    await initializeApp();
  }
}
