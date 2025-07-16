/**
 * Email templates for various system notifications
 */

export interface EmailTemplateData {
  [key: string]: any;
}

export const EMAIL_TEMPLATES = {
  // Billing & Subscription Templates
  SUBSCRIPTION_WELCOME: {
    id: 'subscription-welcome',
    name: 'Subscription Welcome',
    subject: 'Welcome to {{planName}} - Your subscription is active!',
    getHtml: (data: EmailTemplateData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${data.planName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Welcome to ${data.planName}!</h1>
          
          <p>Hello ${data.firstName},</p>
          
          <p>Thank you for subscribing to our <strong>${data.planName}</strong> plan! Your subscription is now active and you have access to all premium features.</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Your Plan Details</h3>
            <p><strong>Plan:</strong> ${data.planName}</p>
            <p><strong>Price:</strong> $${data.price}/month</p>
            <p><strong>Next billing date:</strong> ${data.nextBillingDate}</p>
            <p><strong>Features included:</strong></p>
            <ul>
              ${data.features?.map((feature: string) => `<li>${feature}</li>`).join('') || ''}
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p>If you have any questions about your subscription, you can manage it anytime in your billing settings.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.billingUrl}" 
               style="background-color: #6b7280; color: white; padding: 8px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 14px;">
              Manage Billing
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            Questions? Contact us at billing@persona-recruit.ai
          </p>
        </div>
      </body>
      </html>
    `
  },

  SUBSCRIPTION_CANCELED: {
    id: 'subscription-canceled',
    name: 'Subscription Canceled',
    subject: 'Your subscription has been canceled',
    getHtml: (data: EmailTemplateData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Subscription Canceled</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">Subscription Canceled</h1>
          
          <p>Hello ${data.firstName},</p>
          
          <p>We're sorry to see you go! Your subscription has been canceled as requested.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #991b1b;">Cancellation Details</h3>
            <p><strong>Plan:</strong> ${data.planName}</p>
            <p><strong>Access until:</strong> ${data.accessUntil}</p>
            <p><strong>Canceled on:</strong> ${data.canceledDate}</p>
          </div>
          
          <p>You'll continue to have access to all features until ${data.accessUntil}. After that, your account will be downgraded to the free tier.</p>
          
          <p>If you change your mind, you can resubscribe anytime before ${data.accessUntil} and your service will continue uninterrupted.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resubscribeUrl}" 
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Resubscribe Now
            </a>
          </div>
          
          <p>We'd love to hear why you decided to cancel. Your feedback helps us improve our service.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.feedbackUrl}" 
               style="background-color: #6b7280; color: white; padding: 8px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 14px;">
              Share Feedback
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            Questions? Contact us at billing@persona-recruit.ai
          </p>
        </div>
      </body>
      </html>
    `
  },

  PAYMENT_FAILED: {
    id: 'payment-failed',
    name: 'Payment Failed',
    subject: 'Payment failed - Action required',
    getHtml: (data: EmailTemplateData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Failed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">Payment Failed</h1>
          
          <p>Hello ${data.firstName},</p>
          
          <p>We were unable to process your payment for the <strong>${data.planName}</strong> subscription. Your account access may be limited until payment is resolved.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #991b1b;">Payment Details</h3>
            <p><strong>Plan:</strong> ${data.planName}</p>
            <p><strong>Amount:</strong> $${data.amount}</p>
            <p><strong>Payment method:</strong> ${data.paymentMethod}</p>
            <p><strong>Failed on:</strong> ${data.failedDate}</p>
          </div>
          
          <p>Please update your payment method or retry the payment to continue using our service without interruption.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.updatePaymentUrl}" 
               style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Update Payment Method
            </a>
          </div>
          
          <p>If you continue to experience issues, please contact our support team.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            Questions? Contact us at billing@persona-recruit.ai
          </p>
        </div>
      </body>
      </html>
    `
  },

  PASSWORD_RESET: {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset your password',
    getHtml: (data: EmailTemplateData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Reset Your Password</h1>
          
          <p>Hello ${data.firstName},</p>
          
          <p>We received a request to reset your password for your TalentAI account. If you didn't make this request, you can safely ignore this email.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${data.resetUrl}</p>
          
          <p>This password reset link will expire in 1 hour for security reasons.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
      </body>
      </html>
    `
  },

  COMPANY_INVITATION: {
    id: 'company-invitation',
    name: 'Company Invitation',
    subject: 'You\'ve been invited to join {{companyName}}',
    getHtml: (data: EmailTemplateData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Company Invitation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">You're Invited to Join ${data.companyName}!</h1>
          
          <p>Hello ${data.firstName},</p>
          
          <p>${data.inviterName} has invited you to join <strong>${data.companyName}</strong> as a <strong>${data.role}</strong> on our TalentAI platform.</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Invitation Details</h3>
            <p><strong>Company:</strong> ${data.companyName}</p>
            <p><strong>Role:</strong> ${data.role}</p>
            <p><strong>Invited by:</strong> ${data.inviterName}</p>
            <p><strong>Department:</strong> ${data.department || 'Not specified'}</p>
          </div>
          
          <p>By accepting this invitation, you'll have access to:</p>
          <ul>
            <li>AI-powered talent matching and recruitment tools</li>
            <li>Advanced candidate screening and assessment</li>
            <li>Interview scheduling and management</li>
            <li>Comprehensive analytics and reporting</li>
            <li>Team collaboration features</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.invitationUrl}" 
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${data.invitationUrl}</p>
          
          <p>This invitation will expire in 7 days.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            If you weren't expecting this invitation, you can safely ignore this email.
          </p>
        </div>
      </body>
      </html>
    `
  },

  CANDIDATE_APPLICATION_RECEIVED: {
    id: 'candidate-application-received',
    name: 'Application Received',
    subject: 'Your application for {{jobTitle}} has been received',
    getHtml: (data: EmailTemplateData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">Application Received!</h1>
          
          <p>Hello ${data.candidateName},</p>
          
          <p>Thank you for applying for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>. We've received your application and our team will review it shortly.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #166534;">Application Details</h3>
            <p><strong>Position:</strong> ${data.jobTitle}</p>
            <p><strong>Company:</strong> ${data.companyName}</p>
            <p><strong>Location:</strong> ${data.jobLocation}</p>
            <p><strong>Applied on:</strong> ${data.applicationDate}</p>
            <p><strong>Application ID:</strong> ${data.applicationId}</p>
          </div>
          
          <p>Here's what happens next:</p>
          <ol>
            <li>Our AI will analyze your profile and match it with the job requirements</li>
            <li>The hiring team will review your application</li>
            <li>If you're a good fit, we'll contact you for the next steps</li>
            <li>You'll receive updates on your application status</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.applicationUrl}" 
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Application
            </a>
          </div>
          
          <p>You can track your application status and manage your profile in your candidate dashboard.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            Questions about your application? Contact us at careers@persona-recruit.ai
          </p>
        </div>
      </body>
      </html>
    `
  },

  RECRUITER_NEW_APPLICATION: {
    id: 'recruiter-new-application',
    name: 'New Application Received',
    subject: 'New application for {{jobTitle}} - {{candidateName}}',
    getHtml: (data: EmailTemplateData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Application Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">New Application Received</h1>
          
          <p>Hello ${data.recruiterName},</p>
          
          <p>A new candidate has applied for the <strong>${data.jobTitle}</strong> position. Here are the details:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Candidate Information</h3>
            <p><strong>Name:</strong> ${data.candidateName}</p>
            <p><strong>Email:</strong> ${data.candidateEmail}</p>
            <p><strong>Location:</strong> ${data.candidateLocation}</p>
            <p><strong>Experience:</strong> ${data.candidateExperience}</p>
            <p><strong>Current Title:</strong> ${data.candidateTitle}</p>
            <p><strong>AI Match Score:</strong> ${data.matchScore}%</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;">Job Details</h3>
            <p><strong>Position:</strong> ${data.jobTitle}</p>
            <p><strong>Department:</strong> ${data.jobDepartment}</p>
            <p><strong>Applied on:</strong> ${data.applicationDate}</p>
            <p><strong>Application ID:</strong> ${data.applicationId}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.applicationUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Review Application
            </a>
          </div>
          
          <p>You can review the full application, candidate profile, and AI analysis in your recruiter dashboard.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 12px; color: #666;">
            Manage your notification preferences in your account settings.
          </p>
        </div>
      </body>
      </html>
    `
  }
} as const;

export type EmailTemplateId = keyof typeof EMAIL_TEMPLATES;