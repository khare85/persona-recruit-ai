/**
 * Text embedding service for converting text to vector embeddings
 * Uses Google's textembedding-gecko-multilingual model for semantic search
 */

import { aiLogger } from '@/lib/logger';

export interface EmbeddingRequest {
  text: string;
  taskType?: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY';
}

export interface EmbeddingResponse {
  embedding: number[];
  tokenCount?: number;
}

/**
 * Text embedding service using Google's Vertex AI
 */
class TextEmbeddingService {
  private readonly modelName = 'text-embedding-005';
  private readonly dimension = 768;
  private readonly maxTokens = 3072;

  /**
   * Generate embeddings for search queries
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    return this.generateEmbedding({
      text: query,
      taskType: 'RETRIEVAL_QUERY'
    });
  }

  /**
   * Generate embeddings for documents (resumes, job descriptions)
   */
  async generateDocumentEmbedding(text: string): Promise<number[]> {
    return this.generateEmbedding({
      text: text,
      taskType: 'RETRIEVAL_DOCUMENT'
    });
  }

  /**
   * Generate embeddings for semantic similarity tasks
   */
  async generateSimilarityEmbedding(text: string): Promise<number[]> {
    return this.generateEmbedding({
      text: text,
      taskType: 'SEMANTIC_SIMILARITY'
    });
  }

  /**
   * Generate embedding using Google's Vertex AI
   */
  private async generateEmbedding(request: EmbeddingRequest): Promise<number[]> {
    try {
      aiLogger.info('Generating text embedding', {
        textLength: request.text.length,
        taskType: request.taskType
      });

      // Truncate text if too long
      const truncatedText = this.truncateText(request.text);

      if (process.env.NODE_ENV === 'development') {
        // For development, return mock embedding
        aiLogger.info('Using mock embedding for development');
        return this.generateMockEmbedding(truncatedText);
      }

      // In production, use actual Vertex AI API
      const embedding = await this.callVertexAI(truncatedText, request.taskType);

      aiLogger.info('Text embedding generated successfully', {
        dimension: embedding.length,
        taskType: request.taskType
      });

      return embedding;
    } catch (error) {
      aiLogger.error('Failed to generate text embedding', {
        textLength: request.text.length,
        taskType: request.taskType,
        error: String(error)
      });
      
      // Fall back to mock embedding on error
      aiLogger.warn('Falling back to mock embedding due to error');
      return this.generateMockEmbedding(request.text);
    }
  }

  /**
   * Call Google Vertex AI to generate embeddings
   */
  private async callVertexAI(text: string, taskType?: string): Promise<number[]> {
    const { GoogleAuth } = await import('google-auth-library');
    
    try {
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });

      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

      if (!projectId) {
        throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable not set');
      }

      const client = await auth.getClient();
      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${this.modelName}:predict`;

      const requestBody = {
        instances: [
          {
            task_type: taskType || 'RETRIEVAL_QUERY',
            content: text
          }
        ]
      };

      const response = await client.request({
        url,
        method: 'POST',
        data: requestBody
      });

      if (!response.data.predictions || response.data.predictions.length === 0) {
        throw new Error('No embeddings returned from Vertex AI');
      }

      const embedding = response.data.predictions[0].embeddings.values;
      
      if (!Array.isArray(embedding) || embedding.length !== this.dimension) {
        throw new Error(`Invalid embedding dimension: expected ${this.dimension}, got ${embedding?.length}`);
      }

      return embedding;
    } catch (error) {
      aiLogger.error('Vertex AI API call failed', {
        error: String(error),
        textLength: text.length
      });
      throw error;
    }
  }

  /**
   * Generate mock embedding for development/testing
   */
  private generateMockEmbedding(text: string): number[] {
    // Create deterministic but realistic-looking embeddings
    const seed = this.hashString(text);
    const embedding: number[] = [];
    
    for (let i = 0; i < this.dimension; i++) {
      // Use seeded random to make embeddings consistent for same text
      const value = this.seededRandom(seed + i);
      // Normalize to typical embedding range [-1, 1] with normal distribution
      embedding.push((value - 0.5) * 2);
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Simple hash function for seeding mock embeddings
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Seeded random number generator
   */
  private seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Truncate text to fit within model's token limit
   */
  private truncateText(text: string): string {
    // Rough estimation: ~4 characters per token for English
    const maxChars = this.maxTokens * 4;
    
    if (text.length <= maxChars) {
      return text;
    }

    // Truncate and try to end at a word boundary
    const truncated = text.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxChars * 0.8) {
      return truncated.substring(0, lastSpace);
    }
    
    return truncated;
  }

  /**
   * Batch generate embeddings for multiple texts
   */
  async batchGenerateEmbeddings(
    texts: string[],
    taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY' = 'RETRIEVAL_DOCUMENT'
  ): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(text => 
        this.generateEmbedding({ text, taskType })
      );
      
      const batchResults = await Promise.all(batchPromises);
      embeddings.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    aiLogger.info('Batch embedding generation completed', {
      totalTexts: texts.length,
      batchSize,
      taskType
    });
    
    return embeddings;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}

export const textEmbeddingService = new TextEmbeddingService();
export default textEmbeddingService;