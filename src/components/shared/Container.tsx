
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    // Added default padding for consistent spacing on all pages using this container.
    // DashboardLayout's main content area will rely on pages using this Container.
    <div className={cn('mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8', className)}>
      {children}
    </div>
  );
}
