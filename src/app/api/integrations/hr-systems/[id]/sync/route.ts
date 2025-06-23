import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { hrIntegrationService } from '@/services/integrations/hrIntegrationService';

/**
 * POST /api/integrations/hr-systems/[id]/sync - Trigger HR system sync
 */
export const POST = withRateLimit('sync',
  withAuth(
    withRole(['company_admin', 'super_admin'], async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      try {
        const configId = params.id;
        const userId = req.user!.id;
        const body = await req.json();

        const { entityTypes } = body; // Optional: specific entities to sync

        apiLogger.info('Triggering HR system sync', {
          userId,
          configId,
          entityTypes
        });

        // Perform the sync
        const syncResult = await hrIntegrationService.performSync(configId, entityTypes);

        if (syncResult.success) {
          return NextResponse.json({
            success: true,
            data: syncResult,
            message: 'HR system sync completed successfully'
          });
        } else {
          return NextResponse.json({
            success: false,
            data: syncResult,
            message: 'HR system sync completed with errors'
          }, { status: 207 }); // Multi-status
        }

      } catch (error) {
        apiLogger.error('Failed to trigger HR system sync', {
          userId: req.user?.id,
          configId: params.id,
          error: String(error)
        });
        return handleApiError(error);
      }
    })
  )
);

/**
 * GET /api/integrations/hr-systems/[id]/sync - Get sync history
 */
export const GET = withRateLimit('standard',
  withAuth(
    withRole(['company_admin', 'super_admin'], async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      try {
        const configId = params.id;
        const userId = req.user!.id;
        const { searchParams } = new URL(req.url);
        
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        apiLogger.info('Fetching HR sync history', {
          userId,
          configId,
          limit,
          offset
        });

        // TODO: Get sync history from database
        // const syncHistory = await databaseService.getHRSyncHistory(configId, { limit, offset });

        // Mock response for now
        const syncHistory = {
          syncs: [
            {
              id: 'sync_1',
              timestamp: '2024-01-15T10:30:00Z',
              status: 'completed',
              stats: {
                totalRecords: 150,
                successful: 148,
                failed: 2,
                skipped: 0
              },
              duration: '2m 15s'
            },
            {
              id: 'sync_2',
              timestamp: '2024-01-14T10:30:00Z',
              status: 'completed',
              stats: {
                totalRecords: 145,
                successful: 145,
                failed: 0,
                skipped: 0
              },
              duration: '1m 45s'
            }
          ],
          total: 10,
          hasMore: true
        };

        return NextResponse.json({
          success: true,
          data: syncHistory
        });

      } catch (error) {
        apiLogger.error('Failed to fetch HR sync history', {
          userId: req.user?.id,
          configId: params.id,
          error: String(error)
        });
        return handleApiError(error);
      }
    })
  )
);