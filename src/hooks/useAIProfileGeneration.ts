import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AIProfileGenerationStatus {
  showPopup: boolean;
  hasProfile: boolean;
  hasResume: boolean;
  hasAIGenerated: boolean;
  profileComplete: boolean;
  skillsCount: number;
  lastUpdated?: string;
}

export const useAIProfileGeneration = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AIProfileGenerationStatus>({
    showPopup: false,
    hasProfile: false,
    hasResume: false,
    hasAIGenerated: false,
    profileComplete: false,
    skillsCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user should see AI profile generation popup
  const checkAIProfileStatus = useCallback(async () => {
    if (!user || user.role !== 'candidate') return;

    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/candidates/ai-profile-generation', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check AI profile status');
      }

      const result = await response.json();
      
      // Show popup if:
      // 1. User has no profile yet, OR
      // 2. User has profile but no AI-generated content and no resume
      const shouldShowPopup = !result.hasProfile || 
                             (result.hasProfile && !result.hasAIGenerated && !result.hasResume);

      setStatus({
        showPopup: shouldShowPopup,
        hasProfile: result.hasProfile,
        hasResume: result.hasResume,
        hasAIGenerated: result.hasAIGenerated,
        profileComplete: result.profileComplete,
        skillsCount: result.skillsCount || 0,
        lastUpdated: result.lastUpdated
      });

    } catch (err) {
      console.error('Error checking AI profile status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check profile status');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check status when user changes or component mounts
  useEffect(() => {
    checkAIProfileStatus();
  }, [checkAIProfileStatus]);

  // Hide popup (user dismissed it or completed generation)
  const hidePopup = useCallback(() => {
    setStatus(prev => ({ ...prev, showPopup: false }));
  }, []);

  // Refresh status after profile generation
  const refreshStatus = useCallback(() => {
    checkAIProfileStatus();
  }, [checkAIProfileStatus]);

  // Show popup manually (for testing or re-triggering)
  const showPopup = useCallback(() => {
    setStatus(prev => ({ ...prev, showPopup: true }));
  }, []);

  return {
    status,
    loading,
    error,
    hidePopup,
    refreshStatus,
    showPopup,
    checkAIProfileStatus
  };
};