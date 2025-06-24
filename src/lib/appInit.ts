/**
 * Application initialization and startup tasks
 */

import { healthMonitor } from '@/lib/serverHealth';
import { startCacheCleanup } from '@/lib/cache';
import { dbLogger } from '@/lib/logger';

let initialized = false;

export async function initializeApp() {
  if (initialized) {
    return;
  }

  try {
    const isDev = process.env.NODE_ENV === 'development';
    dbLogger.info('Initializing application...', { isDev });

    // Only start monitoring in production to prevent memory issues in dev
    if (!isDev) {
      healthMonitor.startMonitoring(60000); // 1 minute in prod
      dbLogger.info('Health monitoring started');
      
      // Start cache cleanup in production
      startCacheCleanup();
      dbLogger.info('Cache cleanup active');
      
      // Run initial health check
      const initialHealth = await healthMonitor.runHealthChecks();
      dbLogger.info('Initial health check', { results: initialHealth });
    } else {
      dbLogger.info('Development mode: skipping health monitoring and cache cleanup');
    }

    initialized = true;
    dbLogger.info('Application initialization complete');
  } catch (error) {
    dbLogger.error('Application initialization failed', { error });
    throw error;
  }
}

// Initialize on module load
if (process.env.NODE_ENV === 'production') {
  initializeApp().catch((error) => {
    console.error('Failed to initialize app:', error);
  });
}