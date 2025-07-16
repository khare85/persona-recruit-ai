'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from './use-toast';
import { AIProcessingStatus, AIProcessingUpdate } from '@/services/aiProcessingService';

export interface AIProcessingHookResult {
  // Current processing states
  activeProcessing: Map<string, AIProcessingStatus>;
  processingHistory: AIProcessingStatus[];
  
  // Actions
  startResumeProcessing: (resumeUrl: string, candidateId: string) => Promise<string>;
  startVideoAnalysis: (interviewId: string, videoUrl: string) => Promise<string>;
  startJobMatching: (jobId: string, candidateIds: string[]) => Promise<string>;
  cancelProcessing: (processingId: string) => Promise<void>;
  
  // Queries
  getProcessingStatus: (processingId: string) => AIProcessingStatus | undefined;
  loadProcessingHistory: () => Promise<void>;
  
  // State
  isProcessing: boolean;
  totalProgress: number;
  isConnected: boolean;
}

export const useAIProcessing = (): AIProcessingHookResult => {
  const { user } = useAuth();
  const { subscribe, unsubscribe, isConnected } = useWebSocket();
  
  const [activeProcessing, setActiveProcessing] = useState<Map<string, AIProcessingStatus>>(new Map());
  const [processingHistory, setProcessingHistory] = useState<AIProcessingStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate if any processing is active
  const isProcessing = Array.from(activeProcessing.values()).some(p => 
    p.status === 'pending' || p.status === 'in_progress'
  );

  // Calculate total progress (average of all active processing)
  const totalProgress = Array.from(activeProcessing.values())
    .filter(p => p.status === 'in_progress')
    .reduce((sum, p, _, arr) => sum + p.progress / arr.length, 0);

  // Start resume processing
  const startResumeProcessing = useCallback(async (resumeUrl: string, candidateId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await fetch('/api/ai/process-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeUrl, candidateId })
      });

      if (!response.ok) throw new Error('Failed to start resume processing');

      const result = await response.json();
      const processingId = result.data.processingId;

      // Add to active processing
      setActiveProcessing(prev => new Map(prev.set(processingId, {
        id: processingId,
        userId: user.id,
        type: 'resume_processing',
        status: 'pending',
        progress: 0,
        stage: 'initializing',
        startedAt: new Date(),
        metadata: { resumeUrl, candidateId }
      })));

      toast({
        title: 'Resume Processing Started',
        description: 'Your resume is being processed by AI...',
        duration: 3000,
      });

      return processingId;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start resume processing',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user]);

  // Start video analysis
  const startVideoAnalysis = useCallback(async (interviewId: string, videoUrl: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await fetch('/api/ai/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, videoUrl })
      });

      if (!response.ok) throw new Error('Failed to start video analysis');

      const result = await response.json();
      const processingId = result.data.processingId;

      // Add to active processing
      setActiveProcessing(prev => new Map(prev.set(processingId, {
        id: processingId,
        userId: user.id,
        type: 'video_analysis',
        status: 'pending',
        progress: 0,
        stage: 'initializing',
        startedAt: new Date(),
        metadata: { interviewId, videoUrl }
      })));

      toast({
        title: 'Video Analysis Started',
        description: 'Your video interview is being analyzed by AI...',
        duration: 3000,
      });

      return processingId;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start video analysis',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user]);

  // Start job matching
  const startJobMatching = useCallback(async (jobId: string, candidateIds: string[]) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await fetch('/api/ai/match-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, candidateIds })
      });

      if (!response.ok) throw new Error('Failed to start job matching');

      const result = await response.json();
      const processingId = result.data.processingId;

      // Add to active processing
      setActiveProcessing(prev => new Map(prev.set(processingId, {
        id: processingId,
        userId: user.id,
        type: 'job_matching',
        status: 'pending',
        progress: 0,
        stage: 'initializing',
        startedAt: new Date(),
        metadata: { jobId, candidateCount: candidateIds.length }
      })));

      toast({
        title: 'Job Matching Started',
        description: `AI is matching ${candidateIds.length} candidates...`,
        duration: 3000,
      });

      return processingId;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start job matching',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user]);

  // Cancel processing
  const cancelProcessing = useCallback(async (processingId: string) => {
    try {
      const response = await fetch(`/api/ai/processing/${processingId}/cancel`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to cancel processing');

      // Update local state
      setActiveProcessing(prev => {
        const newMap = new Map(prev);
        const processing = newMap.get(processingId);
        if (processing) {
          newMap.set(processingId, {
            ...processing,
            status: 'failed',
            error: 'Cancelled by user',
            stage: 'cancelled',
            completedAt: new Date()
          });
        }
        return newMap;
      });

      toast({
        title: 'Processing Cancelled',
        description: 'AI processing has been cancelled',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel processing',
        variant: 'destructive',
      });
      throw error;
    }
  }, []);

  // Get processing status
  const getProcessingStatus = useCallback((processingId: string): AIProcessingStatus | undefined => {
    return activeProcessing.get(processingId);
  }, [activeProcessing]);

  // Load processing history
  const loadProcessingHistory = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/processing/history');
      if (!response.ok) throw new Error('Failed to load processing history');

      const result = await response.json();
      setProcessingHistory(result.data || []);
    } catch (error) {
      console.error('Error loading processing history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Handle WebSocket updates
  useEffect(() => {
    if (!isConnected) return;

    const handleAIProcessingUpdate = (data: AIProcessingUpdate) => {
      const { processingId, type, status, progress, stage, result, error } = data;

      setActiveProcessing(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(processingId);
        
        if (existing) {
          const updated: AIProcessingStatus = {
            ...existing,
            status: status as any,
            progress,
            stage,
            result,
            error,
            completedAt: (status === 'completed' || status === 'failed') ? new Date() : existing.completedAt
          };
          
          newMap.set(processingId, updated);

          // Show completion toast
          if (status === 'completed') {
            toast({
              title: 'AI Processing Complete',
              description: `${type.replace('_', ' ')} completed successfully`,
              duration: 5000,
            });
          } else if (status === 'failed') {
            toast({
              title: 'AI Processing Failed',
              description: error || 'Processing failed',
              variant: 'destructive',
              duration: 5000,
            });
          }

          // Remove from active processing if completed
          if (status === 'completed' || status === 'failed') {
            // Move to history
            setProcessingHistory(prev => [updated, ...prev.slice(0, 49)]);
            
            // Remove from active after a delay to show completion
            setTimeout(() => {
              setActiveProcessing(current => {
                const newCurrent = new Map(current);
                newCurrent.delete(processingId);
                return newCurrent;
              });
            }, 3000);
          }
        }

        return newMap;
      });
    };

    subscribe('ai_processing_update', handleAIProcessingUpdate);

    return () => {
      unsubscribe('ai_processing_update', handleAIProcessingUpdate);
    };
  }, [isConnected, subscribe, unsubscribe]);

  // Load processing history on mount
  useEffect(() => {
    loadProcessingHistory();
  }, [loadProcessingHistory]);

  return {
    // State
    activeProcessing,
    processingHistory,
    isProcessing,
    totalProgress,
    isConnected,
    
    // Actions
    startResumeProcessing,
    startVideoAnalysis,
    startJobMatching,
    cancelProcessing,
    
    // Queries
    getProcessingStatus,
    loadProcessingHistory,
  };
};