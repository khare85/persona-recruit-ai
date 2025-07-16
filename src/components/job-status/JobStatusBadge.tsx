'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface JobStatusBadgeProps {
  status: 'draft' | 'active' | 'paused' | 'closed' | 'archived';
  className?: string;
  showIcon?: boolean;
}

const statusConfig = {
  draft: {
    label: 'Draft',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: '📝'
  },
  active: {
    label: 'Active',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-300',
    icon: '🟢'
  },
  paused: {
    label: 'Paused',
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: '⏸️'
  },
  closed: {
    label: 'Closed',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-300',
    icon: '🔴'
  },
  archived: {
    label: 'Archived',
    variant: 'outline' as const,
    className: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: '📦'
  }
};

export function JobStatusBadge({ status, className, showIcon = false }: JobStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}