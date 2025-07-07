import { useState, useEffect } from 'react';
import { useAuth as useFirebaseAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  emailVerified: boolean;
}

export function useAuth() {
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (firebaseLoading) {
      setLoading(true);
      return;
    }

    if (!firebaseUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Convert Firebase user to our User interface
    // Note: Additional user data (role, status, etc.) should be fetched from Firestore
    const convertedUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      firstName: firebaseUser.displayName?.split(' ')[0] || '',
      lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
      role: firebaseUser.role || 'candidate', // From custom claims
      status: 'active',
      emailVerified: firebaseUser.emailVerified
    };

    setUser(convertedUser);
    setLoading(false);
  }, [firebaseUser, firebaseLoading]);

  const logout = () => {
    // Firebase Auth logout is handled by AuthContext
    setUser(null);
  };

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user
  };
}