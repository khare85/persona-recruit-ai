"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiLogger } from '@/lib/logger';

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    reset: () => void;
    errorId: string;
  }>;
  routeName?: string;
}

class RouteErrorBoundaryClass extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
    const errorId = `route-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log error details
    apiLogger.error('Route error boundary caught error', {
      errorId: this.state.errorId,
      routeName: this.props.routeName,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // This would integrate with Sentry, LogRocket, etc.
      console.error('Route Error Boundary:', {
        error,
        errorInfo,
        routeName: this.props.routeName
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            reset={this.handleReset}
            errorId={this.state.errorId}
          />
        );
      }

      // Default error UI
      return (
        <DefaultRouteErrorFallback
          error={this.state.error}
          reset={this.handleReset}
          errorId={this.state.errorId}
          routeName={this.props.routeName}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultRouteErrorFallback: React.FC<{
  error: Error;
  reset: () => void;
  errorId: string;
  routeName?: string;
}> = ({ error, reset, errorId, routeName }) => {
  const router = useRouter();

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">
            {routeName ? `Error in ${routeName}` : 'Page Error'}
          </CardTitle>
          <CardDescription>
            We encountered an unexpected error. Our team has been notified.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error details for development */}
          {isDevelopment && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Error Details (Development Only)</h4>
              <p className="text-sm font-mono text-muted-foreground mb-2">
                <strong>Message:</strong> {error.message}
              </p>
              <p className="text-sm font-mono text-muted-foreground">
                <strong>Error ID:</strong> {errorId}
              </p>
              {error.stack && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs bg-background p-2 rounded border overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Production error info */}
          {!isDevelopment && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Error ID:</strong> {errorId}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Please include this ID when reporting the issue.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={reset} variant="default" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              onClick={() => router.push('/')} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
            
            <Button 
              onClick={() => router.back()} 
              variant="ghost"
              className="flex items-center gap-2"
            >
              Go Back
            </Button>
          </div>

          {/* Support contact */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              If this problem persists, please{' '}
              <a 
                href="mailto:support@example.com" 
                className="text-primary hover:underline"
              >
                contact support
              </a>
              {' '}and include the error ID above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Functional wrapper component
export const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = (props) => {
  return <RouteErrorBoundaryClass {...props} />;
};

// Hook for triggering error boundaries in functional components
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    setError(errorObj);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError };
};