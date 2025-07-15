/**
 * Centralized AI Orchestrator
 * Manages all AI operations with optimal performance and resource utilization
 */

import { GeminiService } from './GeminiService';
import { DocumentAIService } from './DocumentAIService';
import { ElevenLabsService } from './ElevenLabsService';
import { EmbeddingService } from './EmbeddingService';
import { AICache } from './AICache';
import { AIRateLimiter } from './AIRateLimiter';
import { AIMemoryManager } from './AIMemoryManager';
import { EventEmitter } from 'events';

export interface CandidateData {
  id: string;
  resume?: File | string;
  profile: any;
  videoInterview?: string;
}

export interface AIProcessingResult {
  resumeAnalysis?: any;
  skillExtraction?: string[];
  embeddings?: number[];
  jobMatches?: any[];
  videoAnalysis?: any;
  biasReport?: any;
}

export interface AIJob {
  id: string;
  type: 'resume' | 'video' | 'matching' | 'generation' | 'bias';
  priority: 'high' | 'medium' | 'low';
  data: any;
  userId?: string;
  createdAt: Date;
}

export class AIOrchestrator extends EventEmitter {
  private geminiService: GeminiService;
  private documentAIService: DocumentAIService;
  private elevenLabsService: ElevenLabsService;
  private embeddingService: EmbeddingService;
  private aiCache: AICache;
  private rateLimiter: AIRateLimiter;
  private memoryManager: AIMemoryManager;

  constructor() {
    super();
    this.initializeServices();
  }

  private async initializeServices() {
    this.geminiService = new GeminiService();
    this.documentAIService = new DocumentAIService();
    this.elevenLabsService = new ElevenLabsService();
    this.embeddingService = new EmbeddingService();
    this.aiCache = new AICache();
    this.rateLimiter = new AIRateLimiter();
    this.memoryManager = new AIMemoryManager();
  }

  /**
   * Process complete candidate with all AI features
   * Optimized for performance with batch processing and caching
   */
  async processCandidateComplete(candidateData: CandidateData): Promise<AIProcessingResult> {
    const startTime = Date.now();
    
    try {
      this.emit('processing:start', { candidateId: candidateData.id, type: 'complete' });

      // Check cache first
      const cacheKey = `candidate:complete:${candidateData.id}`;
      const cached = await this.aiCache.get(cacheKey);
      if (cached) {
        this.emit('processing:complete', { candidateId: candidateData.id, cached: true });
        return cached;
      }

      // Process in optimized parallel batches
      const [
        resumeAnalysis,
        skillExtraction,
        embeddings
      ] = await Promise.all([
        this.analyzeResume(candidateData.resume),
        this.extractSkills(candidateData.resume),
        this.generateEmbeddings(candidateData.profile)
      ]);

      // Get job matches after embeddings are ready
      const jobMatches = await this.findJobMatches(candidateData.profile, embeddings);

      // Process video analysis in background if available
      let videoAnalysis = null;
      if (candidateData.videoInterview) {
        videoAnalysis = await this.analyzeVideo(candidateData.videoInterview);
      }

      const result: AIProcessingResult = {
        resumeAnalysis,
        skillExtraction,
        embeddings,
        jobMatches,
        videoAnalysis
      };

      // Cache result for 1 hour
      await this.aiCache.set(cacheKey, result, 3600);

      const processingTime = Date.now() - startTime;
      this.emit('processing:complete', { 
        candidateId: candidateData.id, 
        processingTime,
        cached: false 
      });

      return result;

    } catch (error) {
      this.emit('processing:error', { candidateId: candidateData.id, error });
      throw error;
    }
  }

  /**
   * Batch process multiple candidates efficiently
   */
  async processCandidatesBatch(candidates: CandidateData[]): Promise<AIProcessingResult[]> {
    return this.memoryManager.processWithMemoryLimit(
      candidates,
      (candidate) => this.processCandidateComplete(candidate)
    );
  }

  /**
   * Analyze resume with Document AI and Gemini
   */
  private async analyzeResume(resume?: File | string): Promise<any> {
    if (!resume) return null;

    const cacheKey = `resume:analysis:${this.hashContent(resume)}`;
    const cached = await this.aiCache.get(cacheKey);
    if (cached) return cached;

    return this.rateLimiter.callAIService(
      'documentai',
      async () => {
        const extractedText = await this.documentAIService.extractText(resume);
        const analysis = await this.geminiService.analyzeResume(extractedText);
        
        await this.aiCache.set(cacheKey, analysis, 86400); // 24 hours
        return analysis;
      },
      'high'
    );
  }

  /**
   * Extract skills using Gemini AI
   */
  private async extractSkills(resume?: File | string): Promise<string[]> {
    if (!resume) return [];

    const cacheKey = `skills:extraction:${this.hashContent(resume)}`;
    const cached = await this.aiCache.get(cacheKey);
    if (cached) return cached;

    return this.rateLimiter.callAIService(
      'gemini',
      async () => {
        const extractedText = await this.documentAIService.extractText(resume);
        const skills = await this.geminiService.extractSkills(extractedText);
        
        await this.aiCache.set(cacheKey, skills, 86400); // 24 hours
        return skills;
      },
      'medium'
    );
  }

  /**
   * Generate embeddings for semantic search
   */
  private async generateEmbeddings(profile: any): Promise<number[]> {
    const profileText = this.profileToText(profile);
    const cacheKey = `embeddings:${this.hashContent(profileText)}`;
    
    const cached = await this.aiCache.get(cacheKey);
    if (cached) return cached;

    return this.rateLimiter.callAIService(
      'embeddings',
      async () => {
        const embeddings = await this.embeddingService.generateEmbedding(profileText);
        await this.aiCache.set(cacheKey, embeddings, 86400); // 24 hours
        return embeddings;
      },
      'high'
    );
  }

  /**
   * Find job matches using vector search
   */
  private async findJobMatches(profile: any, embeddings: number[]): Promise<any[]> {
    const cacheKey = `matches:${profile.id}:${this.hashContent(embeddings)}`;
    const cached = await this.aiCache.get(cacheKey);
    if (cached) return cached;

    return this.rateLimiter.callAIService(
      'matching',
      async () => {
        const matches = await this.embeddingService.findSimilarJobs(embeddings, 10);
        await this.aiCache.set(cacheKey, matches, 1800); // 30 minutes
        return matches;
      },
      'medium'
    );
  }

  /**
   * Analyze video interview
   */
  private async analyzeVideo(videoPath: string): Promise<any> {
    const cacheKey = `video:analysis:${this.hashContent(videoPath)}`;
    const cached = await this.aiCache.get(cacheKey);
    if (cached) return cached;

    return this.rateLimiter.callAIService(
      'video',
      async () => {
        const analysis = await this.geminiService.analyzeVideo(videoPath);
        await this.aiCache.set(cacheKey, analysis, 86400); // 24 hours
        return analysis;
      },
      'low'
    );
  }

  /**
   * Generate job description using AI
   */
  async generateJobDescription(jobData: any): Promise<string> {
    const cacheKey = `job:description:${this.hashContent(jobData)}`;
    const cached = await this.aiCache.get(cacheKey);
    if (cached) return cached;

    return this.rateLimiter.callAIService(
      'gemini',
      async () => {
        const description = await this.geminiService.generateJobDescription(jobData);
        await this.aiCache.set(cacheKey, description, 86400); // 24 hours
        return description;
      },
      'medium'
    );
  }

  /**
   * Conduct live interview with AI
   */
  async conductLiveInterview(config: any): Promise<any> {
    return this.elevenLabsService.startConversation(config);
  }

  /**
   * Detect bias in AI decisions
   */
  async detectBias(data: any): Promise<any> {
    const cacheKey = `bias:detection:${this.hashContent(data)}`;
    const cached = await this.aiCache.get(cacheKey);
    if (cached) return cached;

    return this.rateLimiter.callAIService(
      'bias',
      async () => {
        const biasReport = await this.geminiService.detectBias(data);
        await this.aiCache.set(cacheKey, biasReport, 3600); // 1 hour
        return biasReport;
      },
      'high'
    );
  }

  /**
   * Get AI processing statistics
   */
  getProcessingStats(): any {
    return {
      cacheHitRate: this.aiCache.getHitRate(),
      rateLimitStatus: this.rateLimiter.getStatus(),
      memoryUsage: this.memoryManager.getUsage(),
      activeJobs: this.getActiveJobs()
    };
  }

  private getActiveJobs(): number {
    return this.rateLimiter.getActiveJobs();
  }

  private hashContent(content: any): string {
    return require('crypto').createHash('md5').update(JSON.stringify(content)).digest('hex');
  }

  private profileToText(profile: any): string {
    return `${profile.name} ${profile.title} ${profile.skills?.join(' ')} ${profile.experience}`;
  }
}

// Singleton instance
export const aiOrchestrator = new AIOrchestrator();