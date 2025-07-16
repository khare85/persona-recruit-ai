'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useJobStatus } from '@/hooks/useJobStatus';
import { JobStatusBadge } from './JobStatusBadge';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { format } from 'date-fns';
import { Clock, User } from 'lucide-react';

interface StatusTimelineProps {
  type: 'job' | 'application';
  id: string;
  title?: string;
}

interface StatusHistoryItem {
  id?: string;
  jobId?: string;
  applicationId?: string;
  previousStatus: string;
  newStatus: string;
  updatedBy: string;
  reason?: string;
  timestamp: number;
}

export function StatusTimeline({ type, id, title }: StatusTimelineProps) {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { getJobStatusHistory, getApplicationStatusHistory } = useJobStatus();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = type === 'job' 
          ? await getJobStatusHistory(id)
          : await getApplicationStatusHistory(id);
        
        setHistory(data || []);
      } catch (error) {
        console.error(`Error fetching ${type} status history:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [type, id, getJobStatusHistory, getApplicationStatusHistory]);

  const StatusBadgeComponent = type === 'job' ? JobStatusBadge : ApplicationStatusBadge;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Status Timeline
          {title && <span className="text-sm text-muted-foreground">- {title}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No status changes recorded yet
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <div key={index} className="relative">
                {index < history.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-8 bg-border" />
                )}
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadgeComponent 
                        status={item.previousStatus as any} 
                        className="text-xs" 
                      />
                      <span className="text-muted-foreground">→</span>
                      <StatusBadgeComponent 
                        status={item.newStatus as any} 
                        className="text-xs" 
                      />
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-1">
                      {format(new Date(item.timestamp), 'MMM d, yyyy HH:mm')}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Updated by {item.updatedBy === 'system' ? 'System' : item.updatedBy}
                      </span>
                    </div>
                    
                    {item.reason && (
                      <div className="bg-muted/50 p-2 rounded text-sm mt-2">
                        <strong>Reason:</strong> {item.reason}
                      </div>
                    )}
                  </div>
                </div>
                
                {index < history.length - 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}