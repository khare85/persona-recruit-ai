import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface BiasFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export interface BiasDetectionResult {
  biasDetected: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  overallScore: number;
  flags: BiasFlag[];
  analysis: string;
  recommendations: string[];
  checkedAt: string;
  checkedBy: string;
}

export interface UseBiasDetectionReturn {
  checkBias: (data: any) => Promise<BiasDetectionResult>;
  checkApplicationBias: (applicationId: string, decision: string, reasoning: string) => Promise<BiasDetectionResult>;
  checkJobBias: (jobId: string) => Promise<BiasDetectionResult>;
  getApplicationBiasCheck: (applicationId: string) => Promise<BiasDetectionResult>;
  getJobBiasCheck: (jobId: string) => Promise<BiasDetectionResult>;
  isChecking: boolean;
  error: string | null;
  clearError: () => void;
}

export const useBiasDetection = (): UseBiasDetectionReturn => {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkBias = useCallback(async (data: any): Promise<BiasDetectionResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsChecking(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/ai/bias-detection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check bias');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check bias';
      setError(errorMessage);
      throw err;
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  const checkApplicationBias = useCallback(async (
    applicationId: string, 
    decision: string, 
    reasoning: string
  ): Promise<BiasDetectionResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsChecking(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/applications/${applicationId}/bias-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision, reasoning })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check application bias');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check application bias';
      setError(errorMessage);
      throw err;
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  const checkJobBias = useCallback(async (jobId: string): Promise<BiasDetectionResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsChecking(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/jobs/${jobId}/bias-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check job bias');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check job bias';
      setError(errorMessage);
      throw err;
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  const getApplicationBiasCheck = useCallback(async (applicationId: string): Promise<BiasDetectionResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setError(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/applications/${applicationId}/bias-check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get application bias check');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get application bias check';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  const getJobBiasCheck = useCallback(async (jobId: string): Promise<BiasDetectionResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setError(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/jobs/${jobId}/bias-check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get job bias check');
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get job bias check';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  return {
    checkBias,
    checkApplicationBias,
    checkJobBias,
    getApplicationBiasCheck,
    getJobBiasCheck,
    isChecking,
    error,
    clearError
  };
};