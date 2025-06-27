
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  const authenticatedFetch = useCallback(async (url: string, options: FetchOptions = {}) => {
    const token = await getToken();
    if (!token) {
      throw new Error('User not authenticated. Please log in.');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle responses with no content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text().then(text => text ? JSON.parse(text) : {});

  }, [getToken]);

  return authenticatedFetch;
}
