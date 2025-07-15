/**
 * AI Memory Manager
 * Intelligent memory management for AI processing operations
 */

export class AIMemoryManager {
  private readonly maxMemoryUsage = 1024 * 1024 * 1024; // 1GB
  private readonly optimalMemoryUsage = 1024 * 1024 * 512; // 512MB
  private processedItems = new WeakMap();
  private activeProcesses = new Set<string>();
  private memoryUsageHistory: number[] = [];

  constructor() {
    // Monitor memory usage every 30 seconds
    setInterval(() => this.monitorMemory(), 30000);
  }

  /**
   * Process items with memory limit awareness
   */
  async processWithMemoryLimit<T>(
    items: T[],
    processor: (item: T) => Promise<any>,
    options: {
      maxConcurrency?: number;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): Promise<any[]> {
    const { maxConcurrency = 5, priority = 'medium' } = options;
    const batchSize = this.calculateOptimalBatchSize(items, maxConcurrency);
    const results: any[] = [];

    console.log(`AI Memory Manager: Processing ${items.length} items in batches of ${batchSize}`);

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchId = `batch-${i / batchSize}`;
      
      this.activeProcesses.add(batchId);

      try {
        // Check memory before processing batch
        await this.ensureMemoryAvailable(priority);

        const batchResults = await Promise.all(
          batch.map(async (item, index) => {
            const itemId = `${batchId}-${index}`;
            try {
              const result = await processor(item);
              this.processedItems.set(item, result);
              return result;
            } catch (error) {
              console.error(`AI Memory Manager: Error processing item ${itemId}:`, error);
              return null;
            }
          })
        );

        results.push(...batchResults);

        // Force garbage collection after each batch if memory is high
        if (this.getMemoryUsage() > this.optimalMemoryUsage) {
          this.forceGarbageCollection();
        }

      } finally {
        this.activeProcesses.delete(batchId);
      }

      // Add small delay between batches to prevent overwhelming the system
      if (i + batchSize < items.length) {
        await this.delay(100);
      }
    }

    return results;
  }

  /**
   * Process single item with memory management
   */
  async processItemWithMemoryGuard<T>(
    item: T,
    processor: (item: T) => Promise<any>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<any> {
    await this.ensureMemoryAvailable(priority);
    
    const itemId = `item-${Date.now()}`;
    this.activeProcesses.add(itemId);

    try {
      const result = await processor(item);
      this.processedItems.set(item, result);
      return result;
    } finally {
      this.activeProcesses.delete(itemId);
      
      // Check if we should run garbage collection
      if (this.getMemoryUsage() > this.optimalMemoryUsage) {
        this.forceGarbageCollection();
      }
    }
  }

  /**
   * Ensure memory is available for processing
   */
  private async ensureMemoryAvailable(priority: 'high' | 'medium' | 'low'): Promise<void> {
    const currentUsage = this.getMemoryUsage();
    const usagePercent = (currentUsage / this.maxMemoryUsage) * 100;

    if (usagePercent > 90) {
      console.warn(`AI Memory Manager: Critical memory usage (${usagePercent.toFixed(1)}%)`);
      
      // Force garbage collection
      this.forceGarbageCollection();
      
      // Wait a bit for GC to complete
      await this.delay(1000);
      
      // If still high, wait longer for lower priority tasks
      const newUsage = this.getMemoryUsage();
      const newPercent = (newUsage / this.maxMemoryUsage) * 100;
      
      if (newPercent > 85) {
        if (priority === 'low') {
          await this.delay(5000);
        } else if (priority === 'medium') {
          await this.delay(2000);
        }
      }
    } else if (usagePercent > 75) {
      console.log(`AI Memory Manager: High memory usage (${usagePercent.toFixed(1)}%)`);
      
      // Small delay for lower priority tasks
      if (priority === 'low') {
        await this.delay(1000);
      }
    }
  }

  /**
   * Calculate optimal batch size based on available memory
   */
  private calculateOptimalBatchSize(items: any[], maxConcurrency: number): number {
    const currentUsage = this.getMemoryUsage();
    const availableMemory = this.maxMemoryUsage - currentUsage;
    const usagePercent = (currentUsage / this.maxMemoryUsage) * 100;

    // Adjust batch size based on memory usage
    let batchSize = maxConcurrency;

    if (usagePercent > 80) {
      batchSize = Math.max(1, Math.floor(maxConcurrency * 0.5));
    } else if (usagePercent > 60) {
      batchSize = Math.max(2, Math.floor(maxConcurrency * 0.75));
    }

    // Don't exceed total items
    return Math.min(batchSize, items.length);
  }

  /**
   * Force garbage collection with fallback
   */
  private forceGarbageCollection(): void {
    try {
      if (global.gc) {
        global.gc();
        console.log('AI Memory Manager: Forced garbage collection');
      } else {
        // Fallback: create memory pressure to trigger GC
        const dummy = new Array(1000000).fill('gc-trigger');
        dummy.length = 0;
      }
    } catch (error) {
      console.error('AI Memory Manager: Error during garbage collection:', error);
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return usage.heapUsed;
  }

  /**
   * Get memory usage statistics
   */
  getUsage(): any {
    const usage = process.memoryUsage();
    const usagePercent = (usage.heapUsed / this.maxMemoryUsage) * 100;

    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      maxMemoryUsage: this.maxMemoryUsage,
      usagePercent: usagePercent.toFixed(2),
      activeProcesses: this.activeProcesses.size,
      isMemoryHigh: usagePercent > 75,
      isCritical: usagePercent > 90
    };
  }

  /**
   * Monitor memory usage and take action if needed
   */
  private monitorMemory(): void {
    const usage = this.getMemoryUsage();
    const usagePercent = (usage / this.maxMemoryUsage) * 100;

    // Store usage history for trend analysis
    this.memoryUsageHistory.push(usagePercent);
    if (this.memoryUsageHistory.length > 60) { // Keep last 60 readings (30 minutes)
      this.memoryUsageHistory.shift();
    }

    // Check for memory trends
    if (this.memoryUsageHistory.length > 10) {
      const recent = this.memoryUsageHistory.slice(-10);
      const trend = this.calculateTrend(recent);
      
      if (trend > 5 && usagePercent > 70) {
        console.warn(`AI Memory Manager: Memory usage trending upward (${trend.toFixed(1)}%/min)`);
        this.forceGarbageCollection();
      }
    }

    // Critical memory handling
    if (usagePercent > 95) {
      console.error(`AI Memory Manager: Critical memory usage (${usagePercent.toFixed(1)}%)`);
      this.forceGarbageCollection();
    }
  }

  /**
   * Calculate memory usage trend
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    const timeSpan = values.length * 0.5; // 0.5 minutes per reading
    
    return (last - first) / timeSpan;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.activeProcesses.clear();
    this.memoryUsageHistory = [];
    this.forceGarbageCollection();
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): any {
    const memoryUsage = this.getUsage();
    const avgMemoryUsage = this.memoryUsageHistory.length > 0 
      ? this.memoryUsageHistory.reduce((a, b) => a + b, 0) / this.memoryUsageHistory.length
      : 0;

    return {
      activeProcesses: this.activeProcesses.size,
      memoryUsage,
      avgMemoryUsage: avgMemoryUsage.toFixed(2),
      memoryTrend: this.calculateTrend(this.memoryUsageHistory.slice(-10)),
      maxMemoryUsage: this.maxMemoryUsage,
      optimalMemoryUsage: this.optimalMemoryUsage
    };
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const aiMemoryManager = new AIMemoryManager();