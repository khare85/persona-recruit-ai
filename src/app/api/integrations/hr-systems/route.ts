import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { hrIntegrationService } from '@/services/integrations/hrIntegrationService';
import { getAllHRSystemIntegrations } from '@/services/integrations/registry';

/**
 * GET /api/integrations/hr-systems - Get available HR system integrations
 */
export const GET = withRateLimit('standard',
  withAuth(
    withRole(['company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const userRole = req.user!.role;

        apiLogger.info('Fetching HR system integrations', {
          userId,
          userRole
        });

        // Get all available HR system integrations
        const integrations = getAllHRSystemIntegrations();

        // Get configured integrations for the company
        const companyId = userRole === 'super_admin' ? 
          req.nextUrl.searchParams.get('companyId') : 
          req.user?.companyId;

        const configuredIntegrations: any[] = [];
        if (companyId) {
          // TODO: Get configured integrations from database
          // configuredIntegrations = await databaseService.getHRIntegrations(companyId);
        }

        return NextResponse.json({
          success: true,
          data: {
            availableIntegrations: integrations,
            configuredIntegrations,
            categories: {
              'Complete HR Platforms': integrations.filter(i => 
                ['bamboohr', 'sage_hr', 'zoho_people', 'workday', 'adp_workforce', 'paycom', 'namely'].includes(i.systemType)
              ),
              'Enterprise Solutions': integrations.filter(i => 
                ['servicenow_hr', 'workday', 'successfactors', 'oracle_hcm'].includes(i.systemType)
              ),
              'Recruiting Focused': integrations.filter(i => 
                ['greenhouse', 'lever', 'icims'].includes(i.systemType)
              ),
              'Custom Solutions': integrations.filter(i => 
                i.systemType === 'custom_api'
              )
            }
          }
        });

      } catch (error) {
        apiLogger.error('Failed to fetch HR system integrations', {
          userId: req.user?.id,
          error: String(error)
        });
        return handleApiError(error);
      }
    })
  )
);

/**
 * POST /api/integrations/hr-systems - Create new HR system integration
 */
export const POST = withRateLimit('create',
  withAuth(
    withRole(['company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const body = await req.json();

        const {
          systemType,
          name,
          credentials,
          syncSettings,
          fieldMappings
        } = body;

        apiLogger.info('Creating HR system integration', {
          userId,
          systemType,
          name
        });

        // Validate required fields
        if (!systemType || !name || !credentials) {
          return NextResponse.json(
            { error: 'Missing required fields: systemType, name, credentials' },
            { status: 400 }
          );
        }

        const companyId = userRole === 'super_admin' ? 
          body.companyId : 
          req.user?.companyId;

        if (!companyId) {
          return NextResponse.json(
            { error: 'Company ID is required' },
            { status: 400 }
          );
        }

        // Create integration configuration
        const config = {
          id: `hr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          companyId,
          systemType,
          name,
          isActive: false, // Start as inactive until tested
          credentials,
          syncSettings: syncSettings || {
            autoSync: false,
            syncInterval: 'daily',
            syncDirection: 'import_only',
            syncEntities: {
              employees: true,
              departments: true,
              jobPositions: true,
              applications: false,
              interviews: false,
              onboardingTasks: false
            },
            conflictResolution: 'platform_wins',
            enableRealTimeWebhooks: false
          },
          fieldMappings: fieldMappings || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Test connection before saving
        const connectionValid = await hrIntegrationService.testConnection(config);
        if (!connectionValid) {
          return NextResponse.json(
            { error: 'Failed to connect to HR system. Please check your credentials.' },
            { status: 400 }
          );
        }

        // TODO: Save configuration to database
        // const configId = await databaseService.createHRIntegration(config);

        apiLogger.info('HR system integration created successfully', {
          configId: config.id,
          systemType,
          companyId
        });

        return NextResponse.json({
          success: true,
          data: {
            configId: config.id,
            systemType,
            name,
            connectionStatus: 'connected'
          },
          message: 'HR system integration created successfully'
        }, { status: 201 });

      } catch (error) {
        apiLogger.error('Failed to create HR system integration', {
          userId: req.user?.id,
          error: String(error)
        });
        return handleApiError(error);
      }
    })
  )
);