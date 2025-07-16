"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from './AuthContext';
import { apiLogger } from '@/lib/logger';

export interface UserProfile {
  profileComplete: boolean;
  onboardingStep: 'resume' | 'video' | 'complete';
  resumeUploaded: boolean;
  videoIntroRecorded: boolean;
  currentTitle?: string;
  location?: string;
  skills?: string[];
  summary?: string;
  phone?: string;
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
  };
  availability?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
}

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    if (loading) return; // Prevent concurrent fetches
    
    setLoading(true);
    setError(null);
    
    try {
      // Only fetch profile for candidates or if profile is not cached
      if (user?.role === 'candidate') {
        const candidateDoc = await getDoc(doc(db, 'candidates', userId));
        
        if (candidateDoc.exists()) {
          const candidateData = candidateDoc.data();
          
          const profileData: UserProfile = {
            profileComplete: candidateData.profileComplete || false,
            resumeUploaded: candidateData.resumeUploaded || false,
            videoIntroRecorded: candidateData.videoIntroRecorded || false,
            onboardingStep: candidateData.resumeUploaded && candidateData.videoIntroRecorded 
              ? 'complete' 
              : candidateData.resumeUploaded 
                ? 'video' 
                : 'resume',
            currentTitle: candidateData.currentTitle || '',
            location: candidateData.location || '',
            skills: candidateData.skills || [],
            summary: candidateData.summary || '',
            phone: candidateData.phone || '',
            expectedSalary: candidateData.expectedSalary || null,
            availability: candidateData.availability || 'immediate',
            portfolioUrl: candidateData.portfolioUrl || '',
            linkedinUrl: candidateData.linkedinUrl || ''
          };
          
          setProfile(profileData);
          apiLogger.debug('Profile loaded successfully', { userId });
        } else {
          // Create default profile for new candidates
          const defaultProfile: UserProfile = {
            profileComplete: false,
            onboardingStep: 'resume',
            resumeUploaded: false,
            videoIntroRecorded: false,
            currentTitle: '',
            location: '',
            skills: [],
            summary: '',
            phone: '',
            availability: 'immediate',
            portfolioUrl: '',
            linkedinUrl: ''
          };
          setProfile(defaultProfile);
          apiLogger.info('Created default profile for new candidate', { userId });
        }
      } else {
        // For non-candidates, set a minimal profile
        setProfile({
          profileComplete: true,
          onboardingStep: 'complete',
          resumeUploaded: false,
          videoIntroRecorded: false
        });
      }
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Failed to load profile';
      setError(errorMessage);
      apiLogger.error('Failed to fetch user profile', { 
        userId, 
        error: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  }, [user?.role, loading]);

  const refreshProfile = useCallback(async () => {
    if (user?.uid) {
      await fetchProfile(user.uid);
    }
  }, [user?.uid, fetchProfile]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Load profile when user changes
  useEffect(() => {
    if (user?.uid) {
      fetchProfile(user.uid);
    } else {
      setProfile(null);
      setError(null);
    }
  }, [user?.uid, fetchProfile]);

  return (
    <UserProfileContext.Provider value={{ 
      profile, 
      loading, 
      error, 
      refreshProfile, 
      updateProfile 
    }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = (): UserProfileContextType => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};