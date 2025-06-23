import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

const bulkActionSchema = z.object({
  applicationIds: z.array(z.string()).min(1, 'At least one application ID is required'),
  action: z.enum(['approve', 'reject', 'move_to_review', 'schedule_interviews'])
});

/**
 * POST /api/company/applications/bulk - Perform bulk actions on applications
 */
export const POST = withRateLimit('bulk_action',
  withAuth(
    withRole(['recruiter', 'company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const body = await req.json();

        const validation = bulkActionSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid bulk action data',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const { applicationIds, action } = validation.data;

        apiLogger.info('Performing bulk action on applications', {
          userId,
          userRole,
          action,
          applicationCount: applicationIds.length
        });

        // Verify user has access to these applications
        let companyId: string | undefined;
        if (userRole !== 'super_admin') {
          const user = await databaseService.getUserById(userId);
          companyId = user?.companyId;
        }

        // Get all applications to verify access
        const applications = await Promise.all(
          applicationIds.map(id => databaseService.getJobApplicationById(id))
        );

        // Check if any applications don't exist or user doesn't have access
        const inaccessibleApps = applications.filter((app, index) => {
          if (!app) return true;
          if (userRole === 'super_admin') return false;
          return app.companyId !== companyId;
        });

        if (inaccessibleApps.length > 0) {
          return NextResponse.json(
            { error: 'Access denied to some applications' },
            { status: 403 }
          );
        }

        // Determine new status based on action
        let newStatus: string;
        switch (action) {
          case 'approve':
            newStatus = 'under_review';
            break;
          case 'reject':
            newStatus = 'rejected';
            break;
          case 'move_to_review':
            newStatus = 'under_review';
            break;
          case 'schedule_interviews':
            newStatus = 'interview_scheduled';
            break;
          default:
            return NextResponse.json(
              { error: 'Invalid action' },
              { status: 400 }
            );
        }

        // Perform bulk update
        const updatePromises = applicationIds.map(applicationId =>
          databaseService.updateJobApplication(applicationId, {
            status: newStatus,
            lastUpdated: new Date().toISOString(),
            updatedBy: userId
          })
        );

        await Promise.all(updatePromises);

        // Send notifications for status changes
        if (action === 'approve' || action === 'reject') {
          await sendBulkStatusNotifications(applications.filter(Boolean), newStatus, userId);
        }

        // Log the bulk action
        await logBulkAction(userId, action, applicationIds, newStatus);

        apiLogger.info('Bulk action completed successfully', {
          userId,
          action,
          applicationCount: applicationIds.length,
          newStatus
        });

        return NextResponse.json({
          success: true,
          message: `Successfully ${action.replace('_', ' ')} ${applicationIds.length} application(s)`,
          updatedCount: applicationIds.length
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * Send notifications for bulk status changes
 */
async function sendBulkStatusNotifications(
  applications: any[], 
  newStatus: string, 
  updatedBy: string
): Promise<void> {
  try {
    // In development, just log the notifications
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📧 BULK STATUS CHANGE NOTIFICATIONS');
      console.log('Status:', newStatus);
      console.log('Updated by:', updatedBy);
      console.log('Applications:', applications.length);
      console.log('');
      return;
    }

    // TODO: Implement actual email notifications
    // This would batch send emails to all affected candidates
    
    apiLogger.info('Bulk status notifications sent', {
      applicationsCount: applications.length,
      newStatus,
      updatedBy
    });

  } catch (error) {
    apiLogger.error('Failed to send bulk notifications', {
      error: String(error),
      applicationsCount: applications.length
    });
  }
}

/**
 * Log bulk action for audit trail
 */
async function logBulkAction(
  userId: string,
  action: string,
  applicationIds: string[],
  newStatus: string
): Promise<void> {
  try {
    // Create audit log entry
    await databaseService.createAuditLog({
      userId,
      action: `bulk_${action}`,
      resourceType: 'job_applications',
      resourceIds: applicationIds,
      details: {
        action,
        newStatus,
        applicationCount: applicationIds.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    apiLogger.error('Failed to log bulk action', {
      error: String(error),
      userId,
      action
    });
  }
}