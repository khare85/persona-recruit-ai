/**
 * AI Processing Hooks
 * Real-time AI feedback and status updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { aiOrchestrator } from '../services/ai/AIOrchestrator';
import { aiWorkerPool } from '../workers/AIWorkerPool';

export type AIStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface AIProcessingState {
  status: AIStatus;
  progress: number;
  result?: any;
  error?: string;
  processingTime?: number;
  memoryUsage?: number;
}

export interface AIProcessingOptions {
  priority?: 'high' | 'medium' | 'low';
  enableRealTimeUpdates?: boolean;
  cacheResults?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for AI processing with real-time updates
 */
export function useAIProcessing(
  processingType: string,
  options: AIProcessingOptions = {}
) {
  const [state, setState] = useState<AIProcessingState>({
    status: 'idle',
    progress: 0
  });

  const jobIdRef = useRef<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  const processAI = useCallback(async (data: any) => {
    try {
      setState(prev => ({ ...prev, status: 'processing', progress: 0 }));

      const jobId = `${processingType}-${Date.now()}`;
      jobIdRef.current = jobId;

      // Add job to worker pool
      const job = await aiWorkerPool.addJob({
        id: jobId,
        type: processingType as any,
        priority: options.priority || 'medium',
        data
      });

      // Set up real-time updates if enabled
      if (options.enableRealTimeUpdates) {
        subscriptionRef.current = aiWorkerPool.on('job:progress', ({ jobId: eventJobId, progress }) => {
          if (eventJobId === jobId) {
            setState(prev => ({ ...prev, progress }));
            options.onProgress?.(progress);
          }
        });
      }

      // Wait for completion
      const result = await job.finished();

      setState(prev => ({
        ...prev,
        status: 'completed',
        progress: 100,
        result: result.result,
        processingTime: result.processingTime,
        memoryUsage: result.memoryUsage
      }));

      options.onComplete?.(result.result);
      return result.result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
      options.onError?.(errorMessage);
      throw error;
    }
  }, [processingType, options]);

  const cancelProcessing = useCallback(async () => {
    if (jobIdRef.current) {
      await aiWorkerPool.cancelJob(jobIdRef.current);
      setState(prev => ({ ...prev, status: 'idle', progress: 0 }));
    }
  }, []);

  const resetState = useCallback(() => {
    setState({ status: 'idle', progress: 0 });
    jobIdRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, []);

  return {
    ...state,
    processAI,
    cancelProcessing,
    resetState,
    isProcessing: state.status === 'processing',
    isCompleted: state.status === 'completed',
    hasError: state.status === 'error'
  };
}

/**
 * Hook for AI insights with caching
 */
export function useAIInsights(candidateId: string) {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { processAI } = useAIProcessing('resume', {
    priority: 'medium',
    enableRealTimeUpdates: true
  });

  const fetchInsights = useCallback(async () => {
    if (!candidateId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await processAI({
        candidateId,
        type: 'insights'
      });

      setInsights(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setIsLoading(false);
    }
  }, [candidateId, processAI]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    isLoading,
    error,
    refetch: fetchInsights
  };
}

/**
 * Hook for job matching with real-time updates
 */
export function useJobMatching(candidateId: string) {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { processAI, progress } = useAIProcessing('matching', {
    priority: 'high',
    enableRealTimeUpdates: true
  });

  const findMatches = useCallback(async () => {
    if (!candidateId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await processAI({
        candidateId,
        type: 'job-matching'
      });

      setMatches(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find matches');
    } finally {
      setIsLoading(false);
    }
  }, [candidateId, processAI]);

  useEffect(() => {
    findMatches();
  }, [findMatches]);

  return {
    matches,
    isLoading,
    error,
    progress,
    refetch: findMatches
  };
}

/**
 * Hook for AI job generation
 */
export function useAIJobGeneration() {
  const { processAI, isProcessing, progress } = useAIProcessing('generation', {
    priority: 'medium',
    enableRealTimeUpdates: true
  });

  const generateJobDescription = useCallback(async (jobData: any) => {
    return processAI({
      type: 'job-description',
      data: jobData
    });
  }, [processAI]);

  const generateJobRequirements = useCallback(async (jobData: any) => {
    return processAI({
      type: 'job-requirements',
      data: jobData
    });
  }, [processAI]);

  const generateSkills = useCallback(async (jobData: any) => {
    return processAI({
      type: 'skills',
      data: jobData
    });
  }, [processAI]);

  return {
    generateJobDescription,
    generateJobRequirements,
    generateSkills,
    isGenerating: isProcessing,
    progress
  };
}

/**
 * Hook for video interview analysis
 */
export function useVideoAnalysis(videoPath: string) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { processAI, progress } = useAIProcessing('video', {
    priority: 'high',
    enableRealTimeUpdates: true
  });

  const analyzeVideo = useCallback(async () => {
    if (!videoPath) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await processAI({
        videoPath,
        type: 'video-analysis'
      });

      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze video');
    } finally {
      setIsAnalyzing(false);
    }
  }, [videoPath, processAI]);

  useEffect(() => {
    if (videoPath) {
      analyzeVideo();
    }
  }, [analyzeVideo, videoPath]);

  return {
    analysis,
    isAnalyzing,
    error,
    progress,
    refetch: analyzeVideo
  };
}

/**
 * Hook for bias detection
 */
export function useBiasDetection() {
  const { processAI, isProcessing, progress } = useAIProcessing('bias', {
    priority: 'high',
    enableRealTimeUpdates: true
  });

  const detectBias = useCallback(async (data: any) => {
    return processAI({
      type: 'bias-detection',
      data
    });
  }, [processAI]);

  return {
    detectBias,
    isDetecting: isProcessing,
    progress
  };
}

/**
 * Hook for batch AI processing
 */
export function useBatchAIProcessing() {
  const [batchStatus, setBatchStatus] = useState<{
    total: number;
    completed: number;
    failed: number;
    progress: number;
  }>({
    total: 0,
    completed: 0,
    failed: 0,
    progress: 0
  });

  const processBatch = useCallback(async (items: any[], processingType: string) => {
    setBatchStatus({ total: items.length, completed: 0, failed: 0, progress: 0 });

    const batchId = `batch-${Date.now()}`;
    
    const job = await aiWorkerPool.addJob({
      id: batchId,
      type: 'batch',
      priority: 'medium',
      data: { items, processingType }
    });

    // Monitor batch progress
    const progressInterval = setInterval(async () => {
      const status = await aiWorkerPool.getJobStatus(batchId);
      if (status) {
        setBatchStatus(prev => ({
          ...prev,
          progress: status.progress
        }));
      }
    }, 1000);

    try {
      const result = await job.finished();
      clearInterval(progressInterval);
      
      setBatchStatus(prev => ({
        ...prev,
        completed: result.result.length,
        progress: 100
      }));

      return result.result;
    } catch (error) {
      clearInterval(progressInterval);
      setBatchStatus(prev => ({
        ...prev,
        failed: prev.total - prev.completed,
        progress: 100
      }));
      throw error;
    }
  }, []);

  return {
    processBatch,
    batchStatus
  };
}

/**
 * Hook for AI statistics
 */
export function useAIStats() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [orchestratorStats, queueStats] = await Promise.all([
        aiOrchestrator.getProcessingStats(),
        aiWorkerPool.getQueueStats()
      ]);

      setStats({
        orchestrator: orchestratorStats,
        queue: queueStats
      });
    } catch (error) {
      console.error('Failed to fetch AI stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    refresh: fetchStats
  };
}