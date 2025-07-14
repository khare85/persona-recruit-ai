/**
 * Background Job System for Memory-Intensive Operations
 * Uses Bull queues with Redis for reliable job processing
 */

import Queue from 'bull';
import { apiLogger } from './logger';

// Job type definitions
export interface VideoProcessingJob {
  userId: string;
  videoBlob: string; // base64
  fileName: string;
  originalSize: number;
}

export interface DocumentProcessingJob {
  userId: string;
  fileBuffer: Buffer;
  fileName: string;
  fileType: string;
  originalSize: number;
}

export interface AIProcessingJob {
  userId: string;
  text: string;
  type: 'embedding' | 'analysis' | 'matching';
  metadata?: any;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  processingTime?: number;
}

// Redis configuration for different environments
const getRedisConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use Cloud Memorystore Redis or external Redis
    return {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: 0,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        connectTimeout: 10000,
        commandTimeout: 5000,
      },
      settings: {
        stalledInterval: 30 * 1000, // 30 seconds
        maxStalledCount: 1,
      },
      defaultJobOptions: {
        removeOnComplete: 10, // Keep last 10 completed jobs
        removeOnFail: 50,     // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    };
  } else {
    // Development mode - try to use local Redis, fallback gracefully
    return {
      redis: {
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: 1,
        retryDelayOnFailover: 100,
        lazyConnect: true, // Don't fail if Redis isn't available
      },
      settings: {
        stalledInterval: 30 * 1000,
        maxStalledCount: 1,
      },
      defaultJobOptions: {
        removeOnComplete: 5,
        removeOnFail: 10,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 1000,
        },
      },
    };
  }
};

const config = getRedisConfig();

// Create job queues with different priorities and concurrency limits
export const videoQueue = new Queue('video processing', config);
export const documentQueue = new Queue('document processing', config);
export const aiQueue = new Queue('ai processing', config);

// Queue configuration for different job types
videoQueue.process('process-video', 2, async (job) => {
  const startTime = Date.now();
  try {
    apiLogger.info('Starting video processing job', { 
      jobId: job.id, 
      userId: job.data.userId 
    });

    // Import the processor function dynamically to avoid loading in main thread
    const { processVideoJob } = await import('../workers/videoWorker');
    const result = await processVideoJob(job.data);

    const processingTime = Date.now() - startTime;
    apiLogger.info('Video processing job completed', { 
      jobId: job.id, 
      userId: job.data.userId,
      processingTime
    });

    return { success: true, data: result, processingTime };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    apiLogger.error('Video processing job failed', { 
      jobId: job.id, 
      userId: job.data.userId,
      error: String(error),
      processingTime
    });
    throw error;
  }
});

documentQueue.process('process-document', 3, async (job) => {
  const startTime = Date.now();
  try {
    apiLogger.info('Starting document processing job', { 
      jobId: job.id, 
      userId: job.data.userId 
    });

    const { processDocumentJob } = await import('../workers/documentWorker');
    const result = await processDocumentJob(job.data);

    const processingTime = Date.now() - startTime;
    apiLogger.info('Document processing job completed', { 
      jobId: job.id, 
      userId: job.data.userId,
      processingTime
    });

    return { success: true, data: result, processingTime };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    apiLogger.error('Document processing job failed', { 
      jobId: job.id, 
      userId: job.data.userId,
      error: String(error),
      processingTime
    });
    throw error;
  }
});

aiQueue.process('ai-processing', 4, async (job) => {
  const startTime = Date.now();
  try {
    apiLogger.info('Starting AI processing job', { 
      jobId: job.id, 
      userId: job.data.userId,
      type: job.data.type
    });

    const { processAIJob } = await import('../workers/aiWorker');
    const result = await processAIJob(job.data);

    const processingTime = Date.now() - startTime;
    apiLogger.info('AI processing job completed', { 
      jobId: job.id, 
      userId: job.data.userId,
      type: job.data.type,
      processingTime
    });

    return { success: true, data: result, processingTime };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    apiLogger.error('AI processing job failed', { 
      jobId: job.id, 
      userId: job.data.userId,
      type: job.data.type,
      error: String(error),
      processingTime
    });
    throw error;
  }
});

// Job management functions
export class BackgroundJobService {
  static async addVideoProcessingJob(data: VideoProcessingJob) {
    try {
      const job = await videoQueue.add('process-video', data, {
        priority: 10, // High priority for user-facing uploads
        delay: 100,   // Small delay to batch potential concurrent uploads
      });

      apiLogger.info('Video processing job queued', { 
        jobId: job.id, 
        userId: data.userId,
        queueSize: await videoQueue.count()
      });

      return {
        jobId: job.id,
        status: 'queued',
        estimatedWait: await this.estimateWaitTime(videoQueue),
      };
    } catch (error) {
      apiLogger.error('Failed to queue video processing job', { 
        userId: data.userId,
        error: String(error)
      });
      throw new Error('Failed to queue video processing job');
    }
  }

  static async addDocumentProcessingJob(data: DocumentProcessingJob) {
    try {
      const job = await documentQueue.add('process-document', data, {
        priority: 8, // Medium-high priority
        delay: 50,
      });

      apiLogger.info('Document processing job queued', { 
        jobId: job.id, 
        userId: data.userId,
        queueSize: await documentQueue.count()
      });

      return {
        jobId: job.id,
        status: 'queued',
        estimatedWait: await this.estimateWaitTime(documentQueue),
      };
    } catch (error) {
      apiLogger.error('Failed to queue document processing job', { 
        userId: data.userId,
        error: String(error)
      });
      throw new Error('Failed to queue document processing job');
    }
  }

  static async addAIProcessingJob(data: AIProcessingJob) {
    try {
      const priority = data.type === 'embedding' ? 6 : 4; // Embeddings are higher priority
      const job = await aiQueue.add('ai-processing', data, {
        priority,
        delay: data.type === 'embedding' ? 0 : 200, // Embeddings process immediately
      });

      apiLogger.info('AI processing job queued', { 
        jobId: job.id, 
        userId: data.userId,
        type: data.type,
        queueSize: await aiQueue.count()
      });

      return {
        jobId: job.id,
        status: 'queued',
        estimatedWait: await this.estimateWaitTime(aiQueue),
      };
    } catch (error) {
      apiLogger.error('Failed to queue AI processing job', { 
        userId: data.userId,
        type: data.type,
        error: String(error)
      });
      throw new Error('Failed to queue AI processing job');
    }
  }

  static async getJobStatus(jobId: string, queueName: 'video' | 'document' | 'ai') {
    try {
      let queue: Queue.Queue;
      switch (queueName) {
        case 'video': queue = videoQueue; break;
        case 'document': queue = documentQueue; break;
        case 'ai': queue = aiQueue; break;
        default: throw new Error('Invalid queue name');
      }

      const job = await queue.getJob(jobId);
      if (!job) {
        return { status: 'not_found' };
      }

      const state = await job.getState();
      const progress = job.progress();
      
      return {
        id: job.id,
        status: state,
        progress,
        data: job.returnvalue,
        error: job.failedReason,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      };
    } catch (error) {
      apiLogger.error('Failed to get job status', { jobId, queueName, error: String(error) });
      throw new Error('Failed to get job status');
    }
  }

  static async getQueueStats() {
    try {
      const [videoStats, documentStats, aiStats] = await Promise.all([
        this.getQueueCounts(videoQueue),
        this.getQueueCounts(documentQueue),
        this.getQueueCounts(aiQueue),
      ]);

      return {
        video: videoStats,
        document: documentStats,
        ai: aiStats,
        timestamp: new Date(),
      };
    } catch (error) {
      apiLogger.error('Failed to get queue stats', { error: String(error) });
      throw error;
    }
  }

  private static async getQueueCounts(queue: Queue.Queue) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length,
    };
  }

  private static async estimateWaitTime(queue: Queue.Queue): Promise<number> {
    try {
      const [waiting, active] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
      ]);

      // Estimate based on queue position and average processing time
      const queuePosition = waiting.length;
      const averageProcessingTime = 30000; // 30 seconds average
      const concurrency = queue.concurrency || 1;

      const estimatedWait = Math.ceil((queuePosition + active.length) / concurrency) * averageProcessingTime;
      return Math.min(estimatedWait, 300000); // Cap at 5 minutes
    } catch (error) {
      return 60000; // Default to 1 minute if estimation fails
    }
  }

  // Health check for job system
  static async healthCheck() {
    try {
      const stats = await this.getQueueStats();
      const redisStatus = await this.checkRedisConnection();
      
      return {
        status: redisStatus ? 'healthy' : 'degraded',
        redis: redisStatus,
        queues: stats,
        details: {
          totalJobs: stats.video.total + stats.document.total + stats.ai.total,
          activeJobs: stats.video.active + stats.document.active + stats.ai.active,
          failedJobs: stats.video.failed + stats.document.failed + stats.ai.failed,
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: String(error),
        redis: false,
      };
    }
  }

  private static async checkRedisConnection(): Promise<boolean> {
    try {
      await videoQueue.client.ping();
      return true;
    } catch (error) {
      apiLogger.warn('Redis connection check failed', { error: String(error) });
      return false;
    }
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  apiLogger.info('Shutting down job queues...');
  
  await Promise.all([
    videoQueue.close(),
    documentQueue.close(),
    aiQueue.close(),
  ]);
  
  apiLogger.info('Job queues shut down complete');
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Export queue instances for monitoring
export { videoQueue as _videoQueue, documentQueue as _documentQueue, aiQueue as _aiQueue };