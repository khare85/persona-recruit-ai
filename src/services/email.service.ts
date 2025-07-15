/**
 * Email service for sending transactional emails
 * Supports multiple providers: SendGrid, Resend, Nodemailer (SMTP)
 */

import { emailLogger } from '@/lib/logger';

export interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
  sendBulkEmail(emails: EmailOptions[]): Promise<EmailResult[]>;
}

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  path?: string; // For file path
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
}

/**
 * SendGrid Email Provider
 */
export class SendGridProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Dynamic import to avoid issues if SendGrid is not installed
      const sgMail = await import('@sendgrid/mail').then(m => m.default).catch(() => null);
      if (!sgMail) {
        throw new Error('SendGrid not available');
      }
      sgMail.setApiKey(this.apiKey);

      const msg = {
        to: Array.isArray(options.to) ? options.to : [options.to],
        from: options.from || this.fromEmail,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          type: att.contentType,
          disposition: 'attachment'
        }))
      };

      if (options.templateId && options.templateData) {
        Object.assign(msg, {
          templateId: options.templateId,
          dynamicTemplateData: options.templateData
        });
      }

      const result = await sgMail.send(msg);
      
      emailLogger.info('Email sent via SendGrid', {
        to: options.to,
        subject: options.subject,
        messageId: result[0]?.headers?.['x-message-id']
      });

      return {
        success: true,
        messageId: result[0]?.headers?.['x-message-id']
      };
    } catch (error) {
      emailLogger.error('SendGrid email failed', {
        to: options.to,
        subject: options.subject,
        error: String(error)
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async sendBulkEmail(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 100;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(email => this.sendEmail(email));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

/**
 * Resend Email Provider
 */
export class ResendProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const ResendModule = await import('resend').catch(() => null);
      if (!ResendModule) {
        throw new Error('Resend not available');
      }
      const { Resend } = ResendModule;
      const resend = new Resend(this.apiKey);

      const result = await resend.emails.send({
        to: Array.isArray(options.to) ? options.to : [options.to],
        from: options.from || this.fromEmail,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content
        }))
      });

      emailLogger.info('Email sent via Resend', {
        to: options.to,
        subject: options.subject,
        messageId: result.data?.id
      });

      return {
        success: true,
        messageId: result.data?.id
      };
    } catch (error) {
      emailLogger.error('Resend email failed', {
        to: options.to,
        subject: options.subject,
        error: String(error)
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async sendBulkEmail(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

/**
 * SMTP Email Provider (using Nodemailer)
 */
export class SMTPProvider implements EmailProvider {
  private transporter: any;
  private fromEmail: string;

  constructor(config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    fromEmail: string;
  }) {
    this.fromEmail = config.fromEmail;
    this.initializeTransporter(config);
  }

  private async initializeTransporter(config: any) {
    try {
      const nodemailer = await import('nodemailer').catch(() => null);
      if (!nodemailer) {
        throw new Error('Nodemailer not available');
      }
      this.transporter = nodemailer.createTransporter({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth
      });
    } catch (error) {
      emailLogger.error('Failed to initialize SMTP transporter', {
        error: String(error)
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter not initialized');
      }

      const mailOptions = {
        from: options.from || this.fromEmail,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc?.join(', '),
        bcc: options.bcc?.join(', '),
        attachments: options.attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      emailLogger.info('Email sent via SMTP', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      emailLogger.error('SMTP email failed', {
        to: options.to,
        subject: options.subject,
        error: String(error)
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async sendBulkEmail(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
    }
    
    return results;
  }
}

/**
 * Development Email Provider (logs emails instead of sending)
 */
export class DevEmailProvider implements EmailProvider {
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    emailLogger.info('📧 DEV EMAIL - Would send email:', {
      to: options.to,
      from: options.from,
      subject: options.subject,
      html: options.html?.substring(0, 200) + '...',
      text: options.text?.substring(0, 200) + '...',
      templateId: options.templateId,
      templateData: options.templateData
    });

    // In development, always succeed
    return {
      success: true,
      messageId: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  async sendBulkEmail(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    
    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
    }
    
    return results;
  }
}

/**
 * Main Email Service
 */
class EmailService {
  private provider: EmailProvider;
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    this.provider = this.createProvider();
    this.loadTemplates();
  }

  private createProvider(): EmailProvider {
    const environment = process.env.NODE_ENV;
    
    if (environment === 'development') {
      return new DevEmailProvider();
    }

    // Production email providers
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      fromEmail: process.env.FROM_EMAIL || 'noreply@example.com'
    };

    if (sendgridKey) {
      return new SendGridProvider(sendgridKey, process.env.FROM_EMAIL || 'noreply@example.com');
    } else if (resendKey) {
      return new ResendProvider(resendKey, process.env.FROM_EMAIL || 'noreply@example.com');
    } else if (smtpConfig.host && smtpConfig.auth.user) {
      return new SMTPProvider(smtpConfig);
    } else {
      emailLogger.info('No email provider configured, using development provider for local emails');
      return new DevEmailProvider();
    }
  }

  private loadTemplates() {
    // Load email templates
    this.templates.set('email-verification', {
      id: 'email-verification',
      name: 'Email Verification',
      subject: 'Verify your email address',
      html: '', // Will be loaded from template files
      variables: ['firstName', 'verificationUrl', 'companyName']
    });

    this.templates.set('recruiter-invitation', {
      id: 'recruiter-invitation',
      name: 'Recruiter Invitation',
      subject: 'You\'re invited to join {{companyName}} as a recruiter',
      html: '',
      variables: ['firstName', 'companyName', 'inviteUrl', 'inviterName']
    });

    this.templates.set('interview-scheduled', {
      id: 'interview-scheduled',
      name: 'Interview Scheduled',
      subject: 'Interview scheduled for {{jobTitle}} position',
      html: '',
      variables: ['candidateName', 'jobTitle', 'companyName', 'interviewDate', 'interviewTime', 'meetingLink']
    });

    // Add more templates as needed
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      emailLogger.info('Sending email', {
        to: options.to,
        subject: options.subject,
        templateId: options.templateId
      });

      const result = await this.provider.sendEmail(options);
      
      if (result.success) {
        emailLogger.info('Email sent successfully', {
          to: options.to,
          messageId: result.messageId
        });
      } else {
        emailLogger.error('Email send failed', {
          to: options.to,
          error: result.error
        });
      }

      return result;
    } catch (error) {
      emailLogger.error('Email service error', {
        to: options.to,
        error: String(error)
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async sendTemplateEmail(
    templateId: string,
    to: string | string[],
    templateData: Record<string, any>,
    options?: Partial<EmailOptions>
  ): Promise<EmailResult> {
    const template = this.templates.get(templateId);
    
    if (!template) {
      return {
        success: false,
        error: `Template ${templateId} not found`
      };
    }

    // Replace template variables in subject and content
    const subject = this.replaceTemplateVariables(template.subject, templateData);
    const html = await this.getTemplateHtml(templateId, templateData);

    return this.sendEmail({
      to,
      subject,
      html,
      templateId,
      templateData,
      ...options
    });
  }

  async sendBulkEmail(emails: EmailOptions[]): Promise<EmailResult[]> {
    emailLogger.info('Sending bulk emails', { count: emails.length });
    
    const results = await this.provider.sendBulkEmail(emails);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    emailLogger.info('Bulk email completed', {
      total: emails.length,
      success: successCount,
      failed: failureCount
    });
    
    return results;
  }

  private replaceTemplateVariables(text: string, data: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  private async getTemplateHtml(templateId: string, data: Record<string, any>): Promise<string> {
    // In a real implementation, you would load HTML templates from files
    // For now, return basic HTML templates
    
    switch (templateId) {
      case 'email-verification':
        return this.getEmailVerificationTemplate(data);
      case 'recruiter-invitation':
        return this.getRecruiterInvitationTemplate(data);
      case 'interview-scheduled':
        return this.getInterviewScheduledTemplate(data);
      default:
        return '<p>Template not found</p>';
    }
  }

  private getEmailVerificationTemplate(data: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Welcome to ${data.companyName || 'TalentAI'}!</h1>
          
          <p>Hello ${data.firstName},</p>
          
          <p>Thank you for signing up! Please verify your email address to complete your registration and access all features.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${data.verificationUrl}</p>
          
          <p>This verification link will expire in 24 hours.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getRecruiterInvitationTemplate(data: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recruiter Invitation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">You're Invited to Join ${data.companyName}!</h1>
          
          <p>Hello ${data.firstName},</p>
          
          <p>${data.inviterName} has invited you to join <strong>${data.companyName}</strong> as a recruiter on our AI-powered talent platform.</p>
          
          <p>As a recruiter, you'll have access to:</p>
          <ul>
            <li>AI-powered candidate matching</li>
            <li>Advanced search and filtering tools</li>
            <li>Interview scheduling and management</li>
            <li>Comprehensive analytics and reporting</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.inviteUrl}" 
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${data.inviteUrl}</p>
          
          <p>This invitation will expire in 7 days.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private getInterviewScheduledTemplate(data: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Interview Scheduled</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Interview Scheduled</h1>
          
          <p>Hello ${data.candidateName},</p>
          
          <p>Great news! Your interview has been scheduled for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Interview Details</h3>
            <p><strong>Position:</strong> ${data.jobTitle}</p>
            <p><strong>Company:</strong> ${data.companyName}</p>
            <p><strong>Date:</strong> ${data.interviewDate}</p>
            <p><strong>Time:</strong> ${data.interviewTime}</p>
            ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ''}
          </div>
          
          <p>Please make sure to:</p>
          <ul>
            <li>Join the meeting 5 minutes early</li>
            <li>Test your camera and microphone beforehand</li>
            <li>Have your resume and any questions ready</li>
            <li>Find a quiet, well-lit space for the interview</li>
          </ul>
          
          ${data.meetingLink ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.meetingLink}" 
               style="background-color: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Join Interview
            </a>
          </div>
          ` : ''}
          
          <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>
          
          <p>Good luck with your interview!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  // Utility methods for common email types
  async sendVerificationEmail(email: string, firstName: string, verificationUrl: string): Promise<EmailResult> {
    return this.sendTemplateEmail('email-verification', email, {
      firstName,
      verificationUrl,
      companyName: process.env.COMPANY_NAME || 'TalentAI'
    });
  }

  async sendRecruiterInvitation(
    email: string,
    firstName: string,
    companyName: string,
    inviteUrl: string,
    inviterName: string
  ): Promise<EmailResult> {
    return this.sendTemplateEmail('recruiter-invitation', email, {
      firstName,
      companyName,
      inviteUrl,
      inviterName
    });
  }

  async sendInterviewNotification(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    interviewDate: string,
    interviewTime: string,
    meetingLink?: string
  ): Promise<EmailResult> {
    return this.sendTemplateEmail('interview-scheduled', candidateEmail, {
      candidateName,
      jobTitle,
      companyName,
      interviewDate,
      interviewTime,
      meetingLink
    });
  }
}

export const emailService = new EmailService();
export default emailService;