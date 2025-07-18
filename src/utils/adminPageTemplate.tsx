
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';

interface UseAdminDataOptions {
  endpoint: string;
  dependencies?: any[];
}

export function useAdminData<T>({ endpoint, dependencies = [] }: UseAdminDataOptions) {
  const { user, loading: authLoading } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await authenticatedFetch(endpoint);
      setData(result.data || result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, authLoading, user, ...(dependencies || [])]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

interface AdminPageWrapperProps {
  children: React.ReactNode;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export function AdminPageWrapper({
  children,
  title,
  description,
  icon: Icon,
  isLoading,
  error,
  onRefresh
}: AdminPageWrapperProps) {
  if (isLoading) {
    return (
      <AdminLayout>
        <Container className="py-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </Container>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Container className="py-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to Load Data</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            {onRefresh && (
              <Button onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container className="py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <Icon className="mr-3 h-8 w-8 text-primary" />
                {title}
              </h1>
              <p className="text-muted-foreground mt-1">
                {description}
              </p>
            </div>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            )}
          </div>
        </div>
        {children}
      </Container>
    </AdminLayout>
  );
}
