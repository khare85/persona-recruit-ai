import { databaseService } from './database.service';
import { emailService } from './email.service';
import { webSocketService } from './websocket.service';
import { apiLogger } from '@/lib/logger';
import { addSentryBreadcrumb } from '@/lib/sentry';

export interface NotificationData {
  id?: string;
  userId: string;
  type: 'job_update' | 'application_update' | 'interview_scheduled' | 'message' | 'system_alert' | 'payment_reminder';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  emailSent: boolean;
  createdAt: Date;
  expiresAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: ('websocket' | 'email' | 'push')[];
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  websocketNotifications: boolean;
  pushNotifications: boolean;
  types: {
    job_updates: boolean;
    application_updates: boolean;
    interview_reminders: boolean;
    messages: boolean;
    system_alerts: boolean;
    payment_reminders: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
}

class NotificationService {
  private static instance: NotificationService;
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send notification to user
   */
  async sendNotification(notification: Omit<NotificationData, 'id' | 'createdAt' | 'read' | 'emailSent'>): Promise<void> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(notification.userId);
      
      // Check if user wants this type of notification
      const typeKey = this.getNotificationTypeKey(notification.type);
      if (!preferences.types[typeKey]) {
        apiLogger.info('Notification skipped due to user preferences', {
          userId: notification.userId,
          type: notification.type
        });
        return;
      }

      // Check quiet hours
      if (this.isQuietHours(preferences)) {
        // Store notification for later delivery (except urgent)
        if (notification.priority !== 'urgent') {
          await this.storeNotification(notification);
          return;
        }
      }

      // Create notification record
      const notificationData: NotificationData = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        read: false,
        emailSent: false
      };

      // Store in database
      await this.storeNotification(notificationData);

      // Send via WebSocket if enabled
      if (preferences.websocketNotifications && notification.channels.includes('websocket')) {
        await this.sendWebSocketNotification(notificationData);
      }

      // Send via email if enabled
      if (preferences.emailNotifications && notification.channels.includes('email')) {
        await this.sendEmailNotification(notificationData);
      }

      // Send push notification if enabled
      if (preferences.pushNotifications && notification.channels.includes('push')) {
        await this.sendPushNotification(notificationData);
      }

      addSentryBreadcrumb('Notification sent', 'notification', 'info', {
        userId: notification.userId,
        type: notification.type,
        priority: notification.priority
      });

    } catch (error) {
      apiLogger.error('Failed to send notification', {
        error: String(error),
        userId: notification.userId,
        type: notification.type
      });
    }
  }

  /**
   * Send WebSocket notification
   */
  private async sendWebSocketNotification(notification: NotificationData): Promise<void> {
    const sent = webSocketService.sendToUser(notification.userId, notification.type, {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority,
      timestamp: notification.createdAt.getTime()
    });

    if (!sent) {
      apiLogger.info('User not connected to WebSocket', {
        userId: notification.userId,
        notificationId: notification.id
      });
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: NotificationData): Promise<void> {
    try {
      const user = await databaseService.getUser(notification.userId);
      if (!user) {
        apiLogger.error('User not found for email notification', {
          userId: notification.userId,
          notificationId: notification.id
        });
        return;
      }

      // Send appropriate email based on notification type
      switch (notification.type) {
        case 'job_update':
          await this.sendJobUpdateEmail(user, notification);
          break;
        case 'application_update':
          await this.sendApplicationUpdateEmail(user, notification);
          break;
        case 'interview_scheduled':
          await this.sendInterviewScheduledEmail(user, notification);
          break;
        case 'payment_reminder':
          await this.sendPaymentReminderEmail(user, notification);
          break;
        case 'system_alert':
          await this.sendSystemAlertEmail(user, notification);
          break;
        default:
          await this.sendGenericEmail(user, notification);
      }

      // Mark email as sent
      await this.updateNotificationEmailStatus(notification.id!, true);

    } catch (error) {
      apiLogger.error('Failed to send email notification', {
        error: String(error),
        userId: notification.userId,
        notificationId: notification.id
      });
    }
  }

  /**
   * Send push notification (placeholder for future implementation)
   */
  private async sendPushNotification(notification: NotificationData): Promise<void> {
    // TODO: Implement push notification service (Firebase Cloud Messaging, etc.)
    apiLogger.info('Push notification would be sent', {
      userId: notification.userId,
      notificationId: notification.id
    });
  }

  /**
   * Store notification in database
   */
  private async storeNotification(notification: NotificationData): Promise<void> {
    await databaseService.create('notifications', notification);
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const preferences = await databaseService.findById('notification_preferences', userId);
      
      if (preferences) {
        return preferences as NotificationPreferences;
      }

      // Return default preferences if none exist
      return this.getDefaultPreferences(userId);
    } catch (error) {
      apiLogger.error('Failed to get user preferences', {
        error: String(error),
        userId
      });
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      emailNotifications: true,
      websocketNotifications: true,
      pushNotifications: false,
      types: {
        job_updates: true,
        application_updates: true,
        interview_reminders: true,
        messages: true,
        system_alerts: true,
        payment_reminders: true
      },
      quiet_hours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      }
    };
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours.enabled) {
      return false;
    }

    const now = new Date();
    const startTime = new Date(`${now.toDateString()} ${preferences.quiet_hours.start}`);
    const endTime = new Date(`${now.toDateString()} ${preferences.quiet_hours.end}`);

    // Handle overnight quiet hours
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    return now >= startTime && now <= endTime;
  }

  /**
   * Get notification type key for preferences
   */
  private getNotificationTypeKey(type: string): keyof NotificationPreferences['types'] {
    switch (type) {
      case 'job_update':
        return 'job_updates';
      case 'application_update':
        return 'application_updates';
      case 'interview_scheduled':
        return 'interview_reminders';
      case 'message':
        return 'messages';
      case 'system_alert':
        return 'system_alerts';
      case 'payment_reminder':
        return 'payment_reminders';
      default:
        return 'system_alerts';
    }
  }

  /**
   * Email sending methods
   */
  private async sendJobUpdateEmail(user: any, notification: NotificationData): Promise<void> {
    await emailService.sendEmail({
      to: user.email,
      subject: notification.title,
      html: `
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/jobs/${notification.data?.jobId}">View Job</a></p>
      `
    });
  }

  private async sendApplicationUpdateEmail(user: any, notification: NotificationData): Promise<void> {
    await emailService.sendEmail({
      to: user.email,
      subject: notification.title,
      html: `
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/applications/${notification.data?.applicationId}">View Application</a></p>
      `
    });
  }

  private async sendInterviewScheduledEmail(user: any, notification: NotificationData): Promise<void> {
    await emailService.sendInterviewNotification(
      user.email,
      `${user.firstName} ${user.lastName}`,
      notification.data?.jobTitle || 'Job Position',
      notification.data?.companyName || 'Company',
      notification.data?.interviewDate || new Date().toLocaleDateString(),
      notification.data?.interviewTime || 'TBD',
      notification.data?.meetingLink
    );
  }

  private async sendPaymentReminderEmail(user: any, notification: NotificationData): Promise<void> {
    await emailService.sendEmail({
      to: user.email,
      subject: notification.title,
      html: `
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/company/billing">Manage Billing</a></p>
      `
    });
  }

  private async sendSystemAlertEmail(user: any, notification: NotificationData): Promise<void> {
    await emailService.sendEmail({
      to: user.email,
      subject: `System Alert: ${notification.title}`,
      html: `
        <h2>System Alert</h2>
        <h3>${notification.title}</h3>
        <p>${notification.message}</p>
      `
    });
  }

  private async sendGenericEmail(user: any, notification: NotificationData): Promise<void> {
    await emailService.sendEmail({
      to: user.email,
      subject: notification.title,
      html: `
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
      `
    });
  }

  /**
   * Update notification email status
   */
  private async updateNotificationEmailStatus(notificationId: string, emailSent: boolean): Promise<void> {
    await databaseService.update('notifications', notificationId, { emailSent });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit: number = 50, offset: number = 0): Promise<NotificationData[]> {
    const notifications = await databaseService.findMany('notifications', {
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit,
      offset
    });

    return notifications as NotificationData[];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await databaseService.update('notifications', notificationId, { read: true });
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await databaseService.findMany('notifications', {
      where: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'read', operator: '==', value: false }
      ]
    });

    for (const notification of notifications) {
      await this.markAsRead(notification.id);
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    await databaseService.upsert('notification_preferences', userId, {
      ...preferences,
      userId
    });
  }

  /**
   * Business logic notification methods
   */
  async notifyJobUpdate(jobId: string, companyId: string, title: string, message: string): Promise<void> {
    // Notify all candidates who applied to this job
    const applications = await databaseService.findMany('jobApplications', {
      where: [{ field: 'jobId', operator: '==', value: jobId }]
    });

    for (const application of applications) {
      await this.sendNotification({
        userId: application.candidateId,
        type: 'job_update',
        title,
        message,
        data: { jobId, companyId },
        priority: 'medium',
        channels: ['websocket', 'email']
      });
    }
  }

  async notifyApplicationUpdate(applicationId: string, candidateId: string, title: string, message: string): Promise<void> {
    await this.sendNotification({
      userId: candidateId,
      type: 'application_update',
      title,
      message,
      data: { applicationId },
      priority: 'high',
      channels: ['websocket', 'email']
    });
  }

  async notifyInterviewScheduled(
    interviewId: string,
    candidateId: string,
    interviewerId: string,
    jobTitle: string,
    companyName: string,
    interviewDate: string,
    interviewTime: string,
    meetingLink?: string
  ): Promise<void> {
    // Notify candidate
    await this.sendNotification({
      userId: candidateId,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: `Your interview for ${jobTitle} at ${companyName} has been scheduled`,
      data: { interviewId, jobTitle, companyName, interviewDate, interviewTime, meetingLink },
      priority: 'high',
      channels: ['websocket', 'email']
    });

    // Notify interviewer
    await this.sendNotification({
      userId: interviewerId,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: `Interview scheduled for ${jobTitle} position`,
      data: { interviewId, jobTitle, companyName, interviewDate, interviewTime, meetingLink },
      priority: 'high',
      channels: ['websocket', 'email']
    });
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;