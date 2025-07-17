/**
 * Modern Design System - Fixed Version
 * Clean, minimal, enterprise-grade UI components
 */

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { LucideIcon } from 'lucide-react';

// =================================
// MODERN CARD COMPONENT
// =================================

const modernCardVariants = cva(
  "bg-white border border-neutral-200 transition-all duration-200 hover:shadow-md",
  {
    variants: {
      variant: {
        default: "rounded-xl shadow-sm",
        elevated: "rounded-xl shadow-lg",
        bordered: "rounded-xl border-2",
        ghost: "rounded-xl border-0 shadow-none bg-transparent"
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8"
      },
      interactive: {
        true: "cursor-pointer hover:shadow-lg hover:border-primary-200 hover:bg-neutral-50/50",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      interactive: false
    }
  }
);

export interface ModernCardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modernCardVariants> {
  children: React.ReactNode;
}

export const ModernCard = ({ className, variant, padding, interactive, children, ...props }: ModernCardProps) => {
  return (
    <div
      className={cn(modernCardVariants({ variant, padding, interactive }), className)}
      {...props}
    >
      {children}
    </div>
  );
};

// =================================
// MODERN METRIC CARD
// =================================

interface ModernMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
}

export const ModernMetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'primary',
  className 
}: ModernMetricCardProps) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    warning: 'text-warning-600 bg-warning-50',
    error: 'text-error-600 bg-error-50',
    neutral: 'text-neutral-600 bg-neutral-50'
  };

  return (
    <ModernCard className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-neutral-500">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-medium mt-2 px-2 py-1 rounded-full",
              trend.isPositive ? "text-success-700 bg-success-100" : "text-error-700 bg-error-100"
            )}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </ModernCard>
  );
};

// =================================
// MODERN BUTTON COMPONENT
// =================================

const modernButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm",
        secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-200",
        ghost: "bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
        destructive: "bg-error-600 text-white hover:bg-error-700 shadow-sm"
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-2.5 text-base",
        xl: "px-8 py-3 text-lg"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ModernButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof modernButtonVariants> {
  children: React.ReactNode;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  loading?: boolean;
}

export const ModernButton = ({ 
  className, 
  variant, 
  size, 
  children, 
  leftIcon: LeftIcon, 
  rightIcon: RightIcon, 
  loading, 
  disabled,
  ...props 
}: ModernButtonProps) => {
  return (
    <button
      className={cn(modernButtonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        LeftIcon && <LeftIcon className="w-4 h-4" />
      )}
      {children}
      {RightIcon && !loading && <RightIcon className="w-4 h-4" />}
    </button>
  );
};

// =================================
// MODERN BADGE COMPONENT
// =================================

const modernBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors",
  {
    variants: {
      variant: {
        success: "bg-success-100 text-success-800",
        warning: "bg-warning-100 text-warning-800",
        error: "bg-error-100 text-error-800",
        info: "bg-primary-100 text-primary-800",
        neutral: "bg-neutral-100 text-neutral-800"
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-4 py-1.5 text-sm"
      }
    },
    defaultVariants: {
      variant: "neutral",
      size: "md"
    }
  }
);

export interface ModernBadgeProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modernBadgeVariants> {
  children: React.ReactNode;
  icon?: LucideIcon;
}

export const ModernBadge = ({ className, variant, size, children, icon: Icon, ...props }: ModernBadgeProps) => {
  return (
    <div className={cn(modernBadgeVariants({ variant, size }), className)} {...props}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </div>
  );
};

// =================================
// MODERN LAYOUT COMPONENTS
// =================================

export const ModernContainer = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", className)} {...props}>
      {children}
    </div>
  );
};

export const ModernGrid = ({ children, className, cols = 3, ...props }: React.HTMLAttributes<HTMLDivElement> & { cols?: number }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  return (
    <div className={cn("grid gap-6", gridCols[cols as keyof typeof gridCols], className)} {...props}>
      {children}
    </div>
  );
};

// =================================
// MODERN HEADER COMPONENT
// =================================

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const ModernHeader = ({ title, subtitle, actions, className }: ModernHeaderProps) => {
  return (
    <div className={cn("flex items-center justify-between mb-8", className)}>
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
        {subtitle && (
          <p className="text-neutral-600 mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

// =================================
// MODERN EMPTY STATE
// =================================

interface ModernEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const ModernEmptyState = ({ icon: Icon, title, description, action, className }: ModernEmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="p-4 bg-neutral-100 rounded-full mb-4">
        <Icon className="w-8 h-8 text-neutral-600" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600 mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );
};

// =================================
// MODERN LOADING STATES
// =================================

export const ModernSkeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("animate-pulse rounded-lg bg-neutral-200", className)} {...props} />
  );
};

export const ModernSkeletonCard = () => {
  return (
    <ModernCard>
      <div className="space-y-4">
        <ModernSkeleton className="h-4 w-3/4" />
        <ModernSkeleton className="h-8 w-1/2" />
        <ModernSkeleton className="h-3 w-full" />
        <ModernSkeleton className="h-3 w-2/3" />
      </div>
    </ModernCard>
  );
};

// =================================
// EXPORT ALL COMPONENTS
// =================================

export {
  modernCardVariants,
  modernBadgeVariants,
  modernButtonVariants
};