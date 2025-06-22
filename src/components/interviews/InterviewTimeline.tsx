'use client';

import { CalendarDays, Building2, Briefcase, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface InterviewTimelineItem {
  id: string;
  date: string;
  jobTitle: string;
  companyName: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Pending';
  analysisId?: string;
  type?: 'ai' | 'realtime';
  duration?: number;
}

interface InterviewTimelineProps {
  interviews: InterviewTimelineItem[];
  className?: string;
}

const statusConfig = {
  Scheduled: {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badge: 'default'
  },
  Completed: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badge: 'secondary'
  },
  Cancelled: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badge: 'destructive'
  },
  Pending: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badge: 'outline'
  }
} as const;

export function InterviewTimeline({ interviews, className }: InterviewTimelineProps) {
  // Sort interviews by date (most recent first)
  const sortedInterviews = [...interviews].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (interviews.length === 0) {
    return (
      <Card className={cn("p-6", className)}>
        <p className="text-center text-muted-foreground">No interview history available</p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {sortedInterviews.map((interview, index) => {
        const config = statusConfig[interview.status];
        const StatusIcon = config.icon;
        const interviewDate = new Date(interview.date);
        const isPastInterview = interviewDate < new Date() && interview.status !== 'Cancelled';
        const hasAnalysis = interview.status === 'Completed' && interview.analysisId;
        
        return (
          <div key={interview.id} className="relative">
            {/* Timeline line - don't show for last item */}
            {index < sortedInterviews.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
            )}
            
            <Card 
              className={cn(
                "transition-all hover:shadow-md",
                hasAnalysis && "cursor-pointer hover:border-primary/50"
              )}
            >
              <CardContent className="p-0">
                <div className="flex items-start gap-4 p-4">
                  {/* Status Icon */}
                  <div className={cn(
                    "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2",
                    config.bgColor,
                    config.borderColor
                  )}>
                    <StatusIcon className={cn("h-6 w-6", config.color)} />
                  </div>
                  
                  {/* Interview Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{interview.jobTitle}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{interview.companyName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.badge as any}>
                          {interview.status}
                        </Badge>
                        {interview.type && (
                          <Badge variant="outline" className="text-xs">
                            {interview.type === 'ai' ? 'AI' : 'Real-time'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        <span>{format(interviewDate, 'PPP')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{format(interviewDate, 'p')}</span>
                      </div>
                      {interview.duration && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{interview.duration} min</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    {hasAnalysis && (
                      <Link 
                        href={`/interviews/analysis/${interview.analysisId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 mt-2"
                      >
                        View Interview Analysis
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}