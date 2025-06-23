/**
 * HR System Integration Types and Interfaces
 * Defines common interfaces for integrating with various HR systems
 */

export interface HRSystemConfig {
  id: string;
  companyId: string;
  systemType: HRSystemType;
  name: string;
  isActive: boolean;
  credentials: HRCredentials;
  syncSettings: SyncSettings;
  fieldMappings: FieldMapping[];
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export type HRSystemType = 
  | 'bamboohr'
  | 'sage_hr'
  | 'zoho_people'
  | 'servicenow_hr'
  | 'workday'
  | 'adp_workforce'
  | 'paycom'
  | 'namely'
  | 'greenhouse'
  | 'lever'
  | 'icims'
  | 'successfactors'
  | 'oracle_hcm'
  | 'custom_api';

export interface HRCredentials {
  type: 'api_key' | 'oauth2' | 'basic_auth' | 'custom';
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  password?: string;
  baseUrl?: string;
  subdomain?: string;
  customFields?: Record<string, string>;
}

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: 'hourly' | 'daily' | 'weekly' | 'manual';
  syncDirection: 'import_only' | 'export_only' | 'bidirectional';
  syncEntities: {
    employees: boolean;
    departments: boolean;
    jobPositions: boolean;
    applications: boolean;
    interviews: boolean;
    onboardingTasks: boolean;
  };
  conflictResolution: 'platform_wins' | 'hr_system_wins' | 'manual_review';
  enableRealTimeWebhooks: boolean;
}

export interface FieldMapping {
  hrSystemField: string;
  platformField: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  isRequired: boolean;
  transformation?: {
    type: 'direct' | 'format' | 'lookup' | 'custom';
    format?: string;
    lookupTable?: Record<string, string>;
    customFunction?: string;
  };
}

export interface HREmployee {
  id: string;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  jobTitle: string;
  manager?: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'terminated';
  location?: string;
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'intern';
  customFields?: Record<string, any>;
}

export interface HRDepartment {
  id: string;
  name: string;
  description?: string;
  parentDepartment?: string;
  manager?: string;
  location?: string;
  budget?: number;
  headcount?: number;
}

export interface HRJobPosition {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
  location: string;
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'intern';
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  status: 'open' | 'closed' | 'on_hold';
  hiringManager: string;
  requisitionNumber?: string;
  createdDate: string;
  targetStartDate?: string;
}

export interface SyncResult {
  success: boolean;
  syncId: string;
  timestamp: string;
  stats: {
    totalRecords: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  errors?: SyncError[];
  warnings?: string[];
}

export interface SyncError {
  recordId: string;
  field?: string;
  error: string;
  severity: 'error' | 'warning';
}

export interface WebhookPayload {
  systemType: HRSystemType;
  eventType: 'employee.created' | 'employee.updated' | 'employee.terminated' | 'department.created' | 'department.updated' | 'job.created' | 'job.updated' | 'job.closed';
  data: any;
  timestamp: string;
  companyId: string;
}

export interface HRSystemIntegration {
  systemType: HRSystemType;
  name: string;
  description: string;
  logoUrl: string;
  authType: 'api_key' | 'oauth2' | 'basic_auth';
  requiredFields: string[];
  optionalFields: string[];
  supportedFeatures: {
    employeeSync: boolean;
    departmentSync: boolean;
    jobSync: boolean;
    applicationSync: boolean;
    interviewSync: boolean;
    realTimeWebhooks: boolean;
    bidirectionalSync: boolean;
  };
  documentationUrl: string;
  setupInstructions: string[];
}

export abstract class BaseHRAdapter {
  protected config: HRSystemConfig;

  constructor(config: HRSystemConfig) {
    this.config = config;
  }

  abstract validateConnection(): Promise<boolean>;
  abstract getEmployees(lastSync?: string): Promise<HREmployee[]>;
  abstract getDepartments(): Promise<HRDepartment[]>;
  abstract getJobPositions(): Promise<HRJobPosition[]>;
  abstract createEmployee(employee: Partial<HREmployee>): Promise<string>;
  abstract updateEmployee(id: string, employee: Partial<HREmployee>): Promise<boolean>;
  abstract createJobPosition(job: Partial<HRJobPosition>): Promise<string>;
  abstract updateJobPosition(id: string, job: Partial<HRJobPosition>): Promise<boolean>;
  abstract handleWebhook(payload: any): Promise<WebhookPayload>;

  protected transformData(data: any, mappings: FieldMapping[]): any {
    const transformed: any = {};
    
    for (const mapping of mappings) {
      const sourceValue = this.getNestedValue(data, mapping.hrSystemField);
      
      if (sourceValue !== undefined) {
        transformed[mapping.platformField] = this.applyTransformation(
          sourceValue,
          mapping.transformation
        );
      }
    }
    
    return transformed;
  }

  protected getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  protected applyTransformation(value: any, transformation?: FieldMapping['transformation']): any {
    if (!transformation || transformation.type === 'direct') {
      return value;
    }

    switch (transformation.type) {
      case 'format':
        return this.formatValue(value, transformation.format);
      case 'lookup':
        return transformation.lookupTable?.[value] || value;
      case 'custom':
        return this.executeCustomFunction(value, transformation.customFunction);
      default:
        return value;
    }
  }

  protected formatValue(value: any, format?: string): any {
    if (!format) return value;
    
    // Basic date formatting
    if (format.includes('YYYY-MM-DD') && value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    
    // Add more formatting logic as needed
    return value;
  }

  protected executeCustomFunction(value: any, functionName?: string): any {
    // Placeholder for custom transformation functions
    // In production, this would execute registered transformation functions
    return value;
  }
}