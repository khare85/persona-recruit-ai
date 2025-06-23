/**
 * Next.js instrumentation file
 * This runs once when the server starts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side initialization
    const { initializeApp } = await import('@/lib/appInit');
    await initializeApp();
  }
}