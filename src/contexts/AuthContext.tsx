

"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth } from '@/config/firebase';
import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { apiLogger } from '@/lib/logger';

export type UserRole = 'super_admin' | 'company_admin' | 'recruiter' | 'interviewer' | 'candidate';

export interface User extends FirebaseUser {
  role: UserRole;
  fullName?: string;
  companyId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<FirebaseUser>;
  signUp: (email: string, pass: string, firstName: string, lastName: string, role?: UserRole) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Process Firebase user and extract claims
  const processFirebaseUser = useCallback(async (firebaseUser: FirebaseUser): Promise<User> => {
    try {
      // Get token with custom claims (with retries for new users)
      let idTokenResult;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          idTokenResult = await firebaseUser.getIdTokenResult(retries > 0);
          
          // Check if we have the required claims
          if (idTokenResult.claims.role) {
            break;
          }
          
          // If no claims yet, wait and retry (for new users)
          if (retries < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries++;
          } else {
            // Fallback for users without claims
            break;
          }
        } catch (tokenError) {
          if (retries === maxRetries - 1) throw tokenError;
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!idTokenResult) {
        throw new Error('Failed to get ID token');
      }
      
      const role = (idTokenResult.claims.role as UserRole) || 'candidate';
      const companyId = idTokenResult.claims.companyId as string | undefined;
      const fullName = firebaseUser.displayName || '';
      
      const enhancedUser: User = {
        ...firebaseUser,
        role,
        fullName,
        companyId
      };
      
      apiLogger.info('User authenticated successfully', {
        userId: firebaseUser.uid,
        role,
        hasCompanyId: !!companyId,
        emailVerified: firebaseUser.emailVerified
      });
      
      return enhancedUser;
    } catch (error) {
      apiLogger.error('Failed to process Firebase user', {
        userId: firebaseUser.uid,
        error: String(error)
      });
      throw error;
    }
  }, []);

  // Auth state change handler
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      try {
        if (firebaseUser) {
          const enhancedUser = await processFirebaseUser(firebaseUser);
          setUser(enhancedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        apiLogger.error('Auth state change error', { error: String(error) });
        // Force sign out on error
        await firebaseSignOut(auth);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [processFirebaseUser]);

  // Token management
  const getToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    try {
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken(forceRefresh);
      }
      return null;
    } catch (error) {
      apiLogger.error('Failed to get auth token', { error: String(error) });
      return null;
    }
  }, []);

  // Refresh user data (useful after role changes)
  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      try {
        const refreshedUser = await processFirebaseUser(auth.currentUser);
        setUser(refreshedUser);
      } catch (error) {
        apiLogger.error('Failed to refresh user', { error: String(error) });
      }
    }
  }, [processFirebaseUser]);

  // Sign in
  const signIn = async (email: string, pass: string): Promise<FirebaseUser> => {
    setLoading(true);
    try {
      apiLogger.info('Sign in attempt', { email });
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      
      toast({ 
        title: "Welcome back!", 
        description: "You have been signed in successfully." 
      });
      
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      
      apiLogger.warn('Sign in failed', { 
        email, 
        errorCode: authError.code,
        errorMessage: authError.message 
      });
      
      // User-friendly error messages
      let errorMessage = authError.message;
      if (authError.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (authError.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (authError.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      toast({ 
        variant: "destructive", 
        title: "Sign In Failed", 
        description: errorMessage 
      });
      
      setLoading(false);
      throw authError;
    }
  };

  // Sign up
  const signUp = async (email: string, pass: string, firstName: string, lastName: string, role: UserRole = 'candidate'): Promise<FirebaseUser> => {
    setLoading(true);
    try {
      apiLogger.info('Sign up attempt', { email, role });
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      const fullName = `${firstName} ${lastName}`;
      await updateProfile(firebaseUser, { displayName: fullName });

      // Call registration API to create user document and set claims
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete registration');
      }

      apiLogger.info('User registered successfully', { 
        userId: firebaseUser.uid, 
        email, 
        role 
      });

      toast({ 
        title: "Account Created!", 
        description: "Your account has been created successfully!" 
      });
      
      return firebaseUser;
    } catch (error) {
      const authError = error as AuthError;
      
      apiLogger.error('Sign up failed', { 
        email, 
        role,
        errorCode: authError.code,
        errorMessage: authError.message 
      });
      
      // User-friendly error messages
      let errorMessage = authError.message;
      if (authError.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters long.';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      toast({ 
        variant: "destructive", 
        title: "Registration Failed", 
        description: errorMessage 
      });
      
      setLoading(false);
      throw authError;
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      
      apiLogger.info('User signed out', { userId: user?.uid });
      
      router.push('/auth');
      toast({ 
        title: "Signed Out", 
        description: "You have been successfully signed out." 
      });
    } catch (error) {
      const authError = error as AuthError;
      
      apiLogger.error('Sign out failed', { 
        userId: user?.uid,
        error: String(authError) 
      });
      
      toast({ 
        variant: "destructive", 
        title: "Sign Out Failed", 
        description: "There was an error signing you out. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      getToken,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
