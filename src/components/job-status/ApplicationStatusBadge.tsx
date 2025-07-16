'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ApplicationStatusBadgeProps {
  status: 'submitted' | 'under_review' | 'shortlisted' | 'interview_scheduled' | 'rejected' | 'withdrawn' | 'hired';
  className?: string;
  showIcon?: boolean;
}

const statusConfig = {
  submitted: {
    label: 'Submitted',
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '📤'
  },
  under_review: {
    label: 'Under Review',
    variant: 'default' as const,
    className: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '👁️'
  },
  shortlisted: {
    label: 'Shortlisted',
    variant: 'default' as const,
    className: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: '⭐'
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    variant: 'default' as const,
    className: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: '📅'
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-300',
    icon: '❌'
  },
  withdrawn: {
    label: 'Withdrawn',
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-600 border-gray-300',
    icon: '↩️'
  },
  hired: {
    label: 'Hired',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-300',
    icon: '🎉'
  }
};

export function ApplicationStatusBadge({ status, className, showIcon = false }: ApplicationStatusBadgeProps) {
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