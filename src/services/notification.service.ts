/**
 * Comprehensive notification system
 * Handles in-app notifications, email notifications, and user preferences
 */

import { databaseService } from './database.service';
import { emailService } from './email.service';
import { notificationLogger } from '@/lib/logger';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  url?: string;
  action?: string;
  style?: 'primary' | 'secondary' | 'danger';
}

export type NotificationType = 
  | 'application_received'
  | 'application_status_changed'
  | 'interview_scheduled'
  | 'interview_reminder'
  | 'interview_completed'
  | 'job_match_found'
  | 'recruiter_invitation'
  | 'email_verification'
  | 'password_reset'
  | 'profile_incomplete'
  | 'system_announcement'
  | 'company_update';

export type NotificationCategory = 
  | 'applications'
  | 'interviews'
  | 'matches'
  | 'invitations'
  | 'security'
  | 'profile'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationPreferences {
  userId: string;
  emailNotifications: {
    applications: boolean;
    interviews: boolean;
    matches: boolean;
    invitations: boolean;
    security: boolean;
    marketing: boolean;
  };
  inAppNotifications: {
    applications: boolean;
    interviews: boolean;
    matches: boolean;
    invitations: boolean;
    security: boolean;
    system: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  updatedAt: string;
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  emailSubject?: string;
  emailTemplate?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  defaultEmailEnabled: boolean;
  defaultInAppEnabled: boolean;
}

class NotificationService {
  private templates: Map<NotificationType, NotificationTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    const templates: NotificationTemplate[] = [
      {
        type: 'application_received',
        title: 'New Application Received',
        message: 'A new candidate has applied for {{jobTitle}}',
        emailSubject: 'New application for {{jobTitle}}',
        category: 'applications',
        priority: 'medium',
        defaultEmailEnabled: true,
        defaultInAppEnabled: true
      },
      {
        type: 'application_status_changed',
        title: 'Application Status Updated',
        message: 'Your application for {{jobTitle}} has been {{status}}',
        emailSubject: 'Update on your application for {{jobTitle}}',
        category: 'applications',
        priority: 'high',
        defaultEmailEnabled: true,
        defaultInAppEnabled: true
      },
      {
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: 'Your interview for {{jobTitle}} is scheduled for {{date}}',
        emailSubject: 'Interview scheduled for {{jobTitle}}',
        category: 'interviews',
        priority: 'high',
        defaultEmailEnabled: true,
        defaultInAppEnabled: true
      },
      {
        type: 'interview_reminder',
        title: 'Interview Reminder',
        message: 'Your interview for {{jobTitle}} starts in {{timeRemaining}}',
        emailSubject: 'Interview reminder - {{jobTitle}}',
        category: 'interviews',
        priority: 'urgent',
        defaultEmailEnabled: true,
        defaultInAppEnabled: true
      },
      {
        type: 'job_match_found',
        title: 'New Job Match Found',
        message: 'We found a {{matchScore}}% match for {{jobTitle}} at {{companyName}}',
        emailSubject: 'New job match found - {{jobTitle}}',
        category: 'matches',
        priority: 'medium',
        defaultEmailEnabled: false,
        defaultInAppEnabled: true
      },
      {
        type: 'recruiter_invitation',
        title: 'Recruiter Invitation',
        message: 'You\'ve been invited to join {{companyName}} as a recruiter',
        emailSubject: 'Invitation to join {{companyName}}',
        category: 'invitations',
        priority: 'high',
        defaultEmailEnabled: true,
        defaultInAppEnabled: true
      },
      {
        type: 'email_verification',
        title: 'Verify Your Email',
        message: 'Please verify your email address to complete registration',
        emailSubject: 'Verify your email address',
        category: 'security',
        priority: 'high',
        defaultEmailEnabled: true,
        defaultInAppEnabled: true
      },
      {
        type: 'profile_incomplete',
        title: 'Complete Your Profile',
        message: 'Complete your profile to get better job matches',
        category: 'profile',
        priority: 'low',
        defaultEmailEnabled: false,
        defaultInAppEnabled: true
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.type, template);
    });
  }

  /**
   * Send a notification (both in-app and email based on preferences)
   */
  async sendNotification(options: {
    userId: string;
    type: NotificationType;
    data?: Record<string, any>;
    overridePreferences?: boolean;
    customTitle?: string;
    customMessage?: string;
    actions?: NotificationAction[];
  }): Promise<{ inApp: boolean; email: boolean }> {
    const { userId, type, data = {}, overridePreferences = false, customTitle, customMessage, actions } = options;

    try {
      notificationLogger.info('Sending notification', { userId, type, data });

      const template = this.templates.get(type);
      if (!template) {
        throw new Error(`Unknown notification type: ${type}`);
      }

      // Get user preferences
      const preferences = await this.getUserPreferences(userId);
      
      // Check if user wants this type of notification
      const shouldSendInApp = overridePreferences || 
        preferences.inAppNotifications[template.category as keyof typeof preferences.inAppNotifications];
      const shouldSendEmail = overridePreferences || 
        preferences.emailNotifications[template.category as keyof typeof preferences.emailNotifications];

      let inAppSent = false;
      let emailSent = false;

      // Send in-app notification
      if (shouldSendInApp) {
        inAppSent = await this.createInAppNotification({
          userId,
          type,
          title: customTitle || this.replaceVariables(template.title, data),
          message: customMessage || this.replaceVariables(template.message, data),
          data,
          category: template.category,
          priority: template.priority,
          actions
        });
      }

      // Send email notification
      if (shouldSendEmail && !this.isInQuietHours(preferences)) {
        emailSent = await this.sendEmailNotification({
          userId,
          type,
          template,
          data
        });
      }

      notificationLogger.info('Notification sent', {
        userId,
        type,
        inAppSent,
        emailSent
      });

      return { inApp: inAppSent, email: emailSent };

    } catch (error) {
      notificationLogger.error('Failed to send notification', {
        userId,
        type,
        error: String(error)
      });
      
      return { inApp: false, email: false };
    }
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(options: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    category: NotificationCategory;
    priority: NotificationPriority;
    actions?: NotificationAction[];
  }): Promise<boolean> {
    try {
      const notification: Omit<Notification, 'id'> = {
        userId: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        data: options.data,
        read: false,
        createdAt: new Date().toISOString(),
        category: options.category,
        priority: options.priority,
        actions: options.actions
      };

      // Set expiration for low priority notifications
      if (options.priority === 'low') {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        notification.expiresAt = expiresAt.toISOString();
      }

      await this.saveNotification(notification);
      
      // TODO: Send real-time update via WebSocket/SSE
      await this.sendRealTimeUpdate(options.userId, notification);

      return true;
    } catch (error) {
      notificationLogger.error('Failed to create in-app notification', {
        userId: options.userId,
        type: options.type,
        error: String(error)
      });
      return false;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(options: {
    userId: string;
    type: NotificationType;
    template: NotificationTemplate;
    data: Record<string, any>;
  }): Promise<boolean> {
    try {
      const user = await databaseService.getUserById(options.userId);
      if (!user || !user.email) {
        return false;
      }

      const subject = this.replaceVariables(
        options.template.emailSubject || options.template.title,
        options.data
      );

      // For now, use simple HTML email. In production, you'd use proper templates
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${options.template.title}</h2>
          <p>${this.replaceVariables(options.template.message, options.data)}</p>
          
          ${options.data.actionUrl ? `
            <div style="margin: 20px 0; text-align: center;">
              <a href="${options.data.actionUrl}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                View Details
              </a>
            </div>
          ` : ''}
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            You're receiving this email because of your notification preferences. 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">Update preferences</a>
          </p>
        </div>
      `;

      const result = await emailService.sendEmail({
        to: user.email,
        subject,
        html
      });

      return result.success;
    } catch (error) {
      notificationLogger.error('Failed to send email notification', {
        userId: options.userId,
        type: options.type,
        error: String(error)
      });
      return false;
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      category?: NotificationCategory;
    } = {}
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      // This would be implemented with your database service
      // For now, return mock data structure
      
      const notifications = await this.getNotificationsFromDatabase(userId, options);
      const total = await this.getNotificationsCount(userId, options);
      const unreadCount = await this.getUnreadNotificationsCount(userId);

      return {
        notifications,
        total,
        unreadCount
      };
    } catch (error) {
      notificationLogger.error('Failed to get user notifications', {
        userId,
        error: String(error)
      });
      
      return {
        notifications: [],
        total: 0,
        unreadCount: 0
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      await this.updateNotification(notificationId, { read: true });
      
      notificationLogger.info('Notification marked as read', {
        userId,
        notificationId
      });
      
      return true;
    } catch (error) {
      notificationLogger.error('Failed to mark notification as read', {
        userId,
        notificationId,
        error: String(error)
      });
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await this.updateUserNotifications(userId, { read: true });
      
      notificationLogger.info('All notifications marked as read', { userId });
      
      return true;
    } catch (error) {
      notificationLogger.error('Failed to mark all notifications as read', {
        userId,
        error: String(error)
      });
      return false;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    try {
      await this.removeNotification(notificationId);
      
      notificationLogger.info('Notification deleted', {
        userId,
        notificationId
      });
      
      return true;
    } catch (error) {
      notificationLogger.error('Failed to delete notification', {
        userId,
        notificationId,
        error: String(error)
      });
      return false;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const preferences = await this.getPreferencesFromDatabase(userId);
      
      if (preferences) {
        return preferences;
      }

      // Return default preferences if none exist
      return this.getDefaultPreferences(userId);
    } catch (error) {
      notificationLogger.error('Failed to get user preferences', {
        userId,
        error: String(error)
      });
      
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const currentPreferences = await this.getUserPreferences(userId);
      
      const updatedPreferences: NotificationPreferences = {
        ...currentPreferences,
        ...preferences,
        userId,
        updatedAt: new Date().toISOString()
      };

      await this.savePreferencesToDatabase(updatedPreferences);
      
      notificationLogger.info('User preferences updated', {
        userId,
        preferences: Object.keys(preferences)
      });
      
      return true;
    } catch (error) {
      notificationLogger.error('Failed to update user preferences', {
        userId,
        error: String(error)
      });
      return false;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: Array<{
    userId: string;
    type: NotificationType;
    data?: Record<string, any>;
  }>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        await this.sendNotification(notification);
        success++;
      } catch (error) {
        failed++;
        notificationLogger.error('Bulk notification failed', {
          userId: notification.userId,
          type: notification.type,
          error: String(error)
        });
      }
    }

    notificationLogger.info('Bulk notifications completed', {
      total: notifications.length,
      success,
      failed
    });

    return { success, failed };
  }

  // Helper methods
  private replaceVariables(text: string, data: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const userTimezone = preferences.quietHours.timezone || 'UTC';
    
    // This would need proper timezone handling in production
    // For now, just check basic time comparison
    const currentHour = now.getHours();
    const startHour = parseInt(preferences.quietHours.start.split(':')[0]);
    const endHour = parseInt(preferences.quietHours.end.split(':')[0]);

    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Quiet hours cross midnight
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      emailNotifications: {
        applications: true,
        interviews: true,
        matches: false,
        invitations: true,
        security: true,
        marketing: false
      },
      inAppNotifications: {
        applications: true,
        interviews: true,
        matches: true,
        invitations: true,
        security: true,
        system: true
      },
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      },
      updatedAt: new Date().toISOString()
    };
  }

  // Database interaction methods (would be implemented with your database service)
  private async saveNotification(notification: Omit<Notification, 'id'>): Promise<string> {
    // Implementation would save to your database
    // For now, return a mock ID
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getNotificationsFromDatabase(
    userId: string,
    options: any
  ): Promise<Notification[]> {
    // Implementation would query your database
    return [];
  }

  private async getNotificationsCount(userId: string, options: any): Promise<number> {
    // Implementation would count notifications in database
    return 0;
  }

  private async getUnreadNotificationsCount(userId: string): Promise<number> {
    // Implementation would count unread notifications
    return 0;
  }

  private async updateNotification(notificationId: string, updates: Partial<Notification>): Promise<void> {
    // Implementation would update notification in database
  }

  private async updateUserNotifications(userId: string, updates: Partial<Notification>): Promise<void> {
    // Implementation would update all user notifications in database
  }

  private async removeNotification(notificationId: string): Promise<void> {
    // Implementation would delete notification from database
  }

  private async getPreferencesFromDatabase(userId: string): Promise<NotificationPreferences | null> {
    // Implementation would get preferences from database
    return null;
  }

  private async savePreferencesToDatabase(preferences: NotificationPreferences): Promise<void> {
    // Implementation would save preferences to database
  }

  private async sendRealTimeUpdate(userId: string, notification: any): Promise<void> {
    // Implementation would send real-time update via WebSocket/SSE
    // For now, just log
    notificationLogger.info('Real-time notification sent', {
      userId,
      notificationId: notification.id
    });
  }

  // Specific notification methods for common use cases
  async notifyApplicationReceived(
    recruiterId: string,
    candidateName: string,
    jobTitle: string,
    applicationId: string
  ): Promise<void> {
    await this.sendNotification({
      userId: recruiterId,
      type: 'application_received',
      data: {
        candidateName,
        jobTitle,
        actionUrl: `/company/applications/${applicationId}`
      }
    });
  }

  async notifyApplicationStatusChanged(
    candidateId: string,
    jobTitle: string,
    status: string,
    companyName: string
  ): Promise<void> {
    await this.sendNotification({
      userId: candidateId,
      type: 'application_status_changed',
      data: {
        jobTitle,
        status,
        companyName,
        actionUrl: `/candidates/applications`
      }
    });
  }

  async notifyInterviewScheduled(
    candidateId: string,
    jobTitle: string,
    companyName: string,
    date: string,
    meetingLink?: string
  ): Promise<void> {
    await this.sendNotification({
      userId: candidateId,
      type: 'interview_scheduled',
      data: {
        jobTitle,
        companyName,
        date,
        meetingLink,
        actionUrl: `/candidates/interviews`
      }
    });
  }

  async notifyJobMatch(
    candidateId: string,
    jobTitle: string,
    companyName: string,
    matchScore: number,
    jobId: string
  ): Promise<void> {
    await this.sendNotification({
      userId: candidateId,
      type: 'job_match_found',
      data: {
        jobTitle,
        companyName,
        matchScore,
        actionUrl: `/jobs/${jobId}`
      }
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;