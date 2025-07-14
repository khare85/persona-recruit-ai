/**
 * AI Processing Worker
 * Handles memory-intensive AI operations (embeddings, analysis, matching) in separate process
 */

import { apiLogger } from '../lib/logger';
import { textEmbeddingService } from '../services/textEmbedding.service';
import { databaseService } from '../services/database.service';
import { embeddingDatabaseService } from '../services/embeddingDatabase.service';
import type { AIProcessingJob, JobResult } from '../lib/backgroundJobs';

export async function processAIJob(jobData: AIProcessingJob): Promise<JobResult['data']> {
  const { userId, text, type, metadata } = jobData;
  
  let processingResult: any = null;

  try {
    apiLogger.info('Starting AI processing', {
      userId,
      type,
      textLength: text.length,
      memoryBefore: process.memoryUsage()
    });

    switch (type) {
      case 'embedding':
        processingResult = await processEmbeddingGeneration(userId, text, metadata);
        break;
      case 'analysis':
        processingResult = await processTextAnalysis(userId, text, metadata);
        break;
      case 'matching':
        processingResult = await processJobMatching(userId, text, metadata);
        break;
      default:
        throw new Error(`Unknown AI processing type: ${type}`);
    }

    apiLogger.info('AI processing completed successfully', {
      userId,
      type,
      resultSize: JSON.stringify(processingResult).length,
      memoryFinal: process.memoryUsage()
    });

    return {
      type,
      result: processingResult,
      processingComplete: true
    };

  } catch (error) {
    apiLogger.error('AI processing failed', {
      userId,
      type,
      error: error.message,
      stack: error.stack,
      memoryAtError: process.memoryUsage()
    });
    throw error;
  } finally {
    // Cleanup memory
    try {
      processingResult = null;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        apiLogger.debug('Forced garbage collection after AI processing', {
          userId,
          type,
          memoryAfterGC: process.memoryUsage()
        });
      }
    } catch (cleanupError) {
      apiLogger.warn('Error during AI processing cleanup', {
        userId,
        type,
        error: cleanupError.message
      });
    }
  }
}

// Embedding generation with memory management
async function processEmbeddingGeneration(userId: string, text: string, metadata?: any) {
  try {
    // Generate embeddings with memory monitoring
    const embeddings = await textEmbeddingService.generateDocumentEmbedding(text);
    
    apiLogger.info('Embeddings generated', {
      userId,
      embeddingDimension: embeddings.length,
      memoryAfterEmbedding: process.memoryUsage()
    });

    // If this is for a candidate, update their embedding in the database
    if (metadata?.candidateId || metadata?.updateDatabase) {
      try {
        const candidateId = metadata.candidateId || userId;
        const existingCandidate = await embeddingDatabaseService.getCandidateWithEmbedding(candidateId);
        
        if (existingCandidate) {
          // Update existing candidate with new embeddings
          await embeddingDatabaseService.saveCandidateWithEmbedding(candidateId, {
            ...existingCandidate,
            resumeEmbedding: embeddings,
            extractedResumeText: text.substring(0, 2000), // Truncate for storage
            lastUpdated: new Date()
          });
          
          apiLogger.info('Candidate embeddings updated in database', { candidateId });
        }
      } catch (dbError) {
        apiLogger.warn('Failed to update candidate embeddings in database', {
          userId,
          error: dbError.message
        });
        // Don't fail the entire job for database issues
      }
    }

    return {
      embeddings,
      dimension: embeddings.length,
      textLength: text.length,
      metadata: metadata || {}
    };
  } catch (error) {
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

// Text analysis with memory management
async function processTextAnalysis(userId: string, text: string, metadata?: any) {
  try {
    // For now, implement basic text analysis
    // This could be expanded to use more sophisticated AI models
    const analysisResult = {
      wordCount: text.split(/\s+/).length,
      characterCount: text.length,
      estimatedReadingTime: Math.ceil(text.split(/\s+/).length / 200), // words per minute
      complexity: calculateTextComplexity(text),
      keyPhrases: extractKeyPhrases(text),
      sentiment: analyzeSentiment(text),
      metadata: metadata || {}
    };

    apiLogger.info('Text analysis completed', {
      userId,
      wordCount: analysisResult.wordCount,
      complexity: analysisResult.complexity,
      memoryAfterAnalysis: process.memoryUsage()
    });

    return analysisResult;
  } catch (error) {
    throw new Error(`Text analysis failed: ${error.message}`);
  }
}

// Job matching with memory management
async function processJobMatching(userId: string, query: string, metadata?: any) {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await textEmbeddingService.generateDocumentEmbedding(query);
    
    // Search for matching candidates or jobs based on metadata
    let matches = [];
    
    if (metadata?.searchType === 'candidates') {
      // Search for candidates matching the job description
      matches = await embeddingDatabaseService.searchCandidates({
        embedding: queryEmbedding,
        limit: metadata.limit || 10,
        threshold: metadata.threshold || 0.7
      });
    } else if (metadata?.searchType === 'jobs') {
      // Search for jobs matching the candidate profile
      // This would require job embeddings to be stored as well
      matches = await searchJobsByEmbedding(queryEmbedding, metadata);
    }

    apiLogger.info('Job matching completed', {
      userId,
      searchType: metadata?.searchType,
      matchCount: matches.length,
      memoryAfterMatching: process.memoryUsage()
    });

    return {
      matches,
      queryEmbedding: queryEmbedding,
      searchMetadata: metadata || {},
      searchPerformed: new Date()
    };
  } catch (error) {
    throw new Error(`Job matching failed: ${error.message}`);
  }
}

// Helper functions for text analysis
function calculateTextComplexity(text: string): number {
  // Simple complexity score based on sentence length and vocabulary
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/);
  const averageSentenceLength = words.length / sentences.length;
  const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
  const vocabularyRichness = uniqueWords / words.length;
  
  // Scale complexity from 1-10
  return Math.min(10, Math.round((averageSentenceLength / 20) * 5 + vocabularyRichness * 5));
}

function extractKeyPhrases(text: string): string[] {
  // Simple key phrase extraction
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  return Array.from(wordFreq.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

function analyzeSentiment(text: string): { score: number; label: string } {
  // Very basic sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'fantastic', 'wonderful', 'outstanding'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'poor', 'failed'];
  
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 1;
    if (negativeWords.includes(word)) score -= 1;
  });
  
  const normalizedScore = Math.max(-1, Math.min(1, score / words.length * 10));
  
  let label = 'neutral';
  if (normalizedScore > 0.2) label = 'positive';
  if (normalizedScore < -0.2) label = 'negative';
  
  return { score: normalizedScore, label };
}

// Placeholder for job search by embedding
async function searchJobsByEmbedding(embedding: number[], metadata: any) {
  // This would require implementing job embedding storage and search
  // For now, return empty array
  apiLogger.info('Job search by embedding not yet implemented', { metadata });
  return [];
}

// Memory monitoring for AI worker
export function getAIWorkerMemoryStats() {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers,
    rssMB: Math.round(usage.rss / 1024 / 1024),
    heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
    timestamp: new Date()
  };
}

// Health check for AI worker
export function aiWorkerHealthCheck() {
  const memStats = getAIWorkerMemoryStats();
  const memoryPercent = (memStats.heapUsed / memStats.heapTotal) * 100;
  
  return {
    status: memoryPercent > 85 ? 'degraded' : 'healthy',
    memory: memStats,
    memoryPercent,
    workerType: 'ai'
  };
}