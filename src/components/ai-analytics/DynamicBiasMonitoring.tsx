'use client';

import { createLazyComponent } from '@/components/shared/DynamicComponent';
import { Skeleton } from '@/components/ui/skeleton';

const BiasMonitoringFallback = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
);

export const DynamicBiasMonitoring = createLazyComponent(
  () => import('./BiasMonitoring'),
  <BiasMonitoringFallback />
);