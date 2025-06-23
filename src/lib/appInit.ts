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
    dbLogger.info('Initializing application...');

    // Start health monitoring
    healthMonitor.startMonitoring(30000); // Check every 30 seconds
    dbLogger.info('Health monitoring started');

    // Cache cleanup is already started in cache.ts
    dbLogger.info('Cache cleanup active');

    // Run initial health check
    const initialHealth = await healthMonitor.runHealthChecks();
    dbLogger.info('Initial health check', { results: initialHealth });

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