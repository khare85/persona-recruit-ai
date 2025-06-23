import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { hrIntegrationService } from '@/services/integrations/hrIntegrationService';

/**
 * POST /api/integrations/hr-systems/[id]/test - Test HR system connection
 */
export const POST = withRateLimit('test',
  withAuth(
    withRole(['company_admin', 'super_admin'], async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      try {
        const configId = params.id;
        const userId = req.user!.id;

        apiLogger.info('Testing HR system connection', {
          userId,
          configId
        });

        // Get the adapter and test connection
        const adapter = await hrIntegrationService.getAdapter(configId);
        const isConnected = await adapter.validateConnection();

        if (isConnected) {
          // Test basic data retrieval
          try {
            const testResults = {
              connection: true,
              dataAccess: {
                employees: false,
                departments: false,
                jobPositions: false
              }
            };

            // Test employee data access
            try {
              const employees = await adapter.getEmployees();
              testResults.dataAccess.employees = true;
              apiLogger.info('Employee data access test successful', {
                configId,
                employeeCount: employees.length
              });
            } catch (error) {
              apiLogger.warn('Employee data access test failed', {
                configId,
                error: String(error)
              });
            }

            // Test department data access
            try {
              const departments = await adapter.getDepartments();
              testResults.dataAccess.departments = true;
              apiLogger.info('Department data access test successful', {
                configId,
                departmentCount: departments.length
              });
            } catch (error) {
              apiLogger.warn('Department data access test failed', {
                configId,
                error: String(error)
              });
            }

            // Test job position data access
            try {
              const positions = await adapter.getJobPositions();
              testResults.dataAccess.jobPositions = true;
              apiLogger.info('Job position data access test successful', {
                configId,
                positionCount: positions.length
              });
            } catch (error) {
              apiLogger.warn('Job position data access test failed', {
                configId,
                error: String(error)
              });
            }

            return NextResponse.json({
              success: true,
              data: {
                connected: true,
                timestamp: new Date().toISOString(),
                tests: testResults,
                message: 'Connection test successful'
              }
            });

          } catch (error) {
            return NextResponse.json({
              success: true,
              data: {
                connected: true,
                timestamp: new Date().toISOString(),
                tests: {
                  connection: true,
                  dataAccess: {
                    employees: false,
                    departments: false,
                    jobPositions: false
                  }
                },
                message: 'Connection successful but data access limited',
                warning: 'Some API endpoints may not be accessible'
              }
            });
          }

        } else {
          return NextResponse.json({
            success: false,
            data: {
              connected: false,
              timestamp: new Date().toISOString(),
              message: 'Connection test failed'
            }
          }, { status: 400 });
        }

      } catch (error) {
        apiLogger.error('HR system connection test failed', {
          userId: req.user?.id,
          configId: params.id,
          error: String(error)
        });

        return NextResponse.json({
          success: false,
          data: {
            connected: false,
            timestamp: new Date().toISOString(),
            message: 'Connection test failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }, { status: 400 });
      }
    })
  )
);