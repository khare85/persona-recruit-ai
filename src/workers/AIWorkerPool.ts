/**
 * AI Worker Pool
 * Temporary simplified version for build
 */

export interface AIJobData {
  id: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  data: any;
}

export interface AIJobResult {
  success: boolean;
  result?: any;
  error?: string;
}

export class AIWorkerPool {
  async addJob(jobData: AIJobData) {
    return { id: jobData.id, status: 'queued' };
  }
  
  async getJobStatus(jobId: string) {
    return { id: jobId, status: 'completed', result: { success: true } };
  }
  
  getQueueStats() {
    return { pending: 0, active: 0, completed: 0, failed: 0 };
  }
}

export const aiWorkerPool = new AIWorkerPool();