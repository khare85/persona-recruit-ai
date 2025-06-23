/**
 * BambooHR Integration Adapter
 * Handles integration with BambooHR API for employee and job data sync
 */

import { BaseHRAdapter, HREmployee, HRDepartment, HRJobPosition, WebhookPayload, SyncResult } from '../types';
import { integrationLogger } from '@/lib/logger';

export class BambooHRAdapter extends BaseHRAdapter {
  private baseUrl: string;
  private apiKey: string;
  private subdomain: string;

  constructor(config: any) {
    super(config);
    this.subdomain = config.credentials.subdomain;
    this.apiKey = config.credentials.apiKey;
    this.baseUrl = `https://api.bamboohr.com/api/gateway.php/${this.subdomain}/v1`;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/meta/users');
      return response.status === 200;
    } catch (error) {
      integrationLogger.error('BambooHR connection validation failed', {
        error: String(error),
        subdomain: this.subdomain
      });
      return false;
    }
  }

  async getEmployees(lastSync?: string): Promise<HREmployee[]> {
    try {
      const fields = [
        'id', 'employeeNumber', 'firstName', 'lastName', 'workEmail',
        'mobilePhone', 'department', 'jobTitle', 'supervisor', 'hireDate',
        'status', 'location', 'employmentHistoryStatus'
      ].join(',');

      const url = `/employees/directory?fields=${fields}`;
      const response = await this.makeRequest('GET', url);
      
      if (!response.ok) {
        throw new Error(`BambooHR API error: ${response.status}`);
      }

      const data = await response.json();
      const employees = data.employees || [];

      return employees.map((emp: any) => this.transformEmployeeData(emp));
    } catch (error) {
      integrationLogger.error('Failed to fetch BambooHR employees', {
        error: String(error),
        lastSync
      });
      throw error;
    }
  }

  async getDepartments(): Promise<HRDepartment[]> {
    try {
      const response = await this.makeRequest('GET', '/meta/lists/department');
      
      if (!response.ok) {
        throw new Error(`BambooHR API error: ${response.status}`);
      }

      const data = await response.json();
      const departments = data.options || [];

      return departments.map((dept: any) => ({
        id: dept.id.toString(),
        name: dept.name,
        description: dept.name,
        parentDepartment: undefined,
        manager: undefined,
        location: undefined
      }));
    } catch (error) {
      integrationLogger.error('Failed to fetch BambooHR departments', {
        error: String(error)
      });
      throw error;
    }
  }

  async getJobPositions(): Promise<HRJobPosition[]> {
    try {
      // BambooHR doesn't have a direct job positions endpoint
      // We'll get unique job titles from employees
      const employees = await this.getEmployees();
      const uniqueJobTitles = [...new Set(employees.map(emp => emp.jobTitle))];

      return uniqueJobTitles.map((title, index) => ({
        id: `job_${index + 1}`,
        title,
        department: 'Various',
        description: `${title} position`,
        requirements: [],
        location: 'Multiple locations',
        employmentType: 'full_time' as const,
        status: 'open' as const,
        hiringManager: '',
        createdDate: new Date().toISOString()
      }));
    } catch (error) {
      integrationLogger.error('Failed to fetch BambooHR job positions', {
        error: String(error)
      });
      throw error;
    }
  }

  async createEmployee(employee: Partial<HREmployee>): Promise<string> {
    try {
      const bambooEmployee = this.transformToBambooEmployee(employee);
      
      const response = await this.makeRequest('POST', '/employees', bambooEmployee);
      
      if (!response.ok) {
        throw new Error(`Failed to create employee: ${response.status}`);
      }

      const result = await response.json();
      return result.id || result.employeeId;
    } catch (error) {
      integrationLogger.error('Failed to create BambooHR employee', {
        error: String(error),
        employee: employee.email
      });
      throw error;
    }
  }

  async updateEmployee(id: string, employee: Partial<HREmployee>): Promise<boolean> {
    try {
      const bambooEmployee = this.transformToBambooEmployee(employee);
      
      const response = await this.makeRequest('POST', `/employees/${id}`, bambooEmployee);
      
      return response.ok;
    } catch (error) {
      integrationLogger.error('Failed to update BambooHR employee', {
        error: String(error),
        employeeId: id
      });
      throw error;
    }
  }

  async createJobPosition(job: Partial<HRJobPosition>): Promise<string> {
    // BambooHR doesn't support creating job positions via API
    // This would typically be handled through their web interface
    throw new Error('Creating job positions is not supported in BambooHR API');
  }

  async updateJobPosition(id: string, job: Partial<HRJobPosition>): Promise<boolean> {
    // BambooHR doesn't support updating job positions via API
    throw new Error('Updating job positions is not supported in BambooHR API');
  }

  async handleWebhook(payload: any): Promise<WebhookPayload> {
    try {
      // BambooHR webhook payload structure
      const { event, employee } = payload;
      
      let eventType: WebhookPayload['eventType'];
      switch (event) {
        case 'employee-new':
          eventType = 'employee.created';
          break;
        case 'employee-update':
          eventType = 'employee.updated';
          break;
        case 'employee-terminated':
          eventType = 'employee.terminated';
          break;
        default:
          throw new Error(`Unsupported webhook event: ${event}`);
      }

      return {
        systemType: 'bamboohr',
        eventType,
        data: this.transformEmployeeData(employee),
        timestamp: new Date().toISOString(),
        companyId: this.config.companyId
      };
    } catch (error) {
      integrationLogger.error('Failed to handle BambooHR webhook', {
        error: String(error),
        payload
      });
      throw error;
    }
  }

  private async makeRequest(method: string, endpoint: string, body?: any): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:x`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    integrationLogger.info('Making BambooHR API request', {
      method,
      endpoint,
      hasBody: !!body
    });

    return fetch(url, options);
  }

  private transformEmployeeData(bambooEmployee: any): HREmployee {
    return {
      id: bambooEmployee.id?.toString() || bambooEmployee.employeeNumber,
      employeeNumber: bambooEmployee.employeeNumber,
      firstName: bambooEmployee.firstName || '',
      lastName: bambooEmployee.lastName || '',
      email: bambooEmployee.workEmail || bambooEmployee.email || '',
      phone: bambooEmployee.mobilePhone || bambooEmployee.homePhone,
      department: bambooEmployee.department || 'Unknown',
      jobTitle: bambooEmployee.jobTitle || 'Unknown',
      manager: bambooEmployee.supervisor,
      hireDate: bambooEmployee.hireDate || new Date().toISOString(),
      status: this.mapEmployeeStatus(bambooEmployee.status || bambooEmployee.employmentHistoryStatus),
      location: bambooEmployee.location,
      employmentType: this.mapEmploymentType(bambooEmployee.employmentHistoryStatus),
      customFields: {
        bambooId: bambooEmployee.id,
        originalData: bambooEmployee
      }
    };
  }

  private transformToBambooEmployee(employee: Partial<HREmployee>): any {
    const bambooEmployee: any = {};

    if (employee.firstName) bambooEmployee.firstName = employee.firstName;
    if (employee.lastName) bambooEmployee.lastName = employee.lastName;
    if (employee.email) bambooEmployee.workEmail = employee.email;
    if (employee.phone) bambooEmployee.mobilePhone = employee.phone;
    if (employee.department) bambooEmployee.department = employee.department;
    if (employee.jobTitle) bambooEmployee.jobTitle = employee.jobTitle;
    if (employee.hireDate) bambooEmployee.hireDate = employee.hireDate.split('T')[0]; // YYYY-MM-DD format
    if (employee.location) bambooEmployee.location = employee.location;

    return bambooEmployee;
  }

  private mapEmployeeStatus(bambooStatus: string): HREmployee['status'] {
    const status = bambooStatus?.toLowerCase() || '';
    
    if (status.includes('active') || status.includes('employed')) {
      return 'active';
    } else if (status.includes('terminated') || status.includes('separated')) {
      return 'terminated';
    } else {
      return 'inactive';
    }
  }

  private mapEmploymentType(bambooType: string): HREmployee['employmentType'] {
    const type = bambooType?.toLowerCase() || '';
    
    if (type.includes('part') || type.includes('pt')) {
      return 'part_time';
    } else if (type.includes('contract') || type.includes('temp')) {
      return 'contractor';
    } else if (type.includes('intern')) {
      return 'intern';
    } else {
      return 'full_time';
    }
  }
}