"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { apiLogger } from '@/lib/logger';

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorType: 'network' | 'api' | 'timeout' | 'auth' | 'unknown';
  retryCount: number;
  errorId: string;
}

interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    errorType: AsyncErrorBoundaryState['errorType'];
    retry: () => void;
    canRetry: boolean;
    errorId: string;
  }>;
  maxRetries?: number;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  context?: string;
}

class AsyncErrorBoundaryClass extends React.Component<
  AsyncErrorBoundaryProps,
  AsyncErrorBoundaryState
> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: 'unknown',
      retryCount: 0,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    const errorId = `async-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const errorType = AsyncErrorBoundaryClass.categorizeError(error);
    
    return {
      hasError: true,
      error,
      errorType,
      errorId
    };
  }

  static categorizeError(error: Error): AsyncErrorBoundaryState['errorType'] {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Network errors
    if (message.includes('fetch') || message.includes('network') || name.includes('network')) {
      return 'network';
    }

    // API errors
    if (message.includes('api') || message.includes('server') || message.includes('http')) {
      return 'api';
    }

    // Timeout errors
    if (message.includes('timeout') || name.includes('timeout')) {
      return 'timeout';
    }

    // Authentication errors
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('token')) {
      return 'auth';
    }

    return 'unknown';
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { context, onError } = this.props;

    // Log error details
    apiLogger.error('Async error boundary caught error', {
      errorId: this.state.errorId,
      context,
      errorType: this.state.errorType,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to error tracking in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Async Error Boundary:', {
        error,
        errorInfo,
        context,
        errorType: this.state.errorType
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      apiLogger.warn('Max retries exceeded', {
        errorId: this.state.errorId,
        retryCount: this.state.retryCount,
        maxRetries
      });
      return;
    }

    apiLogger.info('Retrying async operation', {
      errorId: this.state.errorId,
      retryCount: this.state.retryCount + 1,
      errorType: this.state.errorType
    });

    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleAutoRetry = (delay: number = 1000) => {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    this.retryTimer = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { maxRetries = 3 } = this.props;
      const canRetry = this.state.retryCount < maxRetries;

      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorType={this.state.errorType}
            retry={this.handleRetry}
            canRetry={canRetry}
            errorId={this.state.errorId}
          />
        );
      }

      // Default error UI
      return (
        <DefaultAsyncErrorFallback
          error={this.state.error}
          errorType={this.state.errorType}
          retry={this.handleRetry}
          canRetry={canRetry}
          errorId={this.state.errorId}
          retryCount={this.state.retryCount}
          maxRetries={maxRetries}
          context={this.props.context}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
const DefaultAsyncErrorFallback: React.FC<{
  error: Error;
  errorType: AsyncErrorBoundaryState['errorType'];
  retry: () => void;
  canRetry: boolean;
  errorId: string;
  retryCount: number;
  maxRetries: number;
  context?: string;
}> = ({ 
  error, 
  errorType, 
  retry, 
  canRetry, 
  errorId, 
  retryCount, 
  maxRetries,
  context 
}) => {
  const getErrorConfig = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: WifiOff,
          title: 'Connection Problem',
          description: 'Unable to connect to our servers. Please check your internet connection.',
          actionText: 'Try Again',
          variant: 'destructive' as const
        };
      case 'api':
        return {
          icon: AlertCircle,
          title: 'Server Error',
          description: 'Our servers are experiencing issues. Please try again in a moment.',
          actionText: 'Retry',
          variant: 'destructive' as const
        };
      case 'timeout':
        return {
          icon: AlertCircle,
          title: 'Request Timeout',
          description: 'The request took too long to complete. Please try again.',
          actionText: 'Retry',
          variant: 'secondary' as const
        };
      case 'auth':
        return {
          icon: AlertCircle,
          title: 'Authentication Error',
          description: 'Your session has expired. Please sign in again.',
          actionText: 'Sign In',
          variant: 'destructive' as const
        };
      default:
        return {
          icon: AlertCircle,
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred. Please try again.',
          actionText: 'Try Again',
          variant: 'destructive' as const
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Icon className="h-12 w-12 text-destructive" />
        </div>
        <CardTitle className="text-lg">
          {config.title}
          {context && ` - ${context}`}
        </CardTitle>
        <CardDescription>
          {config.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Development error details */}
        {isDevelopment && (
          <div className="bg-muted p-3 rounded text-xs">
            <p><strong>Error:</strong> {error.message}</p>
            <p><strong>Type:</strong> {errorType}</p>
            <p><strong>ID:</strong> {errorId}</p>
          </div>
        )}

        {/* Retry information */}
        {retryCount > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Attempt {retryCount} of {maxRetries}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {canRetry ? (
            <Button 
              onClick={retry} 
              variant={config.variant}
              className="w-full flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {config.actionText}
            </Button>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              Maximum retry attempts reached. Please refresh the page.
            </div>
          )}
          
          {errorType === 'auth' && (
            <Button 
              onClick={() => window.location.href = '/auth'}
              variant="outline"
              className="w-full"
            >
              Go to Sign In
            </Button>
          )}
        </div>

        {/* Network status indicator */}
        {errorType === 'network' && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {navigator.onLine ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span>Internet connection detected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span>No internet connection</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Functional wrapper component
export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = (props) => {
  return <AsyncErrorBoundaryClass {...props} />;
};

// Hook for handling async errors in components
export const useAsyncError = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const captureAsyncError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    setError(errorObj);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureAsyncError };
};