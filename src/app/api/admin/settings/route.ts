import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

/**
 * GET /api/admin/settings - Get platform settings
 */
export const GET = withAuth(
  withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      apiLogger.info('Fetching admin settings', { userId: req.user?.id });

      // Mock settings data - in a real app, this would come from a settings database
      const settings = {
        platform: {
          name: 'AI Talent Stream',
          description: 'AI-powered recruitment platform',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          maintenanceMode: false,
          allowRegistration: true,
          requireEmailVerification: true,
        },
        email: {
          provider: 'development',
          fromName: 'AI Talent Stream',
          fromEmail: 'noreply@aitalentstream.com',
          replyTo: 'support@aitalentstream.com',
        },
        storage: {
          provider: 'firebase',
          maxFileSize: '50MB',
          allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'mp4', 'webm'],
          videoMaxSize: '100MB',
        },
        ai: {
          embeddingModel: 'text-embedding-ada-002',
          maxTokens: 4000,
          temperature: 0.7,
          enableAutoMatching: true,
          matchingThreshold: 0.8,
        },
        security: {
          sessionTimeout: 86400, // 24 hours
          maxLoginAttempts: 5,
          requireMFA: false,
          passwordMinLength: 8,
          passwordRequireSpecialChars: true,
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          webhookEnabled: false,
        },
        analytics: {
          trackingEnabled: true,
          retentionDays: 90,
          anonymizeData: true,
        },
        limits: {
          companiesPerPlan: {
            starter: 1,
            pro: 5,
            enterprise: -1, // unlimited
          },
          jobsPerCompany: {
            starter: 10,
            pro: 50,
            enterprise: -1, // unlimited
          },
          candidatesPerJob: 1000,
        }
      };

      return NextResponse.json({
        success: true,
        data: settings
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);

/**
 * PUT /api/admin/settings - Update platform settings
 */
export const PUT = withAuth(
  withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const body = await req.json();
      apiLogger.info('Updating admin settings', { userId: req.user?.id, updates: Object.keys(body) });

      // In a real app, validate and save settings to database
      // For now, just return success
      
      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully'
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);