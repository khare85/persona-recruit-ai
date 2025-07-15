/**
 * Optimized Vector Search Service
 * High-performance semantic search with intelligent caching
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc,
  getDoc,
  Firestore 
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { AICache } from './AICache';
import { createHash } from 'crypto';

export interface SearchFilters {
  skills?: string[];
  experience?: string;
  location?: string;
  jobType?: string;
  salaryRange?: { min: number; max: number };
  availability?: string;
}

export interface SearchResult {
  id: string;
  score: number;
  candidate: any;
  matchReasons: string[];
  relevanceScore: number;
  metadata: any;
}

export interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
  useCache?: boolean;
  filters?: SearchFilters;
}

export class OptimizedVectorSearch {
  private cache: AICache;
  private db: Firestore;
  private embeddingCache = new Map<string, number[]>();
  private searchCache = new Map<string, SearchResult[]>();
  private readonly cacheTimeout = 600000; // 10 minutes

  constructor() {
    this.cache = new AICache();
    this.db = firestore;
  }

  /**
   * Search candidates using vector similarity
   */
  async searchCandidates(
    queryEmbedding: number[],
    options: VectorSearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      limit: resultLimit = 20,
      threshold = 0.7,
      includeMetadata = true,
      useCache = true,
      filters = {}
    } = options;

    const cacheKey = this.getCacheKey('search-candidates', {
      embedding: queryEmbedding,
      filters,
      limit: resultLimit,
      threshold
    });

    if (useCache) {
      const cached = this.searchCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Build Firestore query with filters
      let candidateQuery = query(
        collection(this.db, 'candidates'),
        where('status', '==', 'active')
      );

      // Apply filters
      if (filters.experience) {
        candidateQuery = query(candidateQuery, where('experienceLevel', '==', filters.experience));
      }

      if (filters.location) {
        candidateQuery = query(candidateQuery, where('location', '==', filters.location));
      }

      if (filters.availability) {
        candidateQuery = query(candidateQuery, where('availability', '==', filters.availability));
      }

      // Get candidates from Firestore
      const candidateSnapshot = await getDocs(candidateQuery);
      const candidates: any[] = [];

      candidateSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.embedding) {
          candidates.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Calculate similarities in parallel batches
      const results = await this.calculateSimilarities(
        candidates,
        queryEmbedding,
        threshold,
        includeMetadata
      );

      // Sort by similarity score and limit results
      const sortedResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, resultLimit);

      // Cache results
      if (useCache) {
        this.searchCache.set(cacheKey, sortedResults);
        setTimeout(() => {
          this.searchCache.delete(cacheKey);
        }, this.cacheTimeout);
      }

      return sortedResults;

    } catch (error) {
      console.error('Vector search error:', error);
      throw new Error('Failed to perform vector search');
    }
  }

  /**
   * Search jobs using vector similarity
   */
  async searchJobs(
    candidateEmbedding: number[],
    options: VectorSearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      limit: resultLimit = 20,
      threshold = 0.7,
      includeMetadata = true,
      useCache = true,
      filters = {}
    } = options;

    const cacheKey = this.getCacheKey('search-jobs', {
      embedding: candidateEmbedding,
      filters,
      limit: resultLimit,
      threshold
    });

    if (useCache) {
      const cached = this.searchCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Build Firestore query for jobs
      let jobQuery = query(
        collection(this.db, 'jobs'),
        where('status', '==', 'active')
      );

      // Apply filters
      if (filters.jobType) {
        jobQuery = query(jobQuery, where('type', '==', filters.jobType));
      }

      if (filters.location) {
        jobQuery = query(jobQuery, where('location', '==', filters.location));
      }

      if (filters.experience) {
        jobQuery = query(jobQuery, where('experienceLevel', '==', filters.experience));
      }

      // Get jobs from Firestore
      const jobSnapshot = await getDocs(jobQuery);
      const jobs: any[] = [];

      jobSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.embedding) {
          jobs.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Calculate similarities
      const results = await this.calculateSimilarities(
        jobs,
        candidateEmbedding,
        threshold,
        includeMetadata
      );

      // Sort and limit results
      const sortedResults = results
        .sort((a, b) => b.score - a.score)
        .slice(0, resultLimit);

      // Cache results
      if (useCache) {
        this.searchCache.set(cacheKey, sortedResults);
        setTimeout(() => {
          this.searchCache.delete(cacheKey);
        }, this.cacheTimeout);
      }

      return sortedResults;

    } catch (error) {
      console.error('Job search error:', error);
      throw new Error('Failed to perform job search');
    }
  }

  /**
   * Calculate similarity scores in parallel
   */
  private async calculateSimilarities(
    items: any[],
    queryEmbedding: number[],
    threshold: number,
    includeMetadata: boolean
  ): Promise<SearchResult[]> {
    const batchSize = 100;
    const results: SearchResult[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item) => {
        try {
          const similarity = this.calculateCosineSimilarity(
            queryEmbedding,
            item.embedding
          );

          if (similarity >= threshold) {
            const matchReasons = this.generateMatchReasons(item, similarity);
            
            return {
              id: item.id,
              score: similarity,
              candidate: includeMetadata ? item : { id: item.id, name: item.name },
              matchReasons,
              relevanceScore: this.calculateRelevanceScore(item, similarity),
              metadata: includeMetadata ? {
                skills: item.skills,
                experience: item.experienceLevel,
                location: item.location
              } : null
            };
          }
          
          return null;
        } catch (error) {
          console.error(`Error calculating similarity for item ${item.id}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null));
    }

    return results;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate match reasons based on similarity and profile
   */
  private generateMatchReasons(item: any, similarity: number): string[] {
    const reasons: string[] = [];

    if (similarity > 0.9) {
      reasons.push('Excellent overall match');
    } else if (similarity > 0.8) {
      reasons.push('Strong profile alignment');
    } else if (similarity > 0.7) {
      reasons.push('Good skill compatibility');
    }

    if (item.skills && item.skills.length > 0) {
      reasons.push(`Skills: ${item.skills.slice(0, 3).join(', ')}`);
    }

    if (item.experienceLevel) {
      reasons.push(`Experience: ${item.experienceLevel}`);
    }

    if (item.location) {
      reasons.push(`Location: ${item.location}`);
    }

    return reasons;
  }

  /**
   * Calculate relevance score based on multiple factors
   */
  private calculateRelevanceScore(item: any, similarity: number): number {
    let relevance = similarity * 0.7; // Base similarity weight

    // Boost for recent activity
    if (item.lastActive) {
      const daysSinceActive = (Date.now() - item.lastActive.toDate().getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActive < 7) {
        relevance += 0.1;
      } else if (daysSinceActive < 30) {
        relevance += 0.05;
      }
    }

    // Boost for completeness
    if (item.profileCompleteness && item.profileCompleteness > 0.8) {
      relevance += 0.1;
    }

    // Boost for verified profiles
    if (item.verified) {
      relevance += 0.05;
    }

    return Math.min(relevance, 1.0);
  }

  /**
   * Get similar candidates for a given candidate
   */
  async findSimilarCandidates(
    candidateId: string,
    options: VectorSearchOptions = {}
  ): Promise<SearchResult[]> {
    // Get candidate embedding
    const candidateDoc = await getDoc(doc(this.db, 'candidates', candidateId));
    
    if (!candidateDoc.exists()) {
      throw new Error('Candidate not found');
    }

    const candidateData = candidateDoc.data();
    if (!candidateData.embedding) {
      throw new Error('Candidate embedding not available');
    }

    return this.searchCandidates(candidateData.embedding, options);
  }

  /**
   * Batch search for multiple queries
   */
  async batchSearch(
    queries: { embedding: number[]; options?: VectorSearchOptions }[]
  ): Promise<SearchResult[][]> {
    const batchSize = 5;
    const results: SearchResult[][] = [];

    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(({ embedding, options }) => 
          this.searchCandidates(embedding, options)
        )
      );

      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get search statistics
   */
  getSearchStats(): any {
    return {
      searchCacheSize: this.searchCache.size,
      embeddingCacheSize: this.embeddingCache.size,
      searchCacheHits: this.getSearchCacheHits(),
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.searchCache.clear();
    this.embeddingCache.clear();
  }

  /**
   * Generate cache key
   */
  private getCacheKey(operation: string, data: any): string {
    const hash = createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `vector-search:${operation}:${hash}`;
  }

  /**
   * Get cache hit statistics
   */
  private getSearchCacheHits(): number {
    // This would be implemented with proper metrics tracking
    return 0;
  }

  /**
   * Get memory usage statistics
   */
  private getMemoryUsage(): any {
    const embeddingMemory = this.embeddingCache.size * 1024 * 4; // Approximate
    const searchMemory = this.searchCache.size * 1024 * 2; // Approximate
    
    return {
      embeddingCache: embeddingMemory,
      searchCache: searchMemory,
      total: embeddingMemory + searchMemory
    };
  }
}

// Singleton instance
export const optimizedVectorSearch = new OptimizedVectorSearch();