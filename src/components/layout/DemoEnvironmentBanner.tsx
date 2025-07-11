'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { isDemoEnvironment } from '@/config/firebase';

export function DemoEnvironmentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  useEffect(() => {
    // Check if demo banner should be shown
    const showBanner = 
      isDemoEnvironment && 
      process.env.NEXT_PUBLIC_SHOW_DEMO_BANNER === 'true' &&
      !sessionStorage.getItem('demo-banner-dismissed');
    
    setIsVisible(showBanner && !isDismissed);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('demo-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2 bg-orange-50 dark:bg-orange-950/20 border-b border-orange-200 dark:border-orange-800">
      <Alert className="max-w-7xl mx-auto relative pr-10 bg-orange-100 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700">
        <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 border-orange-400 dark:border-orange-600">
              DEMO ENVIRONMENT
            </Badge>
            <span className="text-sm">
              You are using the sales demo environment. Data here is for demonstration purposes only and may be reset periodically.
            </span>
          </div>
        </AlertDescription>
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-md hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
          aria-label="Dismiss demo banner"
        >
          <X className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </button>
      </Alert>
    </div>
  );
}