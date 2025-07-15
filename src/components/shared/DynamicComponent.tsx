'use client';

import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

interface DynamicComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Loading...</span>
  </div>
);

/**
 * Wrapper component for dynamic imports with consistent loading states
 */
export function DynamicComponent({ children, fallback = <DefaultFallback /> }: DynamicComponentProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

/**
 * Helper function to create lazy-loaded components with consistent error boundaries
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return React.memo(function DynamicLazyComponent(props: React.ComponentProps<T>) {
    return (
      <DynamicComponent fallback={fallback}>
        <LazyComponent {...props} />
      </DynamicComponent>
    );
  });
}