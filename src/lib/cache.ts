/**
 * Production-ready caching system with multiple storage backends
 */

export interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum number of entries
  onEvicted?: (key: string, entry: CacheEntry) => void;
}

/**
 * In-memory cache with LRU eviction
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;
  private maxSize: number;
  private defaultTTL: number;
  private onEvicted?: (key: string, entry: CacheEntry) => void;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.ttl || 3600; // 1 hour default
    this.onEvicted = options.onEvicted;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL) * 1000;
    const entry: CacheEntry<T> = {
      data,
      expiresAt,
      createdAt: Date.now(),
      hits: 0
    };

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }

    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.updateAccess(key);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    // Update access pattern
    entry.hits++;
    this.updateAccess(key);

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry && this.onEvicted) {
      this.onEvicted(key, entry);
    }

    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);
    return deleted;
  }

  clear(): void {
    if (this.onEvicted) {
      for (const [key, entry] of this.cache.entries()) {
        this.onEvicted(key, entry);
      }
    }
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Get cache statistics
  stats(): {
    size: number;
    maxSize: number;
    totalHits: number;
    averageAge: number;
  } {
    const now = Date.now();
    let totalHits = 0;
    let totalAge = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalAge += now - entry.createdAt;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0
    };
  }

  private updateAccess(key: string): void {
    this.accessOrder.set(key, ++this.accessCounter);
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;

    for (const [key, access] of this.accessOrder.entries()) {
      if (access < oldestAccess) {
        oldestAccess = access;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }
}

/**
 * Cache with automatic serialization for complex objects
 */
export class SerializedCache extends MemoryCache {
  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const serialized = JSON.stringify(data);
      super.set(key, serialized, ttl);
    } catch (error) {
      console.error('Cache serialization error:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const serialized = super.get<string>(key);
      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      console.error('Cache deserialization error:', error);
      this.delete(key);
      return null;
    }
  }
}

/**
 * Distributed cache interface (for Redis or similar)
 */
export interface DistributedCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

/**
 * Cache manager with fallback support
 */
export class CacheManager {
  private primary: MemoryCache | DistributedCache;
  private fallback?: MemoryCache;

  constructor(
    primary: MemoryCache | DistributedCache,
    fallback?: MemoryCache
  ) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.primary.get<T>(key);
      if (result !== null) return result;
    } catch (error) {
      console.error('Primary cache error:', error);
    }

    // Fallback to secondary cache
    if (this.fallback) {
      return this.fallback.get<T>(key);
    }

    return null;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      await this.primary.set(key, data, ttl);
    } catch (error) {
      console.error('Primary cache set error:', error);
    }

    // Also set in fallback
    if (this.fallback) {
      this.fallback.set(key, data, ttl);
    }
  }

  async delete(key: string): Promise<boolean> {
    let deleted = false;

    try {
      deleted = await this.primary.delete(key);
    } catch (error) {
      console.error('Primary cache delete error:', error);
    }

    if (this.fallback) {
      this.fallback.delete(key);
    }

    return deleted;
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.primary.has(key);
      if (exists) return true;
    } catch (error) {
      console.error('Primary cache has error:', error);
    }

    if (this.fallback) {
      return this.fallback.has(key);
    }

    return false;
  }
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  candidate: (id: string) => `candidate:${id}`,
  job: (id: string) => `job:${id}`,
  application: (id: string) => `application:${id}`,
  interview: (id: string) => `interview:${id}`,
  company: (id: string) => `company:${id}`,
  candidateSearch: (query: string, filters: Record<string, any>) => 
    `search:candidates:${Buffer.from(JSON.stringify({ query, ...filters })).toString('base64')}`,
  jobSearch: (query: string, filters: Record<string, any>) => 
    `search:jobs:${Buffer.from(JSON.stringify({ query, ...filters })).toString('base64')}`,
  aiMatch: (candidateId: string, jobId: string) => `ai:match:${candidateId}:${jobId}`,
  embeddings: (type: string, id: string) => `embeddings:${type}:${id}`
};

/**
 * Create cache instances
 */
export const memoryCache = new MemoryCache({
  maxSize: 1000,
  ttl: 3600 // 1 hour
});

export const userCache = new MemoryCache({
  maxSize: 500,
  ttl: 1800 // 30 minutes
});

export const searchCache = new SerializedCache({
  maxSize: 200,
  ttl: 300 // 5 minutes
});

export const aiCache = new SerializedCache({
  maxSize: 1000,
  ttl: 7200 // 2 hours
});

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  private cache: CacheManager;

  constructor(cache: CacheManager) {
    this.cache = cache;
  }

  // Warm frequently accessed data
  async warmFrequentData(): Promise<void> {
    // Implementation would depend on your specific use case
    // Example: pre-load popular job listings, active candidates, etc.
  }

  // Warm user-specific data
  async warmUserData(userId: string): Promise<void> {
    // Pre-load user profile, recent applications, etc.
  }
}

/**
 * Automatic cache cleanup
 */
setInterval(() => {
  memoryCache.cleanup();
  userCache.cleanup();
  searchCache.cleanup();
  aiCache.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes