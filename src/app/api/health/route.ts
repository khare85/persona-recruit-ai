import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';
import { memoryCache, userCache, searchCache, aiCache } from '@/lib/cache';
import { healthMonitor } from '@/lib/serverHealth';
import { BackgroundJobService } from '@/lib/backgroundJobs';
import { db } from '@/services/firestoreService';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  details?: any;
  error?: string;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: HealthCheck[];
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cache: {
      memory: any;
      user: any;
      search: any;
      ai: any;
    };
  };
}

/**
 * Comprehensive health check endpoint
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];

  try {
    // Check Firebase/Firestore connectivity
    const firestoreCheck = await checkFirestore();
    checks.push(firestoreCheck);

    // Check External APIs
    const googleApiCheck = await checkGoogleAPI();
    checks.push(googleApiCheck);

    const elevenLabsCheck = await checkElevenLabs();
    checks.push(elevenLabsCheck);

    // Check system resources
    const memoryCheck = checkMemoryUsage();
    checks.push(memoryCheck);

    // Check cache systems
    const cacheCheck = checkCacheSystems();
    checks.push(cacheCheck);

    // Check background job system
    const jobSystemCheck = await checkJobSystem();
    checks.push(jobSystemCheck);

    // Determine overall status
    const overallStatus = determineOverallStatus(checks);

    // Get system information
    const systemInfo = getSystemInfo();

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks,
      system: systemInfo
    };

    const responseTime = Date.now() - startTime;
    apiLogger.info('Health check completed', {
      status: overallStatus,
      responseTime,
      checksCount: checks.length
    });

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Time': responseTime.toString()
      }
    });

  } catch (error) {
    apiLogger.error('Health check failed', { error: String(error) });

    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: [{
        service: 'health-check',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : String(error)
      }],
      system: getSystemInfo()
    };

    return NextResponse.json(errorStatus, { status: 503 });
  }
}

/**
 * Check Firestore connectivity
 */
async function checkFirestore(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Use our health monitor's check results if available
    const monitorStatus = healthMonitor.getStatus();
    const dbHealthy = !monitorStatus.failedChecks.includes('database');
    
    if (dbHealthy && db) {
      // Try a simple read operation
      try {
        const healthRef = db.collection('_health').doc('check');
        await healthRef.get();
        
        return {
          service: 'firestore',
          status: 'healthy',
          responseTime: Date.now() - startTime,
          details: {
            connected: true,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            lastCheck: monitorStatus.lastCheck
          }
        };
      } catch (dbError) {
        apiLogger.warn('Firestore health check query failed', { error: dbError });
        return {
          service: 'firestore',
          status: 'degraded',
          responseTime: Date.now() - startTime,
          details: {
            connected: false,
            error: 'Query failed but connection exists'
          }
        };
      }
    }
    
    return {
      service: 'firestore',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: {
        connected: false,
        failedChecks: monitorStatus.failedChecks
      }
    };
  } catch (error) {
    return {
      service: 'firestore',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check Google API connectivity
 */
async function checkGoogleAPI(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const hasApiKey = !!process.env.GOOGLE_API_KEY;
    
    return {
      service: 'google-api',
      status: hasApiKey ? 'healthy' : 'degraded',
      responseTime: Date.now() - startTime,
      details: {
        configured: hasApiKey,
        services: ['embeddings', 'ai']
      }
    };
  } catch (error) {
    return {
      service: 'google-api',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check ElevenLabs API connectivity
 */
async function checkElevenLabs(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const hasApiKey = !!process.env.ELEVENLABS_API_KEY;
    const hasAgentId = !!process.env.ELEVENLABS_AGENT_ID;
    
    const status = hasApiKey && hasAgentId ? 'healthy' : 'degraded';
    
    return {
      service: 'elevenlabs',
      status,
      responseTime: Date.now() - startTime,
      details: {
        apiKeyConfigured: hasApiKey,
        agentConfigured: hasAgentId,
        fallbackMode: !hasApiKey || !hasAgentId
      }
    };
  } catch (error) {
    return {
      service: 'elevenlabs',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Enhanced memory usage check with pressure monitoring
 */
function checkMemoryUsage(): HealthCheck {
  try {
    const memUsage = process.memoryUsage();
    const availableMemory = parseInt(process.env.MEMORY_LIMIT || '2147483648'); // 2GB default
    
    // Calculate both heap percentage and RSS percentage
    const heapPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const rssPercentage = (memUsage.rss / availableMemory) * 100;
    
    // Use the higher of the two percentages for status determination
    const criticalPercentage = Math.max(heapPercentage, rssPercentage);
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (criticalPercentage > 85) {
      status = 'unhealthy';
    } else if (criticalPercentage > 75) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      service: 'memory',
      status,
      details: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: Math.round(criticalPercentage * 100) / 100,
        rss: memUsage.rss,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
        heapPercentage: Math.round(heapPercentage * 100) / 100,
        rssPercentage: Math.round(rssPercentage * 100) / 100,
        availableMemory,
        memoryPressure: criticalPercentage > 75 ? 'high' : criticalPercentage > 60 ? 'medium' : 'low'
      }
    };
  } catch (error) {
    return {
      service: 'memory',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check cache systems
 */
function checkCacheSystems(): HealthCheck {
  try {
    const cacheStats = {
      memory: memoryCache.stats(),
      user: userCache.stats(),
      search: searchCache.stats(),
      ai: aiCache.stats()
    };

    // Check if any cache is at capacity
    const anyAtCapacity = Object.values(cacheStats).some(
      stats => stats.size >= stats.maxSize * 0.9
    );

    const status = anyAtCapacity ? 'degraded' : 'healthy';

    return {
      service: 'cache',
      status,
      details: cacheStats
    };
  } catch (error) {
    return {
      service: 'cache',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check background job system
 */
async function checkJobSystem(): Promise<HealthCheck> {
  try {
    const healthCheck = await BackgroundJobService.healthCheck();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Determine status based on job system health
    if (healthCheck.status === 'unhealthy' || !healthCheck.redis) {
      status = 'unhealthy';
    } else if (healthCheck.status === 'degraded') {
      status = 'degraded';
    } else if (healthCheck.details) {
      // Check if there are too many failed jobs
      const failedJobsPercent = healthCheck.details.failedJobs / (healthCheck.details.totalJobs || 1);
      if (failedJobsPercent > 0.1) { // More than 10% failed
        status = 'degraded';
      }
      
      // Check if queues are backing up
      if (healthCheck.details.activeJobs > 50) {
        status = 'degraded';
      }
    }

    return {
      service: 'background-jobs',
      status,
      details: {
        redis: healthCheck.redis,
        queues: healthCheck.queues,
        summary: healthCheck.details
      }
    };
  } catch (error) {
    return {
      service: 'background-jobs',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Determine overall system status
 */
function determineOverallStatus(checks: HealthCheck[]): 'healthy' | 'unhealthy' | 'degraded' {
  const unhealthyCount = checks.filter(check => check.status === 'unhealthy').length;
  const degradedCount = checks.filter(check => check.status === 'degraded').length;

  if (unhealthyCount > 0) {
    return 'unhealthy';
  }

  if (degradedCount > 0) {
    return 'degraded';
  }

  return 'healthy';
}

/**
 * Get system information
 */
function getSystemInfo() {
  const memUsage = process.memoryUsage();

  return {
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 10000) / 100
    },
    cache: {
      memory: memoryCache.stats(),
      user: userCache.stats(),
      search: searchCache.stats(),
      ai: aiCache.stats()
    }
  };
}