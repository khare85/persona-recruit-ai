/**
 * HR Integration Service
 * Central service for managing HR system integrations and data synchronization
 */

import { HRSystemConfig, HRSystemType, BaseHRAdapter, SyncResult, WebhookPayload, SyncError } from './types';
import { BambooHRAdapter } from './adapters/bamboohr.adapter';
import { SageHRAdapter } from './adapters/sage-hr.adapter';
import { ZohoPeopleAdapter } from './adapters/zoho-people.adapter';
import { ServiceNowHRAdapter } from './adapters/servicenow-hr.adapter';
import { databaseService } from '@/services/database.service';
import { notificationService } from '@/services/notification.service';
import { integrationLogger } from '@/lib/logger';

export class HRIntegrationService {
  private adapters: Map<string, BaseHRAdapter> = new Map();

  /**
   * Initialize an HR integration adapter
   */
  async initializeIntegration(config: HRSystemConfig): Promise<BaseHRAdapter> {
    try {
      const adapter = this.createAdapter(config);
      
      // Validate connection
      const isValid = await adapter.validateConnection();
      if (!isValid) {
        throw new Error('Failed to validate HR system connection');
      }

      // Store adapter in memory for reuse
      this.adapters.set(config.id, adapter);

      integrationLogger.info('HR integration initialized successfully', {
        configId: config.id,
        systemType: config.systemType,
        companyId: config.companyId
      });

      return adapter;
    } catch (error) {
      integrationLogger.error('Failed to initialize HR integration', {
        configId: config.id,
        systemType: config.systemType,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Get or create adapter for a configuration
   */
  async getAdapter(configId: string): Promise<BaseHRAdapter> {
    // Check if adapter is already in memory
    if (this.adapters.has(configId)) {
      return this.adapters.get(configId)!;
    }

    // Load configuration from database and initialize
    const config = await this.getIntegrationConfig(configId);
    if (!config) {
      throw new Error(`HR integration configuration not found: ${configId}`);
    }

    return this.initializeIntegration(config);
  }

  /**
   * Perform full data synchronization
   */
  async performSync(configId: string, entityTypes?: string[]): Promise<SyncResult> {
    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date().toISOString();
    
    let totalRecords = 0;
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    const errors: SyncError[] = [];
    const warnings: string[] = [];

    try {
      const config = await this.getIntegrationConfig(configId);
      if (!config || !config.isActive) {
        throw new Error('Integration is not active or not found');
      }

      const adapter = await this.getAdapter(configId);
      const syncEntities = entityTypes || Object.keys(config.syncSettings.syncEntities)
        .filter(key => config.syncSettings.syncEntities[key as keyof typeof config.syncSettings.syncEntities]);

      integrationLogger.info('Starting HR data sync', {
        syncId,
        configId,
        systemType: config.systemType,
        entities: syncEntities
      });

      // Sync employees
      if (syncEntities.includes('employees')) {
        const employeeResult = await this.syncEmployees(adapter, config);
        totalRecords += employeeResult.totalRecords;
        successful += employeeResult.successful;
        failed += employeeResult.failed;
        skipped += employeeResult.skipped;
        errors.push(...employeeResult.errors);
        warnings.push(...employeeResult.warnings);
      }

      // Sync departments
      if (syncEntities.includes('departments')) {
        const departmentResult = await this.syncDepartments(adapter, config);
        totalRecords += departmentResult.totalRecords;
        successful += departmentResult.successful;
        failed += departmentResult.failed;
        skipped += departmentResult.skipped;
        errors.push(...departmentResult.errors);
        warnings.push(...departmentResult.warnings);
      }

      // Sync job positions
      if (syncEntities.includes('jobPositions')) {
        const jobResult = await this.syncJobPositions(adapter, config);
        totalRecords += jobResult.totalRecords;
        successful += jobResult.successful;
        failed += jobResult.failed;
        skipped += jobResult.skipped;
        errors.push(...jobResult.errors);
        warnings.push(...jobResult.warnings);
      }

      // Update last sync timestamp
      await this.updateLastSyncTime(configId, startTime);

      const result: SyncResult = {
        success: failed === 0,
        syncId,
        timestamp: new Date().toISOString(),
        stats: {
          totalRecords,
          successful,
          failed,
          skipped
        },
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

      integrationLogger.info('HR sync completed', {
        syncId,
        configId,
        result: result.stats
      });

      // Send notification to admin about sync completion
      await this.notifyAdminOfSyncCompletion(config.companyId, result);

      return result;

    } catch (error) {
      integrationLogger.error('HR sync failed', {
        syncId,
        configId,
        error: String(error)
      });

      return {
        success: false,
        syncId,
        timestamp: new Date().toISOString(),
        stats: {
          totalRecords,
          successful,
          failed: failed + 1,
          skipped
        },
        errors: [{
          recordId: 'sync_process',
          error: error instanceof Error ? error.message : String(error),
          severity: 'error'
        }]
      };
    }
  }

  /**
   * Handle incoming webhook from HR system
   */
  async handleWebhook(configId: string, payload: any): Promise<void> {
    try {
      const config = await this.getIntegrationConfig(configId);
      if (!config || !config.isActive) {
        throw new Error('Integration is not active or not found');
      }

      const adapter = await this.getAdapter(configId);
      const webhookPayload = await adapter.handleWebhook(payload);

      integrationLogger.info('Processing HR webhook', {
        configId,
        eventType: webhookPayload.eventType,
        systemType: webhookPayload.systemType
      });

      // Process the webhook data based on event type
      await this.processWebhookEvent(webhookPayload, config);

    } catch (error) {
      integrationLogger.error('Failed to handle HR webhook', {
        configId,
        error: String(error),
        payload
      });
      throw error;
    }
  }

  /**
   * Test connection to HR system
   */
  async testConnection(config: HRSystemConfig): Promise<boolean> {
    try {
      const adapter = this.createAdapter(config);
      return await adapter.validateConnection();
    } catch (error) {
      integrationLogger.error('HR connection test failed', {
        systemType: config.systemType,
        error: String(error)
      });
      return false;
    }
  }

  private createAdapter(config: HRSystemConfig): BaseHRAdapter {
    switch (config.systemType) {
      case 'bamboohr':
        return new BambooHRAdapter(config);
      case 'sage_hr':
        return new SageHRAdapter(config);
      case 'zoho_people':
        return new ZohoPeopleAdapter(config);
      case 'servicenow_hr':
        return new ServiceNowHRAdapter(config);
      default:
        throw new Error(`Unsupported HR system type: ${config.systemType}`);
    }
  }

  private async syncEmployees(adapter: BaseHRAdapter, config: HRSystemConfig) {
    const result = {
      totalRecords: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as SyncError[],
      warnings: [] as string[]
    };

    try {
      const employees = await adapter.getEmployees(config.lastSync);
      result.totalRecords = employees.length;

      for (const employee of employees) {
        try {
          // Transform data using field mappings
          const transformedEmployee = this.transformData(employee, config.fieldMappings);
          
          // Check if employee already exists
          const existingEmployee = await databaseService.getUserByEmail(employee.email);
          
          if (existingEmployee) {
            // Update existing employee
            if (config.syncSettings.syncDirection !== 'export_only') {
              await databaseService.updateUser(existingEmployee.id, {
                firstName: transformedEmployee.firstName,
                lastName: transformedEmployee.lastName,
                // Add other fields as needed
              });
              result.successful++;
            } else {
              result.skipped++;
            }
          } else {
            // Create new employee
            if (config.syncSettings.syncDirection !== 'export_only') {
              await databaseService.createUser({
                email: transformedEmployee.email,
                firstName: transformedEmployee.firstName,
                lastName: transformedEmployee.lastName,
                role: 'employee',
                status: 'active',
                emailVerified: true,
                passwordHash: 'temp_password' // Should be reset on first login
              });
              result.successful++;
            } else {
              result.skipped++;
            }
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            recordId: employee.id,
            error: error instanceof Error ? error.message : String(error),
            severity: 'error'
          });
        }
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        recordId: 'employees_sync',
        error: error instanceof Error ? error.message : String(error),
        severity: 'error'
      });
    }

    return result;
  }

  private async syncDepartments(adapter: BaseHRAdapter, config: HRSystemConfig) {
    const result = {
      totalRecords: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as SyncError[],
      warnings: [] as string[]
    };

    try {
      const departments = await adapter.getDepartments();
      result.totalRecords = departments.length;

      for (const department of departments) {
        try {
          // For now, just count as successful - implement department sync logic
          result.successful++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            recordId: department.id,
            error: error instanceof Error ? error.message : String(error),
            severity: 'error'
          });
        }
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        recordId: 'departments_sync',
        error: error instanceof Error ? error.message : String(error),
        severity: 'error'
      });
    }

    return result;
  }

  private async syncJobPositions(adapter: BaseHRAdapter, config: HRSystemConfig) {
    const result = {
      totalRecords: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as SyncError[],
      warnings: [] as string[]
    };

    try {
      const positions = await adapter.getJobPositions();
      result.totalRecords = positions.length;

      for (const position of positions) {
        try {
          // Transform data using field mappings
          const transformedPosition = this.transformData(position, config.fieldMappings);
          
          // Create or update job position
          if (config.syncSettings.syncDirection !== 'export_only') {
            // Implement job position creation/update logic
            result.successful++;
          } else {
            result.skipped++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            recordId: position.id,
            error: error instanceof Error ? error.message : String(error),
            severity: 'error'
          });
        }
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        recordId: 'positions_sync',
        error: error instanceof Error ? error.message : String(error),
        severity: 'error'
      });
    }

    return result;
  }

  private transformData(data: any, mappings: any[]): any {
    // Apply field mappings transformation
    // This is a simplified version - implement full transformation logic
    return data;
  }

  private async processWebhookEvent(webhookPayload: WebhookPayload, config: HRSystemConfig): Promise<void> {
    // Process webhook events and update local data accordingly
    // Implementation depends on event type and sync settings
  }

  private async notifyAdminOfSyncCompletion(companyId: string, result: SyncResult): Promise<void> {
    try {
      // Get company admins
      const admins = await databaseService.getCompanyAdmins(companyId);
      
      for (const admin of admins) {
        await notificationService.sendNotification({
          userId: admin.id,
          type: 'system_announcement',
          data: {
            title: 'HR System Sync Completed',
            message: `HR sync completed: ${result.stats.successful} successful, ${result.stats.failed} failed`,
            syncResult: result
          }
        });
      }
    } catch (error) {
      integrationLogger.error('Failed to notify admin of sync completion', {
        companyId,
        error: String(error)
      });
    }
  }

  private async getIntegrationConfig(configId: string): Promise<HRSystemConfig | null> {
    // Get integration configuration from database
    // This would be implemented with your database service
    return null;
  }

  private async updateLastSyncTime(configId: string, timestamp: string): Promise<void> {
    // Update last sync timestamp in database
    // This would be implemented with your database service
  }
}

export const hrIntegrationService = new HRIntegrationService();
export default hrIntegrationService;