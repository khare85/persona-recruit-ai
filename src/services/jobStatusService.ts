import { databaseService } from './database.service';
import { notificationService } from './notification.service';
import { webSocketService } from './websocket.service';
import { apiLogger } from '@/lib/logger';
import { addSentryBreadcrumb } from '@/lib/sentry';
import { Job, JobApplication } from '@/models/job.model';

export interface JobStatusUpdate {
  jobId: string;
  companyId: string;
  previousStatus: string;
  newStatus: string;
  updatedBy: string;
  reason?: string;
  metadata?: any;
  timestamp: number;
}

export interface ApplicationStatusUpdate {
  applicationId: string;
  jobId: string;
  candidateId: string;
  companyId: string;
  previousStatus: string;
  newStatus: string;
  updatedBy: string;
  reason?: string;
  metadata?: any;
  timestamp: number;
}

class JobStatusService {
  private static instance: JobStatusService;
  
  static getInstance(): JobStatusService {
    if (!JobStatusService.instance) {
      JobStatusService.instance = new JobStatusService();
    }
    return JobStatusService.instance;
  }

  /**
   * Update job status with real-time notifications
   */
  async updateJobStatus(
    jobId: string,
    newStatus: Job['status'],
    updatedBy: string,
    reason?: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Get current job details
      const job = await databaseService.findById('jobs', jobId) as Job;
      if (!job) {
        throw new Error('Job not found');
      }

      const previousStatus = job.status;
      
      // Skip if status hasn't changed
      if (previousStatus === newStatus) {
        return;
      }

      // Update job status in database
      await databaseService.update('jobs', jobId, {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'closed' && { closedAt: new Date() }),
        ...(newStatus === 'active' && !job.publishedAt && { publishedAt: new Date() })
      });

      // Create status update record
      const statusUpdate: JobStatusUpdate = {
        jobId,
        companyId: job.companyId,
        previousStatus,
        newStatus,
        updatedBy,
        reason,
        metadata,
        timestamp: Date.now()
      };

      // Store status update history
      await databaseService.create('job_status_updates', statusUpdate);

      // Send notifications based on status change
      await this.handleJobStatusNotifications(job, statusUpdate);

      // Send real-time WebSocket updates
      const notificationMessages = this.getJobStatusNotificationMessages(job, newStatus, previousStatus);
      if (notificationMessages) {
        webSocketService.sendJobStatusUpdate(jobId, job.companyId, {
          previousStatus,
          newStatus,
          title: notificationMessages.title,
          message: notificationMessages.message,
          stats: await this.getJobStats(jobId),
          updatedBy
        });
      }

      // Log the status change
      apiLogger.info('Job status updated', {
        jobId,
        previousStatus,
        newStatus,
        updatedBy,
        reason
      });

      addSentryBreadcrumb('Job status updated', 'job', 'info', {
        jobId,
        status: newStatus,
        company: job.companyId
      });

    } catch (error) {
      apiLogger.error('Failed to update job status', {
        error: String(error),
        jobId,
        newStatus,
        updatedBy
      });
      throw error;
    }
  }

  /**
   * Update application status with real-time notifications
   */
  async updateApplicationStatus(
    applicationId: string,
    newStatus: JobApplication['status'],
    updatedBy: string,
    reason?: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Get current application details
      const application = await databaseService.findById('jobApplications', applicationId) as JobApplication;
      if (!application) {
        throw new Error('Application not found');
      }

      const previousStatus = application.status;
      
      // Skip if status hasn't changed
      if (previousStatus === newStatus) {
        return;
      }

      // Update application status in database
      const updateData: Partial<JobApplication> = {
        status: newStatus,
        lastActivityAt: new Date(),
        ...(reason && { rejectionReason: reason }),
        ...(newStatus === 'withdrawn' && { withdrawalReason: reason })
      };

      // Add timeline event
      const timelineEvent = {
        event: `Status changed from ${previousStatus} to ${newStatus}`,
        timestamp: new Date(),
        userId: updatedBy,
        notes: reason
      };

      updateData.timeline = [...(application.timeline || []), timelineEvent];

      await databaseService.update('jobApplications', applicationId, updateData);

      // Create status update record
      const statusUpdate: ApplicationStatusUpdate = {
        applicationId,
        jobId: application.jobId,
        candidateId: application.candidateId,
        companyId: application.companyId,
        previousStatus,
        newStatus,
        updatedBy,
        reason,
        metadata,
        timestamp: Date.now()
      };

      // Store status update history
      await databaseService.create('application_status_updates', statusUpdate);

      // Send notifications based on status change
      await this.handleApplicationStatusNotifications(application, statusUpdate);

      // Send real-time WebSocket updates
      const job = await databaseService.findById('jobs', application.jobId);
      const notificationMessages = this.getApplicationStatusNotificationMessages(
        application,
        job as any,
        newStatus,
        previousStatus
      );
      
      if (notificationMessages) {
        webSocketService.sendApplicationStatusUpdate(
          applicationId,
          application.candidateId,
          application.companyId,
          {
            previousStatus,
            newStatus,
            title: notificationMessages.title,
            message: notificationMessages.message,
            reason,
            updatedBy
          }
        );
      }

      // Log the status change
      apiLogger.info('Application status updated', {
        applicationId,
        previousStatus,
        newStatus,
        updatedBy,
        reason
      });

      addSentryBreadcrumb('Application status updated', 'application', 'info', {
        applicationId,
        status: newStatus,
        candidate: application.candidateId
      });

    } catch (error) {
      apiLogger.error('Failed to update application status', {
        error: String(error),
        applicationId,
        newStatus,
        updatedBy
      });
      throw error;
    }
  }

  /**
   * Handle job status change notifications
   */
  private async handleJobStatusNotifications(job: Job, statusUpdate: JobStatusUpdate): Promise<void> {
    const { newStatus, previousStatus } = statusUpdate;

    // Get all applications for this job
    const applications = await databaseService.findMany('jobApplications', {
      where: [{ field: 'jobId', operator: '==', value: job.id }]
    }) as JobApplication[];

    // Notification messages based on status change
    const notificationMessages = this.getJobStatusNotificationMessages(job, newStatus, previousStatus);

    if (!notificationMessages) return;

    // Notify all candidates who applied
    for (const application of applications) {
      await notificationService.sendNotification({
        userId: application.candidateId,
        type: 'job_update',
        title: notificationMessages.title,
        message: notificationMessages.message,
        data: {
          jobId: job.id,
          jobTitle: job.title,
          companyName: job.companyName,
          previousStatus,
          newStatus,
          applicationId: application.id
        },
        priority: this.getNotificationPriority(newStatus),
        channels: ['websocket', 'email']
      });
    }

    // Notify company team members
    const companyUsers = await databaseService.findMany('users', {
      where: [
        { field: 'companyId', operator: '==', value: job.companyId },
        { field: 'role', operator: 'in', value: ['recruiter', 'company_admin'] }
      ]
    });

    for (const user of companyUsers) {
      await notificationService.sendNotification({
        userId: user.id,
        type: 'job_update',
        title: `Job Status Updated: ${job.title}`,
        message: `Job status changed from ${previousStatus} to ${newStatus}`,
        data: {
          jobId: job.id,
          jobTitle: job.title,
          previousStatus,
          newStatus,
          updatedBy: statusUpdate.updatedBy
        },
        priority: 'medium',
        channels: ['websocket']
      });
    }
  }

  /**
   * Handle application status change notifications
   */
  private async handleApplicationStatusNotifications(
    application: JobApplication,
    statusUpdate: ApplicationStatusUpdate
  ): Promise<void> {
    const { newStatus, previousStatus } = statusUpdate;

    // Get job details
    const job = await databaseService.findById('jobs', application.jobId) as Job;
    if (!job) return;

    // Notification messages based on status change
    const notificationMessages = this.getApplicationStatusNotificationMessages(
      application,
      job,
      newStatus,
      previousStatus
    );

    if (!notificationMessages) return;

    // Notify the candidate
    await notificationService.sendNotification({
      userId: application.candidateId,
      type: 'application_update',
      title: notificationMessages.title,
      message: notificationMessages.message,
      data: {
        applicationId: application.id,
        jobId: application.jobId,
        jobTitle: job.title,
        companyName: job.companyName,
        previousStatus,
        newStatus,
        reason: statusUpdate.reason
      },
      priority: this.getNotificationPriority(newStatus),
      channels: ['websocket', 'email']
    });

    // Notify company recruiters
    const companyRecruiters = await databaseService.findMany('users', {
      where: [
        { field: 'companyId', operator: '==', value: job.companyId },
        { field: 'role', operator: 'in', value: ['recruiter', 'company_admin'] }
      ]
    });

    for (const recruiter of companyRecruiters) {
      await notificationService.sendNotification({
        userId: recruiter.id,
        type: 'application_update',
        title: `Application Status Updated`,
        message: `${application.candidateName}'s application for ${job.title} is now ${newStatus}`,
        data: {
          applicationId: application.id,
          jobId: application.jobId,
          candidateId: application.candidateId,
          candidateName: application.candidateName,
          jobTitle: job.title,
          previousStatus,
          newStatus
        },
        priority: 'medium',
        channels: ['websocket']
      });
    }
  }

  /**
   * Get notification messages for job status changes
   */
  private getJobStatusNotificationMessages(
    job: Job,
    newStatus: string,
    previousStatus: string
  ): { title: string; message: string } | null {
    switch (newStatus) {
      case 'active':
        if (previousStatus === 'draft') {
          return {
            title: 'Job Published',
            message: `The job "${job.title}" at ${job.companyName} has been published and is now accepting applications.`
          };
        }
        return {
          title: 'Job Reopened',
          message: `The job "${job.title}" at ${job.companyName} has been reopened for applications.`
        };
        
      case 'paused':
        return {
          title: 'Job Paused',
          message: `The job "${job.title}" at ${job.companyName} has been temporarily paused.`
        };
        
      case 'closed':
        return {
          title: 'Job Closed',
          message: `The job "${job.title}" at ${job.companyName} has been closed and is no longer accepting applications.`
        };
        
      case 'archived':
        return {
          title: 'Job Archived',
          message: `The job "${job.title}" at ${job.companyName} has been archived.`
        };
        
      default:
        return null;
    }
  }

  /**
   * Get notification messages for application status changes
   */
  private getApplicationStatusNotificationMessages(
    application: JobApplication,
    job: Job,
    newStatus: string,
    previousStatus: string
  ): { title: string; message: string } | null {
    switch (newStatus) {
      case 'under_review':
        return {
          title: 'Application Under Review',
          message: `Your application for "${job.title}" at ${job.companyName} is now under review.`
        };
        
      case 'shortlisted':
        return {
          title: 'You\'ve Been Shortlisted!',
          message: `Congratulations! You've been shortlisted for "${job.title}" at ${job.companyName}.`
        };
        
      case 'interview_scheduled':
        return {
          title: 'Interview Scheduled',
          message: `An interview has been scheduled for your application to "${job.title}" at ${job.companyName}.`
        };
        
      case 'rejected':
        return {
          title: 'Application Update',
          message: `Thank you for your interest in "${job.title}" at ${job.companyName}. We've decided to move forward with other candidates.`
        };
        
      case 'hired':
        return {
          title: 'Congratulations! You\'ve Been Hired!',
          message: `We're excited to offer you the position of "${job.title}" at ${job.companyName}!`
        };
        
      case 'withdrawn':
        return {
          title: 'Application Withdrawn',
          message: `Your application for "${job.title}" at ${job.companyName} has been withdrawn.`
        };
        
      default:
        return null;
    }
  }

  /**
   * Get notification priority based on status
   */
  private getNotificationPriority(status: string): 'low' | 'medium' | 'high' | 'urgent' {
    switch (status) {
      case 'hired':
      case 'interview_scheduled':
        return 'high';
      case 'shortlisted':
      case 'rejected':
        return 'medium';
      case 'under_review':
      case 'paused':
      case 'closed':
      default:
        return 'low';
    }
  }

  /**
   * Get job status history
   */
  async getJobStatusHistory(jobId: string): Promise<JobStatusUpdate[]> {
    const history = await databaseService.findMany('job_status_updates', {
      where: [{ field: 'jobId', operator: '==', value: jobId }],
      orderBy: { field: 'timestamp', direction: 'desc' }
    });

    return history as JobStatusUpdate[];
  }

  /**
   * Get application status history
   */
  async getApplicationStatusHistory(applicationId: string): Promise<ApplicationStatusUpdate[]> {
    const history = await databaseService.findMany('application_status_updates', {
      where: [{ field: 'applicationId', operator: '==', value: applicationId }],
      orderBy: { field: 'timestamp', direction: 'desc' }
    });

    return history as ApplicationStatusUpdate[];
  }

  /**
   * Get real-time job stats
   */
  async getJobStats(jobId: string): Promise<Job['stats']> {
    const applications = await databaseService.findMany('jobApplications', {
      where: [{ field: 'jobId', operator: '==', value: jobId }]
    }) as JobApplication[];

    const stats = applications.reduce((acc, app) => {
      acc.applications += 1;
      if (app.status === 'interview_scheduled') acc.interviews += 1;
      if (app.status === 'hired') acc.offers += 1;
      return acc;
    }, { views: 0, applications: 0, interviews: 0, offers: 0 });

    // Update job stats in database
    await databaseService.update('jobs', jobId, { stats });

    return stats;
  }

  /**
   * Bulk update job statuses (for admin operations)
   */
  async bulkUpdateJobStatuses(
    jobIds: string[],
    newStatus: Job['status'],
    updatedBy: string,
    reason?: string
  ): Promise<void> {
    const promises = jobIds.map(jobId => 
      this.updateJobStatus(jobId, newStatus, updatedBy, reason)
    );

    await Promise.all(promises);

    apiLogger.info('Bulk job status update completed', {
      jobIds,
      newStatus,
      updatedBy,
      count: jobIds.length
    });
  }

  /**
   * Auto-close expired jobs
   */
  async autoCloseExpiredJobs(): Promise<void> {
    const now = new Date();
    
    // Find jobs with expired application deadlines
    const expiredJobs = await databaseService.findMany('jobs', {
      where: [
        { field: 'status', operator: '==', value: 'active' },
        { field: 'applicationDeadline', operator: '<=', value: now }
      ]
    }) as Job[];

    for (const job of expiredJobs) {
      await this.updateJobStatus(
        job.id,
        'closed',
        'system',
        'Application deadline expired'
      );
    }

    if (expiredJobs.length > 0) {
      apiLogger.info('Auto-closed expired jobs', {
        count: expiredJobs.length,
        jobIds: expiredJobs.map(j => j.id)
      });
    }
  }
}

export const jobStatusService = JobStatusService.getInstance();
export default jobStatusService;