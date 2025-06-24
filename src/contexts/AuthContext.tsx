
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/config/firebase';
import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // Corrected import

export type UserRole = 'super_admin' | 'company_admin' | 'recruiter' | 'interviewer' | 'candidate';

interface User extends FirebaseUser {
  role?: UserRole;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, fullName?: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUserRole: (uid: string) => Promise<UserRole | null>;
  updateUserProfile: (uid: string, data: { fullName?: string; role?: UserRole }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const fetchUserRole = async (uid: string): Promise<UserRole | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data()?.role || 'candidate';
      }
      return null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  const updateUserProfile = async (uid: string, data: { fullName?: string; role?: UserRole }) => {
    try {
      await setDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: new Date(),
        createdAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRole = await fetchUserRole(firebaseUser.uid);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        setUser({
          ...firebaseUser,
          role: userRole || 'candidate',
          fullName: userData?.fullName || firebaseUser.displayName || ''
        } as User); 
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // User state will be updated by onAuthStateChanged
      // Redirection can happen in the component or here
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign in error:", authError);
      toast({ variant: "destructive", title: "Login Failed", description: authError.message || "Invalid credentials." });
      setLoading(false);
      throw authError; // Re-throw to handle in component
    }
  };

  const signUp = async (email: string, pass: string, fullName?: string, role: UserRole = 'candidate') => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      
      // Save user profile to Firestore
      await updateUserProfile(user.uid, { fullName, role });
      
      toast({ title: "Account Created", description: "Your account has been created successfully!" });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign up error:", authError);
      toast({ variant: "destructive", title: "Sign Up Failed", description: authError.message || "Could not create account." });
      setLoading(false);
      throw authError;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      // Redirect to home or auth page after sign out
      router.push('/'); 
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error) {
      const authError = error as AuthError;
      console.error("Sign out error:", authError);
      toast({ variant: "destructive", title: "Sign Out Failed", description: authError.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, fetchUserRole, updateUserProfile }}>
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
