"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  const loadingRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    // Check if we're already loading to prevent concurrent fetches
    if (loadingRef.current) {
      console.log('UserProfileContext: Already loading, skipping fetch');
      return;
    }
    
    loadingRef.current = true;
    
    console.log('UserProfileContext: Starting profile fetch for user:', userId);
    setLoading(true);
    setError(null);
    
    // Add a timeout to prevent getting stuck
    const timeoutId = setTimeout(() => {
      console.log('UserProfileContext: Fetch timeout, setting default profile');
      setLoading(false);
      loadingRef.current = false;
      setError('Profile fetch timed out');
    }, 10000); // 10 second timeout
    
    try {
      // Only fetch profile for candidates or if profile is not cached
      if (user?.role === 'candidate') {
        console.log('UserProfileContext: Fetching candidate profile from Firestore');
        const candidateDoc = await getDoc(doc(db, 'candidateProfiles', userId));
        
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
      
      // Only set error for non-permission errors
      if (!errorMessage.includes('permission') && !errorMessage.includes('Missing or insufficient permissions')) {
        setError(errorMessage);
        apiLogger.error('Failed to fetch user profile', { 
          userId, 
          error: errorMessage 
        });
      } else {
        // For permission errors, create a default profile
        if (user?.role === 'candidate') {
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
          apiLogger.info('Created default profile due to permission error', { userId });
        }
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user?.role]);

  const refreshProfile = useCallback(async () => {
    if (user?.uid) {
      await fetchProfile(user.uid);
    }
  }, [user?.uid]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Load profile when user changes
  useEffect(() => {
    if (user?.uid && user?.role) {
      console.log('UserProfileContext: Loading profile for user:', user.uid, 'role:', user.role);
      fetchProfile(user.uid);
    } else {
      console.log('UserProfileContext: No user or role, clearing profile');
      setProfile(null);
      setError(null);
      setLoading(false);
    }
  }, [user?.uid, user?.role]); // Remove fetchProfile from dependencies

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