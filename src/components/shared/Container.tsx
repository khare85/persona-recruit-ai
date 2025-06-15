
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

// This component might be simplified or removed if padding is handled by DashboardLayout or individual pages.
// For now, keeping its definition but usage might change.
export function Container({ children, className }: ContainerProps) {
  return (
    // Removed default padding as it will be handled by DashboardLayout for app pages
    // and can be added specifically for public pages if needed.
    <div className={cn('mx-auto w-full', className)}>
      {children}
    </div>
  );
}
