/**
 * AI Cache Service
 * Intelligent caching for AI operations with memory management
 */

import { createHash } from 'crypto';

interface CacheItem {
  value: any;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

export class AICache {
  private cache = new Map<string, CacheItem>();
  private readonly maxMemoryUsage = 512 * 1024 * 1024; // 512MB
  private readonly maxItemSize = 50 * 1024 * 1024; // 50MB per item
  private hitCount = 0;
  private missCount = 0;

  constructor() {
    // Clean up expired items every 5 minutes
    setInterval(() => this.cleanup(), 300000);
    
    // Monitor memory usage every minute
    setInterval(() => this.monitorMemory(), 60000);
  }

  /**
   * Get cached value or return null if not found/expired
   */
  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    
    if (!item) {
      this.missCount++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();
    
    this.hitCount++;
    return item.value;
  }

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const serializedValue = JSON.stringify(value);
    const size = Buffer.byteLength(serializedValue, 'utf8');

    // Don't cache items that are too large
    if (size > this.maxItemSize) {
      console.warn(`AI Cache: Item too large to cache (${size} bytes): ${key}`);
      return;
    }

    const expiresAt = Date.now() + (ttlSeconds * 1000);
    const item: CacheItem = {
      value,
      expiresAt,
      accessCount: 0,
      lastAccessed: Date.now(),
      size
    };

    this.cache.set(key, item);
    
    // Check if we need to free memory
    if (this.getCurrentMemoryUsage() > this.maxMemoryUsage) {
      this.freeMemory();
    }
  }

  /**
   * Get or set pattern - get cached value or compute and cache it
   */
  async getOrSet<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const computed = await computeFn();
    await this.set(key, computed, ttlSeconds);
    return computed;
  }

  /**
   * Cache embeddings with special handling
   */
  async cacheEmbedding(text: string, embedding: number[]): Promise<void> {
    const key = `embedding:${this.hashText(text)}`;
    await this.set(key, embedding, 86400); // 24 hours for embeddings
  }

  /**
   * Get cached embedding
   */
  async getCachedEmbedding(text: string): Promise<number[] | null> {
    const key = `embedding:${this.hashText(text)}`;
    return this.get(key);
  }

  /**
   * Cache AI analysis results
   */
  async cacheAnalysis(contentHash: string, analysis: any, type: string): Promise<void> {
    const key = `analysis:${type}:${contentHash}`;
    await this.set(key, analysis, 86400); // 24 hours
  }

  /**
   * Get cached analysis
   */
  async getCachedAnalysis(contentHash: string, type: string): Promise<any> {
    const key = `analysis:${type}:${contentHash}`;
    return this.get(key);
  }

  /**
   * Cache job matches
   */
  async cacheJobMatches(profileId: string, matches: any[]): Promise<void> {
    const key = `matches:${profileId}`;
    await this.set(key, matches, 1800); // 30 minutes for matches
  }

  /**
   * Get cached job matches
   */
  async getCachedJobMatches(profileId: string): Promise<any[] | null> {
    const key = `matches:${profileId}`;
    return this.get(key);
  }

  /**
   * Clear specific cache entries
   */
  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): any {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      hitRate: hitRate.toFixed(2),
      hitCount: this.hitCount,
      missCount: this.missCount,
      memoryUsage: this.getCurrentMemoryUsage(),
      maxMemoryUsage: this.maxMemoryUsage
    };
  }

  /**
   * Get hit rate for monitoring
   */
  getHitRate(): number {
    const totalRequests = this.hitCount + this.missCount;
    return totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;
  }

  /**
   * Clean up expired items
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`AI Cache: Cleaned up ${expiredKeys.length} expired items`);
    }
  }

  /**
   * Monitor memory usage and free memory if needed
   */
  private monitorMemory(): void {
    const currentUsage = this.getCurrentMemoryUsage();
    const usagePercent = (currentUsage / this.maxMemoryUsage) * 100;

    if (usagePercent > 80) {
      console.warn(`AI Cache: High memory usage (${usagePercent.toFixed(1)}%)`);
      this.freeMemory();
    }
  }

  /**
   * Free memory by removing least recently used items
   */
  private freeMemory(): void {
    const items = Array.from(this.cache.entries())
      .map(([key, item]) => ({ key, ...item }))
      .sort((a, b) => {
        // Sort by access count (ascending) and last accessed (ascending)
        const accessWeight = a.accessCount - b.accessCount;
        const timeWeight = a.lastAccessed - b.lastAccessed;
        return accessWeight || timeWeight;
      });

    // Remove 25% of least used items
    const itemsToRemove = Math.ceil(items.length * 0.25);
    
    for (let i = 0; i < itemsToRemove && i < items.length; i++) {
      this.cache.delete(items[i].key);
    }

    console.log(`AI Cache: Freed memory by removing ${itemsToRemove} items`);
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    let totalSize = 0;
    for (const item of this.cache.values()) {
      totalSize += item.size;
    }
    return totalSize;
  }

  /**
   * Hash text for consistent cache keys
   */
  private hashText(text: string): string {
    return createHash('md5').update(text).digest('hex');
  }
}

// Singleton instance
export const aiCache = new AICache();