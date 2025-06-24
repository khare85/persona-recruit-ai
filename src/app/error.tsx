'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-destructive/10 via-background to-muted/20">
      <div className="flex flex-col items-center space-y-6 text-center max-w-md">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Something went wrong!
          </h2>
          <p className="text-muted-foreground mb-4">
            AI Talent Stream encountered an unexpected error during startup or navigation.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mb-4">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <Button onClick={reset} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}