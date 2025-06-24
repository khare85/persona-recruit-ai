/**
 * Next.js instrumentation file
 * This runs once when the server starts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only initialize in production to prevent memory issues in development
    if (process.env.NODE_ENV === 'production') {
      const { initializeApp } = await import('@/lib/appInit');
      await initializeApp();
    }
  }
}