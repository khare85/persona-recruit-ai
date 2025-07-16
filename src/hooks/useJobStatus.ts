'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from './use-toast';

export interface JobStatusData {
  id: string;
  status: 'draft' | 'active' | 'paused' | 'closed' | 'archived';
  stats: {
    views: number;
    applications: number;
    interviews: number;
    offers: number;
  };
  lastUpdated: number;
  updatedBy?: string;
}

export interface ApplicationStatusData {
  id: string;
  jobId: string;
  candidateId: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'interview_scheduled' | 'rejected' | 'withdrawn' | 'hired';
  lastUpdated: number;
  updatedBy?: string;
  reason?: string;
}

export interface JobStatusUpdate {
  jobId: string;
  previousStatus: string;
  newStatus: string;
  title: string;
  message: string;
  timestamp: number;
  stats?: JobStatusData['stats'];
}

export interface ApplicationStatusUpdate {
  applicationId: string;
  jobId: string;
  candidateId: string;
  previousStatus: string;
  newStatus: string;
  title: string;
  message: string;
  timestamp: number;
  reason?: string;
}

export const useJobStatus = () => {
  const { user } = useAuth();
  const { subscribe, unsubscribe, isConnected } = useWebSocket();
  const [jobStatuses, setJobStatuses] = useState<Map<string, JobStatusData>>(new Map());
  const [applicationStatuses, setApplicationStatuses] = useState<Map<string, ApplicationStatusData>>(new Map());
  const [recentUpdates, setRecentUpdates] = useState<(JobStatusUpdate | ApplicationStatusUpdate)[]>([]);

  // Handle job status updates
  const handleJobStatusUpdate = useCallback((data: JobStatusUpdate) => {
    setJobStatuses(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(data.jobId);
      
      newMap.set(data.jobId, {
        id: data.jobId,
        status: data.newStatus as JobStatusData['status'],
        stats: data.stats || existing?.stats || { views: 0, applications: 0, interviews: 0, offers: 0 },
        lastUpdated: data.timestamp,
        updatedBy: data.updatedBy
      });
      
      return newMap;
    });

    // Add to recent updates
    setRecentUpdates(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 updates

    // Show toast notification based on user role
    if (user?.role === 'candidate') {
      toast({
        title: data.title,
        description: data.message,
        duration: 5000,
      });
    } else if (['recruiter', 'company_admin'].includes(user?.role || '')) {
      toast({
        title: `Job Status Updated`,
        description: `Job status changed to ${data.newStatus}`,
        duration: 3000,
      });
    }
  }, [user?.role]);

  // Handle application status updates
  const handleApplicationStatusUpdate = useCallback((data: ApplicationStatusUpdate) => {
    setApplicationStatuses(prev => {
      const newMap = new Map(prev);
      
      newMap.set(data.applicationId, {
        id: data.applicationId,
        jobId: data.jobId,
        candidateId: data.candidateId,
        status: data.newStatus as ApplicationStatusData['status'],
        lastUpdated: data.timestamp,
        updatedBy: data.updatedBy,
        reason: data.reason
      });
      
      return newMap;
    });

    // Add to recent updates
    setRecentUpdates(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 updates

    // Show toast notification based on user role
    if (user?.role === 'candidate' && data.candidateId === user.id) {
      toast({
        title: data.title,
        description: data.message,
        duration: 5000,
        variant: data.newStatus === 'rejected' ? 'destructive' : 'default',
      });
    } else if (['recruiter', 'company_admin'].includes(user?.role || '')) {
      toast({
        title: `Application Status Updated`,
        description: `Application status changed to ${data.newStatus}`,
        duration: 3000,
      });
    }
  }, [user?.role, user?.id]);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!isConnected) return;

    const jobUpdateHandler = (data: any) => {
      if (data.type === 'job_status_update') {
        handleJobStatusUpdate(data);
      }
    };

    const applicationUpdateHandler = (data: any) => {
      if (data.type === 'application_status_update') {
        handleApplicationStatusUpdate(data);
      }
    };

    subscribe('job_update', jobUpdateHandler);
    subscribe('application_update', applicationUpdateHandler);

    return () => {
      unsubscribe('job_update', jobUpdateHandler);
      unsubscribe('application_update', applicationUpdateHandler);
    };
  }, [isConnected, subscribe, unsubscribe, handleJobStatusUpdate, handleApplicationStatusUpdate]);

  // API methods
  const updateJobStatus = useCallback(async (
    jobId: string,
    status: JobStatusData['status'],
    reason?: string,
    metadata?: any
  ) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason, metadata }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      const result = await response.json();
      
      // Update local state immediately
      setJobStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(jobId, {
          id: jobId,
          status,
          stats: result.data.stats,
          lastUpdated: result.data.timestamp,
          updatedBy: result.data.updatedBy
        });
        return newMap;
      });

      return result.data;
    } catch (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  }, []);

  const updateApplicationStatus = useCallback(async (
    applicationId: string,
    status: ApplicationStatusData['status'],
    reason?: string,
    metadata?: any
  ) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason, metadata }),
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      const result = await response.json();
      
      // Update local state immediately
      setApplicationStatuses(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(applicationId);
        newMap.set(applicationId, {
          id: applicationId,
          jobId: existing?.jobId || '',
          candidateId: existing?.candidateId || '',
          status,
          lastUpdated: result.data.timestamp,
          updatedBy: result.data.updatedBy,
          reason
        });
        return newMap;
      });

      return result.data;
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }, []);

  const getJobStatusHistory = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job status history');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching job status history:', error);
      throw error;
    }
  }, []);

  const getApplicationStatusHistory = useCallback(async (applicationId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch application status history');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching application status history:', error);
      throw error;
    }
  }, []);

  // Clear old updates periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      setRecentUpdates(prev => prev.filter(update => update.timestamp > oneHourAgo));
    }, 5 * 60 * 1000); // Clean up every 5 minutes

    return () => clearInterval(interval);
  }, []);

  return {
    // State
    jobStatuses,
    applicationStatuses,
    recentUpdates,
    
    // Actions
    updateJobStatus,
    updateApplicationStatus,
    
    // Queries
    getJobStatusHistory,
    getApplicationStatusHistory,
    
    // Utilities
    getJobStatus: (jobId: string) => jobStatuses.get(jobId),
    getApplicationStatus: (applicationId: string) => applicationStatuses.get(applicationId),
    
    // Connection status
    isConnected,
  };
};