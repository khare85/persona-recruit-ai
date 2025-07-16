'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useJobStatus } from '@/hooks/useJobStatus';
import { JobStatusBadge } from './JobStatusBadge';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface JobStatusUpdaterProps {
  jobId: string;
  currentStatus: 'draft' | 'active' | 'paused' | 'closed' | 'archived';
  onStatusUpdate?: (newStatus: string) => void;
}

const statusTransitions = {
  draft: ['active', 'archived'],
  active: ['paused', 'closed', 'archived'],
  paused: ['active', 'closed', 'archived'],
  closed: ['active', 'archived'],
  archived: ['active']
};

export function JobStatusUpdater({ jobId, currentStatus, onStatusUpdate }: JobStatusUpdaterProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { updateJobStatus } = useJobStatus();

  const availableStatuses = statusTransitions[currentStatus] || [];

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast({
        title: 'Error',
        description: 'Please select a status',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateJobStatus(
        jobId,
        selectedStatus as any,
        reason.trim() || undefined
      );

      toast({
        title: 'Success',
        description: `Job status updated to ${selectedStatus}`,
      });

      onStatusUpdate?.(selectedStatus);
      setSelectedStatus('');
      setReason('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Update Job Status
          <JobStatusBadge status={currentStatus} showIcon />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="status">New Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <JobStatusBadge status={status as any} showIcon />
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="reason">Reason (Optional)</Label>
          <Textarea
            id="reason"
            placeholder="Enter reason for status change..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleStatusUpdate}
          disabled={!selectedStatus || isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Status
        </Button>
      </CardContent>
    </Card>
  );
}