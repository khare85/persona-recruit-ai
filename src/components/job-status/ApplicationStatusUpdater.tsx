'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useJobStatus } from '@/hooks/useJobStatus';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ApplicationStatusUpdaterProps {
  applicationId: string;
  currentStatus: 'submitted' | 'under_review' | 'shortlisted' | 'interview_scheduled' | 'rejected' | 'withdrawn' | 'hired';
  candidateName?: string;
  onStatusUpdate?: (newStatus: string) => void;
}

const statusTransitions = {
  submitted: ['under_review', 'rejected'],
  under_review: ['shortlisted', 'rejected'],
  shortlisted: ['interview_scheduled', 'rejected', 'hired'],
  interview_scheduled: ['hired', 'rejected'],
  rejected: ['under_review'], // Allow re-review
  withdrawn: [], // Cannot change from withdrawn
  hired: [] // Cannot change from hired
};

export function ApplicationStatusUpdater({ 
  applicationId, 
  currentStatus, 
  candidateName,
  onStatusUpdate 
}: ApplicationStatusUpdaterProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { updateApplicationStatus } = useJobStatus();

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

    // Require reason for rejection
    if (selectedStatus === 'rejected' && !reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateApplicationStatus(
        applicationId,
        selectedStatus as any,
        reason.trim() || undefined
      );

      toast({
        title: 'Success',
        description: `Application status updated to ${selectedStatus}`,
      });

      onStatusUpdate?.(selectedStatus);
      setSelectedStatus('');
      setReason('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getReasonPlaceholder = () => {
    switch (selectedStatus) {
      case 'rejected':
        return 'Please provide a reason for rejection...';
      case 'hired':
        return 'Optional: Add details about the hiring decision...';
      case 'interview_scheduled':
        return 'Optional: Add interview details...';
      default:
        return 'Optional: Add notes about this status change...';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Update Application Status
          {candidateName && <span className="text-sm text-muted-foreground">- {candidateName}</span>}
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm">Current:</span>
          <ApplicationStatusBadge status={currentStatus} showIcon />
        </div>
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
                    <ApplicationStatusBadge status={status as any} showIcon />
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="reason">
            {selectedStatus === 'rejected' ? 'Reason (Required)' : 'Reason (Optional)'}
          </Label>
          <Textarea
            id="reason"
            placeholder={getReasonPlaceholder()}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className={selectedStatus === 'rejected' && !reason.trim() ? 'border-red-300' : ''}
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

        {availableStatuses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            No status changes available from current state
          </p>
        )}
      </CardContent>
    </Card>
  );
}