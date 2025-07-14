

"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, db } from '@/config/firebase';
import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
  signUp: (email: string, pass: string, fullName?: string, role?: UserRole) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Force a token refresh to get the latest custom claims, especially after signup.
          const idTokenResult = await firebaseUser.getIdTokenResult(true); 
          const role = (idTokenResult.claims.role as UserRole) || 'candidate'; // Default to candidate if no role claim
          const companyId = (idTokenResult.claims.companyId as string) || undefined;
          
          let fullName = firebaseUser.displayName || '';
          
          // Fallback to Firestore if claims are not immediately available or name is missing
          if (!fullName) {
              try {
                  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                  if (userDoc.exists()) {
                      const userData = userDoc.data();
                      if (!fullName) {
                        fullName = userData.fullName || `${userData.firstName} ${userData.lastName}`.trim() || '';
                      }
                  }
              } catch (firestoreError) {
                  console.warn("Could not read user document from Firestore:", firestoreError);
              }
          }
          
          setUser({
            ...firebaseUser,
            role,
            fullName,
            companyId
          } as User);
        } catch (error) {
          console.error("Error fetching user data/claims:", error);
          await firebaseSignOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      if (auth && auth.currentUser) {
        return auth.currentUser.getIdToken(true); // Force refresh
      }
      console.warn('getToken: auth or currentUser is null', { 
        authExists: !!auth, 
        currentUserExists: !!auth?.currentUser,
        userState: !!user 
      });
      return null;
    } catch (error) {
      console.error('getToken error:', error);
      return null;
    }
  }, [user]);

  const signIn = async (email: string, pass: string): Promise<FirebaseUser> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      // User state will be updated by onAuthStateChanged after token refresh
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      toast({ variant: "destructive", title: "Login Failed", description: authError.message });
      setLoading(false);
      throw authError;
    }
  };

  const signUp = async (email: string, pass: string, fullName?: string, role: UserRole = 'candidate'): Promise<FirebaseUser> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      if (fullName) {
        await updateProfile(firebaseUser, { displayName: fullName });
      }

      // NOTE: In a production Firebase environment, you should use a Cloud Function
      // triggered by `functions.auth.user().onCreate()` to create the user document
      // in Firestore and set their custom claims for their role.
      // This is more secure than relying on a client-side call after signup.
      // For this project, we're assuming this trigger exists to set the role.

      // Send verification email - can be re-enabled later
      // await sendEmailVerification(firebaseUser);
      toast({ title: "Account Created", description: "Your account has been created successfully!" });

      return firebaseUser;
    } catch (error) {
      const authError = error as AuthError;
      toast({ variant: "destructive", title: "Sign Up Failed", description: authError.message });
      setLoading(false);
      throw authError;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // User state will be cleared by onAuthStateChanged
      router.push('/auth');
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error) {
      const authError = error as AuthError;
      toast({ variant: "destructive", title: "Sign Out Failed", description: authError.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, getToken }}>
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
