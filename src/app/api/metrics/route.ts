import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withRole } from '@/middleware/auth';
import { apiLogger } from '@/lib/logger';

interface SystemMetrics {
  timestamp: string;
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: {
      usage: number;
      loadAverage: number[];
    };
  };
  application: {
    totalRequests: number;
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    activeConnections: number;
  };
  business: {
    totalUsers: number;
    activeCandidates: number;
    activeJobs: number;
    totalApplications: number;
    completedInterviews: number;
  };
  performance: {
    cacheHitRate: number;
    databaseResponseTime: number;
    apiResponseTime: number;
  };
}

// Simple metrics store (use Redis or dedicated metrics DB in production)
class MetricsCollector {
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private lastReset = Date.now();

  incrementRequest(): void {
    this.requestCount++;
  }

  incrementError(): void {
    this.errorCount++;
  }

  addResponseTime(time: number): void {
    this.responseTimes.push(time);
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  getStats() {
    const now = Date.now();
    const timeElapsed = (now - this.lastReset) / 1000 / 60; // minutes
    
    return {
      totalRequests: this.requestCount,
      requestsPerMinute: timeElapsed > 0 ? this.requestCount / timeElapsed : 0,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      averageResponseTime: this.responseTimes.length > 0 
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
        : 0
    };
  }

  reset(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.lastReset = Date.now();
  }
}

const metricsCollector = new MetricsCollector();

/**
 * Metrics endpoint for monitoring dashboards
 * Requires admin role for access
 */
export const GET = withRole(['admin'], async (req: NextRequest): Promise<NextResponse> => {
  try {
    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: {
          usage: getCPUUsage(),
          loadAverage: getLoadAverage()
        }
      },
      application: {
        ...metricsCollector.getStats(),
        activeConnections: getActiveConnections()
      },
      business: await getBusinessMetrics(),
      performance: await getPerformanceMetrics()
    };

    return NextResponse.json(metrics);
  } catch (error) {
    apiLogger.error('Failed to collect metrics', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
});

/**
 * Reset metrics (for testing/debugging)
 */
export const POST = withRole(['admin'], async (req: NextRequest): Promise<NextResponse> => {
  try {
    metricsCollector.reset();
    return NextResponse.json({ message: 'Metrics reset successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reset metrics' },
      { status: 500 }
    );
  }
});

/**
 * Get CPU usage (simplified)
 */
function getCPUUsage(): number {
  // This is a simplified CPU usage calculation
  // In production, you might want to use a more sophisticated method
  const startUsage = process.cpuUsage();
  const hrTime = process.hrtime();
  
  // Simple calculation based on process CPU time
  return (startUsage.user + startUsage.system) / 1000000; // Convert to milliseconds
}

/**
 * Get system load average
 */
function getLoadAverage(): number[] {
  try {
    const os = require('os');
    return os.loadavg();
  } catch {
    return [0, 0, 0]; // Fallback for environments without os module
  }
}

/**
 * Get active connections (placeholder)
 */
function getActiveConnections(): number {
  // This would be implemented based on your WebSocket or connection tracking
  return 0;
}

/**
 * Get business metrics from database
 */
async function getBusinessMetrics() {
  try {
    // These would be real database queries in production
    return {
      totalUsers: 150, // Mock data
      activeCandidates: 89,
      activeJobs: 45,
      totalApplications: 234,
      completedInterviews: 67
    };
  } catch (error) {
    apiLogger.error('Failed to get business metrics', { error: String(error) });
    return {
      totalUsers: 0,
      activeCandidates: 0,
      activeJobs: 0,
      totalApplications: 0,
      completedInterviews: 0
    };
  }
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics() {
  try {
    // These would be calculated from actual cache and database statistics
    return {
      cacheHitRate: 85.5, // percentage
      databaseResponseTime: 45.2, // milliseconds
      apiResponseTime: 120.8 // milliseconds
    };
  } catch (error) {
    apiLogger.error('Failed to get performance metrics', { error: String(error) });
    return {
      cacheHitRate: 0,
      databaseResponseTime: 0,
      apiResponseTime: 0
    };
  }
}

/**
 * Middleware to track requests and response times
 */
export function trackMetrics(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const startTime = Date.now();
    metricsCollector.incrementRequest();

    try {
      const response = await handler(req, ...args);
      const responseTime = Date.now() - startTime;
      metricsCollector.addResponseTime(responseTime);

      // Add performance headers
      response.headers.set('X-Response-Time', `${responseTime}ms`);
      
      return response;
    } catch (error) {
      metricsCollector.incrementError();
      const responseTime = Date.now() - startTime;
      metricsCollector.addResponseTime(responseTime);
      throw error;
    }
  };
}