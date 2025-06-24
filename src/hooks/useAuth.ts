import { useState, useEffect } from 'react';

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    // Decode JWT token to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check if token is expired
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('auth-token');
        setLoading(false);
        return;
      }

      // Set user from token payload
      setUser({
        id: payload.userId,
        email: payload.email,
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        role: payload.role,
        status: payload.status || 'active',
        emailVerified: payload.emailVerified || false
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      localStorage.removeItem('auth-token');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('auth-token');
    setUser(null);
  };

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user
  };
}