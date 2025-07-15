/**
 * AI Rate Limiter
 * Intelligent rate limiting for AI service calls with priority queuing
 */

interface RateLimit {
  requests: number;
  windowStart: number;
  windowSize: number;
  maxRequests: number;
  isLimited: () => boolean;
  waitForAvailability: () => Promise<void>;
}

interface QueuedRequest {
  id: string;
  priority: 'high' | 'medium' | 'low';
  service: string;
  operation: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  createdAt: number;
}

export class AIRateLimiter {
  private rateLimits = new Map<string, RateLimit>();
  private requestQueue: QueuedRequest[] = [];
  private activeRequests = new Map<string, number>();
  private processingQueue = false;
  private batchQueues = new Map<string, any[]>();

  constructor() {
    this.initializeRateLimits();
    this.startQueueProcessor();
  }

  /**
   * Initialize rate limits for different AI services
   */
  private initializeRateLimits(): void {
    // Google AI services
    this.rateLimits.set('gemini', {
      requests: 0,
      windowStart: Date.now(),
      windowSize: 60000, // 1 minute
      maxRequests: 60, // 60 requests per minute
      isLimited: () => this.isServiceLimited('gemini'),
      waitForAvailability: () => this.waitForService('gemini')
    });

    this.rateLimits.set('documentai', {
      requests: 0,
      windowStart: Date.now(),
      windowSize: 60000, // 1 minute
      maxRequests: 120, // 120 requests per minute
      isLimited: () => this.isServiceLimited('documentai'),
      waitForAvailability: () => this.waitForService('documentai')
    });

    this.rateLimits.set('embeddings', {
      requests: 0,
      windowStart: Date.now(),
      windowSize: 60000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      isLimited: () => this.isServiceLimited('embeddings'),
      waitForAvailability: () => this.waitForService('embeddings')
    });

    this.rateLimits.set('elevenlabs', {
      requests: 0,
      windowStart: Date.now(),
      windowSize: 60000, // 1 minute
      maxRequests: 50, // 50 requests per minute
      isLimited: () => this.isServiceLimited('elevenlabs'),
      waitForAvailability: () => this.waitForService('elevenlabs')
    });

    this.rateLimits.set('video', {
      requests: 0,
      windowStart: Date.now(),
      windowSize: 300000, // 5 minutes
      maxRequests: 10, // 10 video analyses per 5 minutes
      isLimited: () => this.isServiceLimited('video'),
      waitForAvailability: () => this.waitForService('video')
    });

    this.rateLimits.set('bias', {
      requests: 0,
      windowStart: Date.now(),
      windowSize: 60000, // 1 minute
      maxRequests: 30, // 30 requests per minute
      isLimited: () => this.isServiceLimited('bias'),
      waitForAvailability: () => this.waitForService('bias')
    });

    this.rateLimits.set('matching', {
      requests: 0,
      windowStart: Date.now(),
      windowSize: 60000, // 1 minute
      maxRequests: 200, // 200 requests per minute
      isLimited: () => this.isServiceLimited('matching'),
      waitForAvailability: () => this.waitForService('matching')
    });
  }

  /**
   * Call AI service with rate limiting and priority queuing
   */
  async callAIService<T>(
    service: string,
    operation: () => Promise<T>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    const requestId = `${service}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: requestId,
        priority,
        service,
        operation,
        resolve,
        reject,
        createdAt: Date.now()
      };

      this.requestQueue.push(queuedRequest);
      this.sortQueue();
      this.processQueue();
    });
  }

  /**
   * Batch requests for efficiency
   */
  async batchRequest<T>(
    service: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const batchKey = `batch-${service}`;
    
    if (!this.batchQueues.has(batchKey)) {
      this.batchQueues.set(batchKey, []);
      
      // Process batch after short delay
      setTimeout(() => {
        this.processBatch(batchKey);
      }, 100);
    }

    return new Promise((resolve, reject) => {
      this.batchQueues.get(batchKey)!.push({ operation, resolve, reject });
    });
  }

  /**
   * Process batched requests
   */
  private async processBatch(batchKey: string): Promise<void> {
    const batch = this.batchQueues.get(batchKey);
    if (!batch || batch.length === 0) return;

    this.batchQueues.delete(batchKey);

    try {
      const results = await Promise.all(
        batch.map(item => item.operation())
      );

      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }

  /**
   * Sort queue by priority and creation time
   */
  private sortQueue(): void {
    this.requestQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      this.processQueue();
    }, 100);
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.requestQueue.length === 0) return;

    this.processingQueue = true;

    try {
      const processedRequests: string[] = [];

      for (const request of this.requestQueue) {
        if (this.canProcessRequest(request.service)) {
          try {
            this.recordRequest(request.service);
            const result = await request.operation();
            request.resolve(result);
            processedRequests.push(request.id);
          } catch (error) {
            request.reject(error);
            processedRequests.push(request.id);
          }
        } else {
          // Stop processing if we hit rate limits
          break;
        }
      }

      // Remove processed requests
      this.requestQueue = this.requestQueue.filter(
        req => !processedRequests.includes(req.id)
      );

    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Check if request can be processed
   */
  private canProcessRequest(service: string): boolean {
    const limit = this.rateLimits.get(service);
    if (!limit) return true;

    this.resetWindowIfNeeded(service);
    return limit.requests < limit.maxRequests;
  }

  /**
   * Record a request for rate limiting
   */
  private recordRequest(service: string): void {
    const limit = this.rateLimits.get(service);
    if (!limit) return;

    this.resetWindowIfNeeded(service);
    limit.requests++;

    // Track active requests
    const active = this.activeRequests.get(service) || 0;
    this.activeRequests.set(service, active + 1);

    // Remove from active requests after completion
    setTimeout(() => {
      const current = this.activeRequests.get(service) || 0;
      this.activeRequests.set(service, Math.max(0, current - 1));
    }, 1000);
  }

  /**
   * Reset rate limit window if needed
   */
  private resetWindowIfNeeded(service: string): void {
    const limit = this.rateLimits.get(service);
    if (!limit) return;

    const now = Date.now();
    if (now - limit.windowStart >= limit.windowSize) {
      limit.requests = 0;
      limit.windowStart = now;
    }
  }

  /**
   * Check if service is rate limited
   */
  private isServiceLimited(service: string): boolean {
    const limit = this.rateLimits.get(service);
    if (!limit) return false;

    this.resetWindowIfNeeded(service);
    return limit.requests >= limit.maxRequests;
  }

  /**
   * Wait for service availability
   */
  private waitForService(service: string): Promise<void> {
    return new Promise((resolve) => {
      const checkAvailability = () => {
        if (!this.isServiceLimited(service)) {
          resolve();
        } else {
          setTimeout(checkAvailability, 1000);
        }
      };
      checkAvailability();
    });
  }

  /**
   * Get rate limiting status
   */
  getStatus(): any {
    const status: any = {};

    for (const [service, limit] of this.rateLimits.entries()) {
      this.resetWindowIfNeeded(service);
      const remaining = limit.maxRequests - limit.requests;
      const resetTime = limit.windowStart + limit.windowSize;

      status[service] = {
        requests: limit.requests,
        maxRequests: limit.maxRequests,
        remaining,
        resetTime,
        isLimited: limit.requests >= limit.maxRequests,
        activeRequests: this.activeRequests.get(service) || 0
      };
    }

    status.queueSize = this.requestQueue.length;
    status.queueByPriority = {
      high: this.requestQueue.filter(r => r.priority === 'high').length,
      medium: this.requestQueue.filter(r => r.priority === 'medium').length,
      low: this.requestQueue.filter(r => r.priority === 'low').length
    };

    return status;
  }

  /**
   * Get active jobs count
   */
  getActiveJobs(): number {
    return Array.from(this.activeRequests.values()).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Clear all rate limits (for testing)
   */
  clearLimits(): void {
    for (const limit of this.rateLimits.values()) {
      limit.requests = 0;
      limit.windowStart = Date.now();
    }
    this.activeRequests.clear();
  }

  /**
   * Get service statistics
   */
  getServiceStats(): any {
    const stats: any = {};

    for (const [service, limit] of this.rateLimits.entries()) {
      const utilization = (limit.requests / limit.maxRequests) * 100;
      
      stats[service] = {
        requestsInWindow: limit.requests,
        maxRequests: limit.maxRequests,
        utilization: utilization.toFixed(2),
        activeRequests: this.activeRequests.get(service) || 0,
        windowSizeMs: limit.windowSize,
        timeToReset: Math.max(0, (limit.windowStart + limit.windowSize) - Date.now())
      };
    }

    return stats;
  }
}

// Singleton instance
export const aiRateLimiter = new AIRateLimiter();