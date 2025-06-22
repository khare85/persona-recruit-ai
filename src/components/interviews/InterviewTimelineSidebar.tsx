'use client';

import { CalendarDays, Building2, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface InterviewTimelineSidebarProps {
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

export function InterviewTimelineSidebar({ interviews, className }: InterviewTimelineSidebarProps) {
  // Sort interviews by date (most recent first)
  const sortedInterviews = [...interviews].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const upcomingCount = interviews.filter(i => i.status === 'Scheduled').length;
  const completedCount = interviews.filter(i => i.status === 'Completed').length;

  return (
    <Card className={cn("h-fit", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Interview History
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {upcomingCount} upcoming
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {completedCount} completed
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedInterviews.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No interview history
          </p>
        ) : (
          <>
            {sortedInterviews.slice(0, 5).map((interview, index) => {
              const config = statusConfig[interview.status];
              const StatusIcon = config.icon;
              const interviewDate = new Date(interview.date);
              const hasAnalysis = interview.status === 'Completed' && interview.analysisId;
              
              return (
                <div 
                  key={interview.id} 
                  className={cn(
                    "relative rounded-lg border p-3 transition-all hover:shadow-sm",
                    hasAnalysis && "cursor-pointer hover:border-primary/50"
                  )}
                >
                  {/* Timeline line - don't show for last item */}
                  {index < Math.min(sortedInterviews.length, 5) - 1 && (
                    <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-border -z-10" />
                  )}
                  
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className={cn(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border",
                      config.bgColor,
                      config.borderColor,
                      "flex-shrink-0"
                    )}>
                      <StatusIcon className={cn("h-4 w-4", config.color)} />
                    </div>
                    
                    {/* Interview Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm truncate">{interview.jobTitle}</h4>
                          <p className="text-xs text-muted-foreground truncate">{interview.companyName}</p>
                        </div>
                        <Badge variant={config.badge as any} className="text-xs flex-shrink-0">
                          {interview.status}
                        </Badge>
                      </div>
                      
                      <div className="mt-1 space-y-1">
                        <div className="text-xs text-muted-foreground">
                          {format(interviewDate, 'MMM d, yyyy')} • {format(interviewDate, 'h:mm a')}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {interview.type && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {interview.type === 'ai' ? 'AI' : 'Live'}
                            </Badge>
                          )}
                          {interview.duration && (
                            <span className="text-xs text-muted-foreground">
                              {interview.duration}min
                            </span>
                          )}
                        </div>
                        
                        {hasAnalysis && (
                          <Link 
                            href={`/interviews/analysis/${interview.analysisId}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 mt-1"
                          >
                            View Analysis
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {sortedInterviews.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                View All {sortedInterviews.length} Interviews
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}