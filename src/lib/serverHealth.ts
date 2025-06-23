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
    // Database connectivity check
    this.addHealthCheck({
      name: 'database',
      critical: true,
      check: async () => {
        try {
          if (!db) return false;
          
          // Try to read a system collection
          const healthRef = db.collection('_health').doc('check');
          await healthRef.get();
          return true;
        } catch (error) {
          dbLogger.error('Database health check failed', { error });
          return false;
        }
      }
    });

    // Memory usage check
    this.addHealthCheck({
      name: 'memory',
      critical: false,
      check: async () => {
        const usage = process.memoryUsage();
        const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
        
        if (heapUsedPercent > 90) {
          dbLogger.warn('High memory usage detected', { heapUsedPercent });
          // Trigger garbage collection if available
          if (global.gc) {
            global.gc();
            dbLogger.info('Triggered garbage collection');
          }
          return false;
        }
        return true;
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

  startMonitoring(intervalMs: number = 30000) {
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