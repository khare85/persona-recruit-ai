import { webSocketService } from './websocket.service';
import { notificationService } from './notification.service';
import { databaseService } from './database.service';
import { apiLogger } from '@/lib/logger';
import { addSentryBreadcrumb } from '@/lib/sentry';

export interface AIProcessingStatus {
  id: string;
  userId: string;
  type: 'resume_processing' | 'video_analysis' | 'job_matching' | 'interview_analysis' | 'bias_detection';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  stage: string;
  result?: any;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  metadata?: any;
}

export interface AIJobMatch {
  jobId: string;
  candidateId: string;
  matchScore: number;
  matchJustification: string;
  confidence: number;
  createdAt: Date;
}

export interface AIProcessingUpdate {
  processingId: string;
  type: string;
  status: string;
  progress: number;
  stage: string;
  result?: any;
  error?: string;
  timestamp: number;
}

class AIProcessingService {
  private static instance: AIProcessingService;
  private activeProcessing: Map<string, AIProcessingStatus> = new Map();
  
  static getInstance(): AIProcessingService {
    if (!AIProcessingService.instance) {
      AIProcessingService.instance = new AIProcessingService();
    }
    return AIProcessingService.instance;
  }

  /**
   * Start AI processing with real-time updates
   */
  async startProcessing(
    userId: string,
    type: AIProcessingStatus['type'],
    metadata?: any
  ): Promise<string> {
    const processingId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const processing: AIProcessingStatus = {
      id: processingId,
      userId,
      type,
      status: 'pending',
      progress: 0,
      stage: 'initializing',
      startedAt: new Date(),
      metadata
    };

    this.activeProcessing.set(processingId, processing);
    
    // Store in database
    await databaseService.create('ai_processing_status', processing);

    // Send initial status update
    await this.sendStatusUpdate(processing);

    apiLogger.info('AI processing started', {
      processingId,
      userId,
      type
    });

    return processingId;
  }

  /**
   * Update processing status with real-time notifications
   */
  async updateProcessingStatus(
    processingId: string,
    updates: Partial<Pick<AIProcessingStatus, 'status' | 'progress' | 'stage' | 'result' | 'error'>>
  ): Promise<void> {
    const processing = this.activeProcessing.get(processingId);
    if (!processing) {
      throw new Error('Processing not found');
    }

    // Update processing status
    Object.assign(processing, updates);
    
    if (updates.status === 'completed' || updates.status === 'failed') {
      processing.completedAt = new Date();
    }

    // Update in database
    await databaseService.update('ai_processing_status', processingId, {
      ...updates,
      ...(processing.completedAt && { completedAt: processing.completedAt })
    });

    // Send real-time update
    await this.sendStatusUpdate(processing);

    // Remove from active processing if completed
    if (processing.status === 'completed' || processing.status === 'failed') {
      this.activeProcessing.delete(processingId);
      
      // Send completion notification
      await this.sendCompletionNotification(processing);
    }
  }

  /**
   * Process resume with real-time updates
   */
  async processResumeWithUpdates(
    userId: string,
    resumeUrl: string,
    candidateId: string
  ): Promise<any> {
    const processingId = await this.startProcessing(userId, 'resume_processing', {
      resumeUrl,
      candidateId
    });

    try {
      // Update: Starting document processing
      await this.updateProcessingStatus(processingId, {
        status: 'in_progress',
        progress: 10,
        stage: 'extracting_text'
      });

      // Simulate document processing (replace with actual AI flow)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update: Extracting skills
      await this.updateProcessingStatus(processingId, {
        progress: 40,
        stage: 'extracting_skills'
      });

      // Simulate skill extraction (replace with actual AI flow)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update: Generating summary
      await this.updateProcessingStatus(processingId, {
        progress: 70,
        stage: 'generating_summary'
      });

      // Simulate summary generation (replace with actual AI flow)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update: Finalizing
      await this.updateProcessingStatus(processingId, {
        progress: 90,
        stage: 'finalizing'
      });

      const result = {
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
        summary: 'Experienced full-stack developer with 5+ years of experience...',
        experience: 5,
        education: 'Bachelor of Science in Computer Science'
      };

      // Complete processing
      await this.updateProcessingStatus(processingId, {
        status: 'completed',
        progress: 100,
        stage: 'completed',
        result
      });

      return result;

    } catch (error) {
      await this.updateProcessingStatus(processingId, {
        status: 'failed',
        error: String(error),
        stage: 'failed'
      });
      throw error;
    }
  }

  /**
   * Process video interview analysis with real-time updates
   */
  async processVideoAnalysisWithUpdates(
    userId: string,
    interviewId: string,
    videoUrl: string
  ): Promise<any> {
    const processingId = await this.startProcessing(userId, 'video_analysis', {
      interviewId,
      videoUrl
    });

    try {
      // Update: Processing video
      await this.updateProcessingStatus(processingId, {
        status: 'in_progress',
        progress: 15,
        stage: 'processing_video'
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update: Analyzing speech patterns
      await this.updateProcessingStatus(processingId, {
        progress: 35,
        stage: 'analyzing_speech'
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update: Evaluating responses
      await this.updateProcessingStatus(processingId, {
        progress: 60,
        stage: 'evaluating_responses'
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update: Generating behavioral analysis
      await this.updateProcessingStatus(processingId, {
        progress: 80,
        stage: 'behavioral_analysis'
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = {
        overallScore: 85,
        behavioralAnalysis: {
          communication: 90,
          problemSolving: 85,
          teamwork: 80,
          leadership: 75
        },
        suitabilityAssessment: {
          technicalFit: 88,
          culturalFit: 82,
          experience: 85
        },
        recommendations: [
          'Strong communication skills',
          'Good problem-solving approach',
          'Could benefit from more leadership experience'
        ]
      };

      // Complete processing
      await this.updateProcessingStatus(processingId, {
        status: 'completed',
        progress: 100,
        stage: 'completed',
        result
      });

      return result;

    } catch (error) {
      await this.updateProcessingStatus(processingId, {
        status: 'failed',
        error: String(error),
        stage: 'failed'
      });
      throw error;
    }
  }

  /**
   * Process job matching with real-time updates
   */
  async processJobMatchingWithUpdates(
    userId: string,
    jobId: string,
    candidateIds: string[]
  ): Promise<AIJobMatch[]> {
    const processingId = await this.startProcessing(userId, 'job_matching', {
      jobId,
      candidateCount: candidateIds.length
    });

    try {
      const matches: AIJobMatch[] = [];

      for (let i = 0; i < candidateIds.length; i++) {
        const candidateId = candidateIds[i];
        const progress = Math.round(((i + 1) / candidateIds.length) * 100);

        // Update progress
        await this.updateProcessingStatus(processingId, {
          status: 'in_progress',
          progress,
          stage: `matching_candidate_${i + 1}_of_${candidateIds.length}`
        });

        // Simulate matching process
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate match result
        const matchScore = Math.round(Math.random() * 40 + 60); // 60-100
        const match: AIJobMatch = {
          jobId,
          candidateId,
          matchScore,
          matchJustification: `Strong match based on skills and experience. Score: ${matchScore}%`,
          confidence: Math.round(Math.random() * 20 + 80), // 80-100
          createdAt: new Date()
        };

        matches.push(match);

        // Send real-time match notification to candidate
        await this.sendJobMatchNotification(match);
      }

      // Complete processing
      await this.updateProcessingStatus(processingId, {
        status: 'completed',
        progress: 100,
        stage: 'completed',
        result: { matches, totalMatches: matches.length }
      });

      return matches;

    } catch (error) {
      await this.updateProcessingStatus(processingId, {
        status: 'failed',
        error: String(error),
        stage: 'failed'
      });
      throw error;
    }
  }

  /**
   * Send real-time status update
   */
  private async sendStatusUpdate(processing: AIProcessingStatus): Promise<void> {
    const update: AIProcessingUpdate = {
      processingId: processing.id,
      type: processing.type,
      status: processing.status,
      progress: processing.progress,
      stage: processing.stage,
      result: processing.result,
      error: processing.error,
      timestamp: Date.now()
    };

    // Send via WebSocket
    webSocketService.sendToUser(processing.userId, 'ai_processing_update', update);

    addSentryBreadcrumb('AI processing update sent', 'ai', 'info', {
      processingId: processing.id,
      type: processing.type,
      status: processing.status,
      progress: processing.progress
    });
  }

  /**
   * Send completion notification
   */
  private async sendCompletionNotification(processing: AIProcessingStatus): Promise<void> {
    const title = this.getCompletionTitle(processing);
    const message = this.getCompletionMessage(processing);

    await notificationService.sendNotification({
      userId: processing.userId,
      type: 'system_alert',
      title,
      message,
      data: {
        processingId: processing.id,
        type: processing.type,
        result: processing.result,
        error: processing.error
      },
      priority: processing.status === 'completed' ? 'medium' : 'high',
      channels: ['websocket', 'email']
    });
  }

  /**
   * Send job match notification to candidate
   */
  private async sendJobMatchNotification(match: AIJobMatch): Promise<void> {
    // Get job details
    const job = await databaseService.findById('jobs', match.jobId);
    if (!job) return;

    await notificationService.sendNotification({
      userId: match.candidateId,
      type: 'job_update',
      title: 'New Job Match Found!',
      message: `You're a ${match.matchScore}% match for "${job.title}" at ${job.companyName}`,
      data: {
        jobId: match.jobId,
        matchScore: match.matchScore,
        matchJustification: match.matchJustification,
        confidence: match.confidence
      },
      priority: match.matchScore > 90 ? 'high' : 'medium',
      channels: ['websocket', 'email']
    });
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(processingId: string): Promise<AIProcessingStatus | null> {
    // Check active processing first
    const active = this.activeProcessing.get(processingId);
    if (active) return active;

    // Check database
    return await databaseService.findById('ai_processing_status', processingId) as AIProcessingStatus;
  }

  /**
   * Get user's processing history
   */
  async getUserProcessingHistory(userId: string, limit: number = 50): Promise<AIProcessingStatus[]> {
    const history = await databaseService.findMany('ai_processing_status', {
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: { field: 'startedAt', direction: 'desc' },
      limit
    });

    return history as AIProcessingStatus[];
  }

  /**
   * Cancel processing
   */
  async cancelProcessing(processingId: string): Promise<void> {
    const processing = this.activeProcessing.get(processingId);
    if (!processing) {
      throw new Error('Processing not found or already completed');
    }

    await this.updateProcessingStatus(processingId, {
      status: 'failed',
      error: 'Cancelled by user',
      stage: 'cancelled'
    });
  }

  /**
   * Helper methods
   */
  private getCompletionTitle(processing: AIProcessingStatus): string {
    if (processing.status === 'failed') {
      return 'AI Processing Failed';
    }

    switch (processing.type) {
      case 'resume_processing':
        return 'Resume Processing Complete';
      case 'video_analysis':
        return 'Video Analysis Complete';
      case 'job_matching':
        return 'Job Matching Complete';
      case 'interview_analysis':
        return 'Interview Analysis Complete';
      case 'bias_detection':
        return 'Bias Detection Complete';
      default:
        return 'AI Processing Complete';
    }
  }

  private getCompletionMessage(processing: AIProcessingStatus): string {
    if (processing.status === 'failed') {
      return `AI processing failed: ${processing.error}`;
    }

    switch (processing.type) {
      case 'resume_processing':
        return 'Your resume has been processed and your profile has been updated.';
      case 'video_analysis':
        return 'Your video interview has been analyzed and results are available.';
      case 'job_matching':
        return `Job matching completed. Found ${processing.result?.matches?.length || 0} potential matches.`;
      case 'interview_analysis':
        return 'Interview analysis completed. Results are available in your dashboard.';
      case 'bias_detection':
        return 'Bias detection analysis completed.';
      default:
        return 'AI processing completed successfully.';
    }
  }
}

export const aiProcessingService = AIProcessingService.getInstance();
export default aiProcessingService;