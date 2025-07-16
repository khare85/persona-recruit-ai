import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface VideoAnalysisResult {
  behavioralAnalysis: string;
  audioTranscriptHighlights: string;
  suitabilityAssessment: {
    keyStrengths: string[];
    areasForDevelopment: string[];
    overallRecommendation: 'Strongly Recommended' | 'Recommended' | 'Recommended with Reservations' | 'Not Recommended';
    detailedJustification: string;
  };
  competencyScores: Array<{
    name: string;
    score: number;
    justification?: string;
  }>;
  analyzedAt: string;
  analyzedBy: string;
  version: string;
}

export interface UseVideoAnalysisReturn {
  analyzeVideo: (interviewId: string) => Promise<VideoAnalysisResult>;
  getAnalysis: (interviewId: string) => Promise<VideoAnalysisResult>;
  isAnalyzing: boolean;
  error: string | null;
  clearError: () => void;
}

export const useVideoAnalysis = (): UseVideoAnalysisReturn => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const analyzeVideo = useCallback(async (interviewId: string): Promise<VideoAnalysisResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/interviews/${interviewId}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze video');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze video';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  const getAnalysis = useCallback(async (interviewId: string): Promise<VideoAnalysisResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setError(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/interviews/${interviewId}/analyze`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get analysis');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get analysis';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  return {
    analyzeVideo,
    getAnalysis,
    isAnalyzing,
    error,
    clearError
  };
};