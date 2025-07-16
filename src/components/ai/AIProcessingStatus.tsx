'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAIProcessing } from '@/hooks/useAIProcessing';
import { AIProcessingStatus } from '@/services/aiProcessingService';
import { 
  Brain, 
  FileText, 
  Video, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const processingIcons = {
  resume_processing: FileText,
  video_analysis: Video,
  job_matching: Users,
  interview_analysis: Video,
  bias_detection: AlertCircle,
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const statusIcons = {
  pending: Clock,
  in_progress: Brain,
  completed: CheckCircle,
  failed: XCircle,
};

interface AIProcessingStatusProps {
  showHistory?: boolean;
  className?: string;
}

export function AIProcessingStatus({ showHistory = false, className }: AIProcessingStatusProps) {
  const { 
    activeProcessing, 
    processingHistory, 
    isProcessing, 
    totalProgress, 
    cancelProcessing,
    loadProcessingHistory
  } = useAIProcessing();

  const ProcessingItem = ({ processing }: { processing: AIProcessingStatus }) => {
    const Icon = processingIcons[processing.type] || Brain;
    const StatusIcon = statusIcons[processing.status];
    const isActive = processing.status === 'pending' || processing.status === 'in_progress';

    return (
      <div className="flex items-start gap-3 p-3 rounded-lg border">
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          statusColors[processing.status]
        )}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm capitalize">
              {processing.type.replace('_', ' ')}
            </h4>
            <Badge variant="outline" className="text-xs">
              <StatusIcon className="h-3 w-3 mr-1" />
              {processing.status}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground mb-2">
            {processing.stage.replace('_', ' ')}
          </p>
          
          {isActive && (
            <div className="mb-2">
              <Progress value={processing.progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{processing.progress}%</span>
                <span>{processing.stage}</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {format(processing.startedAt, 'MMM d, HH:mm')}
              {processing.completedAt && (
                <span> - {format(processing.completedAt, 'HH:mm')}</span>
              )}
            </span>
            
            {isActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => cancelProcessing(processing.id)}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            )}
          </div>
          
          {processing.error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {processing.error}
            </div>
          )}
        </div>
      </div>
    );
  };

  const activeProcessingArray = Array.from(activeProcessing.values());
  const hasActiveProcessing = activeProcessingArray.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Processing
          {hasActiveProcessing && (
            <Badge variant="outline" className="ml-auto">
              {activeProcessingArray.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Active Processing */}
        {hasActiveProcessing && (
          <div className="mb-4">
            <h3 className="font-medium text-sm mb-3">Active Processing</h3>
            <div className="space-y-3">
              {activeProcessingArray.map(processing => (
                <ProcessingItem key={processing.id} processing={processing} />
              ))}
            </div>
            
            {isProcessing && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-blue-600 animate-pulse" />
                  <span className="text-sm font-medium text-blue-900">
                    AI Processing in Progress
                  </span>
                </div>
                <Progress value={totalProgress} className="h-2" />
                <p className="text-xs text-blue-700 mt-1">
                  Overall progress: {Math.round(totalProgress)}%
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Processing History */}
        {showHistory && (
          <>
            {hasActiveProcessing && <Separator className="my-4" />}
            
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">Recent Processing</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadProcessingHistory}
                className="text-xs"
              >
                Refresh
              </Button>
            </div>
            
            {processingHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent AI processing</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {processingHistory.map(processing => (
                  <ProcessingItem key={processing.id} processing={processing} />
                ))}
              </div>
            )}
          </>
        )}
        
        {/* No Processing */}
        {!hasActiveProcessing && !showHistory && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active AI processing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}