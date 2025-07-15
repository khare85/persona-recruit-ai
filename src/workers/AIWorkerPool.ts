/**
 * AI Worker Pool
 * Optimized background processing for AI operations
 */

import { Queue, Worker, Job } from 'bull';
import { AIOrchestrator } from '../services/ai/AIOrchestrator';
import { AIMemoryManager } from '../services/ai/AIMemoryManager';
import { EventEmitter } from 'events';

export interface AIJobData {
  id: string;
  type: 'resume' | 'video' | 'matching' | 'generation' | 'bias' | 'batch';
  priority: 'high' | 'medium' | 'low';
  data: any;
  userId?: string;
  metadata?: any;
}

export interface AIJobResult {
  success: boolean;
  result?: any;
  error?: string;
  processingTime: number;
  memoryUsage: number;
}

export class AIWorkerPool extends EventEmitter {
  private aiQueue: Queue;
  private workers: Worker[] = [];
  private aiOrchestrator: AIOrchestrator;
  private memoryManager: AIMemoryManager;
  private readonly maxWorkers = 5;
  private readonly redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  };

  constructor() {
    super();
    this.initializeQueue();
    this.initializeWorkers();
    this.aiOrchestrator = new AIOrchestrator();
    this.memoryManager = new AIMemoryManager();
  }

  /**
   * Initialize Redis queue
   */
  private initializeQueue(): void {
    this.aiQueue = new Queue('ai-processing', {
      redis: this.redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    // Queue event handlers
    this.aiQueue.on('completed', (job: Job, result: AIJobResult) => {
      this.emit('job:completed', { jobId: job.id, result });
      console.log(`AI Job completed: ${job.id} in ${result.processingTime}ms`);
    });

    this.aiQueue.on('failed', (job: Job, err: Error) => {
      this.emit('job:failed', { jobId: job.id, error: err.message });
      console.error(`AI Job failed: ${job.id}`, err);
    });

    this.aiQueue.on('progress', (job: Job, progress: number) => {
      this.emit('job:progress', { jobId: job.id, progress });
    });
  }

  /**
   * Initialize worker processes
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker('ai-processing', this.processAIJob.bind(this), {
        redis: this.redisConfig,
        concurrency: 1
      });

      worker.on('completed', (job: Job, result: AIJobResult) => {
        console.log(`Worker ${i} completed job ${job.id}`);
      });

      worker.on('failed', (job: Job, err: Error) => {
        console.error(`Worker ${i} failed job ${job.id}:`, err);
      });

      this.workers.push(worker);
    }
  }

  /**
   * Add job to AI processing queue
   */
  async addJob(jobData: AIJobData): Promise<Job> {
    const priority = this.getPriorityNumber(jobData.priority);
    
    const job = await this.aiQueue.add(jobData, {
      priority,
      delay: jobData.priority === 'low' ? 5000 : 0, // Delay low priority jobs
      jobId: jobData.id
    });

    this.emit('job:added', { jobId: job.id, type: jobData.type });
    return job;
  }

  /**
   * Add multiple jobs as batch
   */
  async addBatchJobs(jobsData: AIJobData[]): Promise<Job[]> {
    const jobs = jobsData.map(jobData => ({
      data: jobData,
      opts: {
        priority: this.getPriorityNumber(jobData.priority),
        jobId: jobData.id
      }
    }));

    const addedJobs = await this.aiQueue.addBulk(jobs);
    this.emit('batch:added', { count: addedJobs.length });
    return addedJobs;
  }

  /**
   * Process AI job
   */
  private async processAIJob(job: Job<AIJobData>): Promise<AIJobResult> {
    const startTime = Date.now();
    const startMemory = this.memoryManager.getMemoryUsage();

    try {
      job.progress(10);
      console.log(`Processing AI job: ${job.data.id} (${job.data.type})`);

      let result: any;

      switch (job.data.type) {
        case 'resume':
          result = await this.processResumeJob(job);
          break;
        case 'video':
          result = await this.processVideoJob(job);
          break;
        case 'matching':
          result = await this.processMatchingJob(job);
          break;
        case 'generation':
          result = await this.processGenerationJob(job);
          break;
        case 'bias':
          result = await this.processBiasJob(job);
          break;
        case 'batch':
          result = await this.processBatchJob(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.data.type}`);
      }

      job.progress(100);

      const processingTime = Date.now() - startTime;
      const memoryUsage = this.memoryManager.getMemoryUsage() - startMemory;

      return {
        success: true,
        result,
        processingTime,
        memoryUsage
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const memoryUsage = this.memoryManager.getMemoryUsage() - startMemory;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
        memoryUsage
      };
    }
  }

  /**
   * Process resume analysis job
   */
  private async processResumeJob(job: Job<AIJobData>): Promise<any> {
    job.progress(20);
    
    const result = await this.aiOrchestrator.processCandidateComplete({
      id: job.data.data.candidateId,
      resume: job.data.data.resume,
      profile: job.data.data.profile
    });

    job.progress(80);
    return result;
  }

  /**
   * Process video analysis job
   */
  private async processVideoJob(job: Job<AIJobData>): Promise<any> {
    job.progress(20);
    
    const result = await this.aiOrchestrator.processCandidateComplete({
      id: job.data.data.candidateId,
      profile: job.data.data.profile,
      videoInterview: job.data.data.videoPath
    });

    job.progress(80);
    return result;
  }

  /**
   * Process matching job
   */
  private async processMatchingJob(job: Job<AIJobData>): Promise<any> {
    job.progress(20);
    
    // Implementation for job matching
    const result = await this.aiOrchestrator.processCandidateComplete({
      id: job.data.data.candidateId,
      profile: job.data.data.profile
    });

    job.progress(80);
    return result.jobMatches;
  }

  /**
   * Process generation job
   */
  private async processGenerationJob(job: Job<AIJobData>): Promise<any> {
    job.progress(20);
    
    const result = await this.aiOrchestrator.generateJobDescription(job.data.data);
    
    job.progress(80);
    return result;
  }

  /**
   * Process bias detection job
   */
  private async processBiasJob(job: Job<AIJobData>): Promise<any> {
    job.progress(20);
    
    const result = await this.aiOrchestrator.detectBias(job.data.data);
    
    job.progress(80);
    return result;
  }

  /**
   * Process batch job
   */
  private async processBatchJob(job: Job<AIJobData>): Promise<any> {
    job.progress(20);
    
    const results = await this.aiOrchestrator.processCandidatesBatch(job.data.data.candidates);
    
    job.progress(80);
    return results;
  }

  /**
   * Get priority number for queue
   */
  private getPriorityNumber(priority: string): number {
    switch (priority) {
      case 'high': return 10;
      case 'medium': return 5;
      case 'low': return 1;
      default: return 5;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    const waiting = await this.aiQueue.getWaiting();
    const active = await this.aiQueue.getActive();
    const completed = await this.aiQueue.getCompleted();
    const failed = await this.aiQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      workers: this.workers.length,
      memoryUsage: this.memoryManager.getUsage()
    };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.aiQueue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      progress: job.progress(),
      data: job.data,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason
    };
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.aiQueue.getJob(jobId);
    if (!job) return false;

    await job.remove();
    return true;
  }

  /**
   * Pause queue
   */
  async pauseQueue(): Promise<void> {
    await this.aiQueue.pause();
  }

  /**
   * Resume queue
   */
  async resumeQueue(): Promise<void> {
    await this.aiQueue.resume();
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.aiQueue.close();
    await Promise.all(this.workers.map(worker => worker.close()));
  }
}

// Singleton instance
export const aiWorkerPool = new AIWorkerPool();