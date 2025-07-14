/**
 * Server health monitoring and recovery system
 */

import { db } from '@/services/firestoreService';
import { dbLogger } from '@/lib/logger';

interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
}

class ServerHealthMonitor {
  private healthChecks: HealthCheck[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthy = true;
  private lastHealthCheck: Date | null = null;
  private failedChecks: Set<string> = new Set();

  constructor() {
    this.registerDefaultChecks();
  }

  private registerDefaultChecks() {
    // Database connectivity check (less critical in development)
    this.addHealthCheck({
      name: 'database',
      critical: process.env.NODE_ENV === 'production',
      check: async () => {
        try {
          if (!db) {
            // In development, DB might not be configured - don't fail hard
            if (process.env.NODE_ENV === 'development') {
              return true;
            }
            return false;
          }
          
          // Try to read a system collection with timeout
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Database check timeout')), 5000);
          });
          
          const checkPromise = (async () => {
            const healthRef = db.collection('_health').doc('check');
            await healthRef.get();
            return true;
          })();
          
          return await Promise.race([checkPromise, timeoutPromise]);
        } catch (error) {
          dbLogger.warn('Database health check failed', { error: error.message });
          // In development, log but don't fail
          return process.env.NODE_ENV === 'development';
        }
      }
    });

    // Enhanced memory usage check with cache pressure monitoring
    this.addHealthCheck({
      name: 'memory',
      critical: false,
      check: async () => {
        const usage = process.memoryUsage();
        const isDev = process.env.NODE_ENV === 'development';
        
        // Calculate memory usage percentage more accurately
        const availableMemory = parseInt(process.env.MEMORY_LIMIT || '2147483648'); // 2GB default
        const memoryPercent = (usage.rss / availableMemory) * 100;
        const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
        
        // Determine thresholds
        const warningThreshold = isDev ? 85 : 75;
        const criticalThreshold = isDev ? 95 : 85;
        
        if (memoryPercent > criticalThreshold) {
          dbLogger.error('CRITICAL memory usage detected', { 
            memoryPercent: memoryPercent.toFixed(1),
            heapUsedPercent: heapUsedPercent.toFixed(1),
            rss: Math.round(usage.rss / 1024 / 1024),
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
            external: Math.round(usage.external / 1024 / 1024),
            arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024),
            isDev
          });
          
          // Trigger aggressive cleanup
          try {
            const { performMemoryPressureCleanup } = await import('@/lib/cache');
            performMemoryPressureCleanup();
            dbLogger.info('Triggered memory pressure cleanup');
          } catch (error) {
            dbLogger.error('Failed to trigger memory cleanup', { error });
          }
          
          // Trigger garbage collection
          if (global.gc) {
            global.gc();
            dbLogger.info('Triggered garbage collection');
          }
          
          // Fail the health check if memory is still critically high
          return memoryPercent < 90;
        } else if (memoryPercent > warningThreshold) {
          dbLogger.warn('High memory usage detected', { 
            memoryPercent: memoryPercent.toFixed(1),
            heapUsedPercent: heapUsedPercent.toFixed(1),
            rss: Math.round(usage.rss / 1024 / 1024),
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
            isDev
          });
          
          // Trigger moderate cleanup
          try {
            const { performMemoryPressureCleanup } = await import('@/lib/cache');
            performMemoryPressureCleanup();
          } catch (error) {
            dbLogger.error('Failed to trigger memory cleanup', { error });
          }
        }
        
        return true; // Memory warning is non-critical
      }
    });

    // Event loop lag check
    this.addHealthCheck({
      name: 'eventLoop',
      critical: false,
      check: async () => {
        const start = Date.now();
        
        return new Promise<boolean>((resolve) => {
          setImmediate(() => {
            const lag = Date.now() - start;
            if (lag > 100) {
              dbLogger.warn('High event loop lag detected', { lag });
              resolve(false);
            } else {
              resolve(true);
            }
          });
        });
      }
    });
  }

  addHealthCheck(check: HealthCheck) {
    this.healthChecks.push(check);
  }

  async runHealthChecks(): Promise<{
    healthy: boolean;
    checks: Record<string, boolean>;
    timestamp: Date;
  }> {
    const results: Record<string, boolean> = {};
    let allHealthy = true;

    for (const check of this.healthChecks) {
      try {
        const isHealthy = await check.check();
        results[check.name] = isHealthy;
        
        if (!isHealthy) {
          this.failedChecks.add(check.name);
          if (check.critical) {
            allHealthy = false;
          }
        } else {
          this.failedChecks.delete(check.name);
        }
      } catch (error) {
        dbLogger.error(`Health check failed: ${check.name}`, { error });
        results[check.name] = false;
        this.failedChecks.add(check.name);
        
        if (check.critical) {
          allHealthy = false;
        }
      }
    }

    this.isHealthy = allHealthy;
    this.lastHealthCheck = new Date();

    return {
      healthy: allHealthy,
      checks: results,
      timestamp: this.lastHealthCheck
    };
  }

  startMonitoring(intervalMs: number = 60000) {
    if (this.healthCheckInterval) {
      this.stopMonitoring();
    }

    // Run initial check
    this.runHealthChecks();

    this.healthCheckInterval = setInterval(async () => {
      const results = await this.runHealthChecks();
      
      if (!results.healthy) {
        dbLogger.error('Server health check failed', { 
          results,
          failedChecks: Array.from(this.failedChecks)
        });
        
        // Attempt recovery for critical services
        if (this.failedChecks.has('database')) {
          await this.attemptDatabaseRecovery();
        }
      }
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  async attemptDatabaseRecovery() {
    dbLogger.info('Attempting database connection recovery...');
    
    try {
      // Force Firebase to reinitialize by clearing and reimporting
      const { reloadFirebaseConnection } = await import('@/services/firestoreService');
      
      if (typeof reloadFirebaseConnection === 'function') {
        await reloadFirebaseConnection();
        dbLogger.info('Database connection recovery attempted');
      }
    } catch (error) {
      dbLogger.error('Database recovery failed', { error });
    }
  }

  getStatus() {
    return {
      healthy: this.isHealthy,
      lastCheck: this.lastHealthCheck,
      failedChecks: Array.from(this.failedChecks)
    };
  }
}

// Singleton instance
export const healthMonitor = new ServerHealthMonitor();

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  dbLogger.info(`Received ${signal}, starting graceful shutdown...`);
  
  // Stop health monitoring
  healthMonitor.stopMonitoring();
  
  // Stop cache cleanup
  const { stopCacheCleanup } = await import('@/lib/cache');
  stopCacheCleanup();
  
  // Give pending requests time to complete
  setTimeout(() => {
    dbLogger.info('Graceful shutdown complete');
    process.exit(0);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  dbLogger.error('Uncaught exception', { error });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  dbLogger.error('Unhandled rejection', { reason, promise });
});