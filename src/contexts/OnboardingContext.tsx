"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useUserProfile } from './UserProfileContext';
import { useRouter } from 'next/navigation';
import { apiLogger } from '@/lib/logger';

export type OnboardingStep = 'resume' | 'video' | 'complete';

interface OnboardingContextType {
  showOnboardingModal: boolean;
  currentStep: OnboardingStep;
  isOnboardingComplete: boolean;
  completedSteps: Set<string>;
  setShowOnboardingModal: (show: boolean) => void;
  setCurrentStep: (step: OnboardingStep) => void;
  markStepComplete: (step: string) => void;
  getNextStep: () => OnboardingStep | null;
  goToNextStep: () => void;
  skipOnboarding: () => void;
  restartOnboarding: () => void;
  getOnboardingProgress: () => number;
  getOnboardingRedirectPath: () => string | null;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();
  
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('resume');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Calculate onboarding completion status
  const isOnboardingComplete = useCallback((): boolean => {
    if (!user || user.role !== 'candidate' || !profile) return true;
    return profile.profileComplete && profile.resumeUploaded && profile.videoIntroRecorded;
  }, [user, profile]);

  // Get onboarding progress as percentage
  const getOnboardingProgress = useCallback((): number => {
    if (!user || user.role !== 'candidate') return 100;
    
    const totalSteps = 2; // resume + video
    let completed = 0;
    
    if (profile?.resumeUploaded) completed++;
    if (profile?.videoIntroRecorded) completed++;
    
    return Math.round((completed / totalSteps) * 100);
  }, [user, profile]);

  // Get the next step in the onboarding flow
  const getNextStep = useCallback((): OnboardingStep | null => {
    if (!user || user.role !== 'candidate' || !profile) return null;
    
    if (!profile.resumeUploaded) return 'resume';
    if (!profile.videoIntroRecorded) return 'video';
    return null; // All steps complete
  }, [user, profile]);

  // Navigate to the next step
  const goToNextStep = useCallback(() => {
    const nextStep = getNextStep();
    if (nextStep) {
      setCurrentStep(nextStep);
      
      // Navigate to the appropriate page
      const paths = {
        resume: '/candidates/onboarding/resume',
        video: '/candidates/onboarding/video-intro'
      };
      
      router.push(paths[nextStep]);
    } else {
      // Onboarding complete
      setShowOnboardingModal(false);
      router.push('/candidates/dashboard');
    }
  }, [getNextStep, router]);

  // Mark a step as completed
  const markStepComplete = useCallback((step: string) => {
    setCompletedSteps(prev => new Set(prev).add(step));
    
    apiLogger.info('Onboarding step completed', {
      userId: user?.uid,
      step,
      progress: getOnboardingProgress()
    });
  }, [user?.uid, getOnboardingProgress]);

  // Skip onboarding (for testing or user preference)
  const skipOnboarding = useCallback(() => {
    setShowOnboardingModal(false);
    router.push('/candidates/dashboard');
    
    apiLogger.info('Onboarding skipped', {
      userId: user?.uid,
      currentStep,
      progress: getOnboardingProgress()
    });
  }, [user?.uid, currentStep, getOnboardingProgress, router]);

  // Restart onboarding flow
  const restartOnboarding = useCallback(() => {
    setCurrentStep('resume');
    setCompletedSteps(new Set());
    setShowOnboardingModal(true);
    
    apiLogger.info('Onboarding restarted', {
      userId: user?.uid
    });
  }, [user?.uid]);

  // Get redirect path for incomplete onboarding
  const getOnboardingRedirectPath = useCallback((): string | null => {
    if (!user || user.role !== 'candidate' || isOnboardingComplete()) return null;
    
    const nextStep = getNextStep();
    if (!nextStep) return null;
    
    const paths = {
      resume: '/candidates/onboarding/resume',
      video: '/candidates/onboarding/video-intro'
    };
    
    return paths[nextStep];
  }, [user, isOnboardingComplete, getNextStep]);

  // Update current step based on profile changes
  useEffect(() => {
    if (profile && user?.role === 'candidate') {
      const nextStep = getNextStep();
      if (nextStep && nextStep !== currentStep) {
        setCurrentStep(nextStep);
      }
    }
  }, [profile, user?.role, getNextStep, currentStep]);

  // Auto-show onboarding modal for new candidates
  useEffect(() => {
    if (user?.role === 'candidate' && profile && !isOnboardingComplete()) {
      // Check if user just registered (profile exists but not complete)
      if (!profile.resumeUploaded && !profile.videoIntroRecorded && !showOnboardingModal) {
        // Small delay to ensure page is loaded
        const timer = setTimeout(() => {
          setShowOnboardingModal(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user?.role, profile, isOnboardingComplete, showOnboardingModal]);

  return (
    <OnboardingContext.Provider value={{
      showOnboardingModal,
      currentStep,
      isOnboardingComplete: isOnboardingComplete(),
      completedSteps,
      setShowOnboardingModal,
      setCurrentStep,
      markStepComplete,
      getNextStep,
      goToNextStep,
      skipOnboarding,
      restartOnboarding,
      getOnboardingProgress,
      getOnboardingRedirectPath
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};