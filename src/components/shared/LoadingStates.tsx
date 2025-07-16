"use client";

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Basic loading spinner
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );
};

// Full page loading state
export const PageLoading: React.FC<{
  message?: string;
  showSpinner?: boolean;
}> = ({ message = 'Loading...', showSpinner = true }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {showSpinner && <LoadingSpinner size="lg" />}
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

// Content loading state
export const ContentLoading: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'Loading content...', className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
};

// Button loading state
export const ButtonLoading: React.FC<{
  children: React.ReactNode;
  loading: boolean;
  loadingText?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ children, loading, loadingText, size = 'sm' }) => {
  if (!loading) return <>{children}</>;

  return (
    <>
      <LoadingSpinner size={size} className="mr-2" />
      {loadingText || children}
    </>
  );
};

// Table loading skeleton
export const TableLoading: React.FC<{
  rows?: number;
  columns?: number;
}> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-4">
      {/* Table header skeleton */}
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-10 mx-2" />
        ))}
      </div>
      
      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="grid" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 mx-2" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Card loading skeleton
export const CardLoading: React.FC<{
  count?: number;
  showHeader?: boolean;
  className?: string;
}> = ({ count = 1, showHeader = true, className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          {showHeader && (
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
          )}
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// List loading skeleton
export const ListLoading: React.FC<{
  items?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ items = 5, showAvatar = false, className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4">
          {showAvatar && <Skeleton className="h-12 w-12 rounded-full" />}
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Form loading skeleton
export const FormLoading: React.FC<{
  fields?: number;
  showSubmitButton?: boolean;
  className?: string;
}> = ({ fields = 4, showSubmitButton = true, className }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      
      {showSubmitButton && (
        <Skeleton className="h-10 w-32" />
      )}
    </div>
  );
};

// Dashboard loading skeleton
export const DashboardLoading: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CardLoading count={2} />
        </div>
        <div>
          <CardLoading count={1} />
        </div>
      </div>
    </div>
  );
};

// Data loading hook with states
export const useLoadingState = <T,>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = []
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, deps);

  React.useEffect(() => {
    execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    retry: execute,
    setData
  };
};

// Loading wrapper component
export const LoadingWrapper: React.FC<{
  loading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  retry?: () => void;
}> = ({ 
  loading, 
  error, 
  children, 
  fallback = <ContentLoading />, 
  errorFallback,
  retry 
}) => {
  if (loading) {
    return <>{fallback}</>;
  }

  if (error) {
    if (errorFallback) {
      return <>{errorFallback}</>;
    }
    
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Error: {error.message}</p>
        {retry && (
          <button 
            onClick={retry}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};