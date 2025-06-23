/**
 * Sage HR Integration Adapter
 * Handles integration with Sage HR API for employee and organizational data sync
 */

import { BaseHRAdapter, HREmployee, HRDepartment, HRJobPosition, WebhookPayload } from '../types';
import { integrationLogger } from '@/lib/logger';

export class SageHRAdapter extends BaseHRAdapter {
  private baseUrl: string;
  private accessToken: string;
  private refreshToken: string;
  private clientId: string;
  private clientSecret: string;

  constructor(config: any) {
    super(config);
    this.baseUrl = config.credentials.baseUrl || 'https://api.sage.hr';
    this.accessToken = config.credentials.accessToken;
    this.refreshToken = config.credentials.refreshToken;
    this.clientId = config.credentials.clientId;
    this.clientSecret = config.credentials.clientSecret;
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.ensureValidToken();
      const response = await this.makeRequest('GET', '/api/v1/me');
      return response.status === 200;
    } catch (error) {
      integrationLogger.error('Sage HR connection validation failed', {
        error: String(error)
      });
      return false;
    }
  }

  async getEmployees(lastSync?: string): Promise<HREmployee[]> {
    try {
      await this.ensureValidToken();
      
      let url = '/api/v1/employees?include=department,position,manager';
      if (lastSync) {
        url += `&modified_since=${lastSync}`;
      }

      const response = await this.makeRequest('GET', url);
      
      if (!response.ok) {
        throw new Error(`Sage HR API error: ${response.status}`);
      }

      const data = await response.json();
      const employees = data.data || [];

      return employees.map((emp: any) => this.transformEmployeeData(emp));
    } catch (error) {
      integrationLogger.error('Failed to fetch Sage HR employees', {
        error: String(error),
        lastSync
      });
      throw error;
    }
  }

  async getDepartments(): Promise<HRDepartment[]> {
    try {
      await this.ensureValidToken();
      const response = await this.makeRequest('GET', '/api/v1/departments');
      
      if (!response.ok) {
        throw new Error(`Sage HR API error: ${response.status}`);
      }

      const data = await response.json();
      const departments = data.data || [];

      return departments.map((dept: any) => ({
        id: dept.id.toString(),
        name: dept.name,
        description: dept.description,
        parentDepartment: dept.parent_id?.toString(),
        manager: dept.manager_id?.toString(),
        location: dept.location,
        headcount: dept.employee_count
      }));
    } catch (error) {
      integrationLogger.error('Failed to fetch Sage HR departments', {
        error: String(error)
      });
      throw error;
    }
  }

  async getJobPositions(): Promise<HRJobPosition[]> {
    try {
      await this.ensureValidToken();
      const response = await this.makeRequest('GET', '/api/v1/positions');
      
      if (!response.ok) {
        throw new Error(`Sage HR API error: ${response.status}`);
      }

      const data = await response.json();
      const positions = data.data || [];

      return positions.map((pos: any) => ({
        id: pos.id.toString(),
        title: pos.title,
        department: pos.department?.name || 'Unknown',
        description: pos.description || '',
        requirements: pos.requirements ? pos.requirements.split('\n') : [],
        location: pos.location || '',
        employmentType: this.mapEmploymentType(pos.employment_type),
        salaryMin: pos.salary_min,
        salaryMax: pos.salary_max,
        currency: pos.currency || 'USD',
        status: this.mapPositionStatus(pos.status),
        hiringManager: pos.hiring_manager_id?.toString() || '',
        requisitionNumber: pos.requisition_number,
        createdDate: pos.created_at || new Date().toISOString(),
        targetStartDate: pos.target_start_date
      }));
    } catch (error) {
      integrationLogger.error('Failed to fetch Sage HR job positions', {
        error: String(error)
      });
      throw error;
    }
  }

  async createEmployee(employee: Partial<HREmployee>): Promise<string> {
    try {
      await this.ensureValidToken();
      const sageEmployee = this.transformToSageEmployee(employee);
      
      const response = await this.makeRequest('POST', '/api/v1/employees', sageEmployee);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create employee: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      return result.data.id.toString();
    } catch (error) {
      integrationLogger.error('Failed to create Sage HR employee', {
        error: String(error),
        employee: employee.email
      });
      throw error;
    }
  }

  async updateEmployee(id: string, employee: Partial<HREmployee>): Promise<boolean> {
    try {
      await this.ensureValidToken();
      const sageEmployee = this.transformToSageEmployee(employee);
      
      const response = await this.makeRequest('PUT', `/api/v1/employees/${id}`, sageEmployee);
      
      return response.ok;
    } catch (error) {
      integrationLogger.error('Failed to update Sage HR employee', {
        error: String(error),
        employeeId: id
      });
      throw error;
    }
  }

  async createJobPosition(job: Partial<HRJobPosition>): Promise<string> {
    try {
      await this.ensureValidToken();
      const sagePosition = this.transformToSagePosition(job);
      
      const response = await this.makeRequest('POST', '/api/v1/positions', sagePosition);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create position: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      return result.data.id.toString();
    } catch (error) {
      integrationLogger.error('Failed to create Sage HR position', {
        error: String(error),
        position: job.title
      });
      throw error;
    }
  }

  async updateJobPosition(id: string, job: Partial<HRJobPosition>): Promise<boolean> {
    try {
      await this.ensureValidToken();
      const sagePosition = this.transformToSagePosition(job);
      
      const response = await this.makeRequest('PUT', `/api/v1/positions/${id}`, sagePosition);
      
      return response.ok;
    } catch (error) {
      integrationLogger.error('Failed to update Sage HR position', {
        error: String(error),
        positionId: id
      });
      throw error;
    }
  }

  async handleWebhook(payload: any): Promise<WebhookPayload> {
    try {
      // Sage HR webhook payload structure
      const { event, data } = payload;
      
      let eventType: WebhookPayload['eventType'];
      switch (event) {
        case 'employee.created':
          eventType = 'employee.created';
          break;
        case 'employee.updated':
          eventType = 'employee.updated';
          break;
        case 'employee.terminated':
          eventType = 'employee.terminated';
          break;
        case 'department.created':
          eventType = 'department.created';
          break;
        case 'department.updated':
          eventType = 'department.updated';
          break;
        default:
          throw new Error(`Unsupported webhook event: ${event}`);
      }

      return {
        systemType: 'sage_hr',
        eventType,
        data: eventType.startsWith('employee') ? this.transformEmployeeData(data) : data,
        timestamp: new Date().toISOString(),
        companyId: this.config.companyId
      };
    } catch (error) {
      integrationLogger.error('Failed to handle Sage HR webhook', {
        error: String(error),
        payload
      });
      throw error;
    }
  }

  private async ensureValidToken(): Promise<void> {
    // Check if current token is valid (implement token validation logic)
    // If invalid, refresh using refresh token
    try {
      const testResponse = await fetch(`${this.baseUrl}/api/v1/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (testResponse.status === 401) {
        await this.refreshAccessToken();
      }
    } catch (error) {
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token;

      // TODO: Update stored credentials in database
      integrationLogger.info('Sage HR access token refreshed successfully');
    } catch (error) {
      integrationLogger.error('Failed to refresh Sage HR access token', {
        error: String(error)
      });
      throw error;
    }
  }

  private async makeRequest(method: string, endpoint: string, body?: any): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    integrationLogger.info('Making Sage HR API request', {
      method,
      endpoint,
      hasBody: !!body
    });

    return fetch(url, options);
  }

  private transformEmployeeData(sageEmployee: any): HREmployee {
    return {
      id: sageEmployee.id?.toString() || sageEmployee.employee_number,
      employeeNumber: sageEmployee.employee_number,
      firstName: sageEmployee.first_name || '',
      lastName: sageEmployee.last_name || '',
      email: sageEmployee.email || sageEmployee.work_email || '',
      phone: sageEmployee.phone || sageEmployee.mobile_phone,
      department: sageEmployee.department?.name || 'Unknown',
      jobTitle: sageEmployee.position?.title || sageEmployee.job_title || 'Unknown',
      manager: sageEmployee.manager?.id?.toString(),
      hireDate: sageEmployee.hire_date || sageEmployee.start_date || new Date().toISOString(),
      status: this.mapEmployeeStatus(sageEmployee.status),
      location: sageEmployee.location || sageEmployee.office_location,
      employmentType: this.mapEmploymentType(sageEmployee.employment_type),
      customFields: {
        sageId: sageEmployee.id,
        originalData: sageEmployee
      }
    };
  }

  private transformToSageEmployee(employee: Partial<HREmployee>): any {
    const sageEmployee: any = {};

    if (employee.firstName) sageEmployee.first_name = employee.firstName;
    if (employee.lastName) sageEmployee.last_name = employee.lastName;
    if (employee.email) sageEmployee.email = employee.email;
    if (employee.phone) sageEmployee.phone = employee.phone;
    if (employee.department) sageEmployee.department_name = employee.department;
    if (employee.jobTitle) sageEmployee.job_title = employee.jobTitle;
    if (employee.hireDate) sageEmployee.hire_date = employee.hireDate.split('T')[0];
    if (employee.location) sageEmployee.location = employee.location;
    if (employee.employeeNumber) sageEmployee.employee_number = employee.employeeNumber;

    return sageEmployee;
  }

  private transformToSagePosition(job: Partial<HRJobPosition>): any {
    const sagePosition: any = {};

    if (job.title) sagePosition.title = job.title;
    if (job.description) sagePosition.description = job.description;
    if (job.requirements) sagePosition.requirements = job.requirements.join('\n');
    if (job.location) sagePosition.location = job.location;
    if (job.salaryMin) sagePosition.salary_min = job.salaryMin;
    if (job.salaryMax) sagePosition.salary_max = job.salaryMax;
    if (job.currency) sagePosition.currency = job.currency;
    if (job.employmentType) sagePosition.employment_type = job.employmentType;
    if (job.requisitionNumber) sagePosition.requisition_number = job.requisitionNumber;
    if (job.targetStartDate) sagePosition.target_start_date = job.targetStartDate;

    return sagePosition;
  }

  private mapEmployeeStatus(sageStatus: string): HREmployee['status'] {
    const status = sageStatus?.toLowerCase() || '';
    
    if (status.includes('active') || status.includes('employed') || status === 'current') {
      return 'active';
    } else if (status.includes('terminated') || status.includes('left') || status === 'leaver') {
      return 'terminated';
    } else {
      return 'inactive';
    }
  }

  private mapEmploymentType(sageType: string): HREmployee['employmentType'] {
    const type = sageType?.toLowerCase() || '';
    
    if (type.includes('part') || type.includes('pt')) {
      return 'part_time';
    } else if (type.includes('contract') || type.includes('temp') || type.includes('freelance')) {
      return 'contractor';
    } else if (type.includes('intern') || type.includes('apprentice')) {
      return 'intern';
    } else {
      return 'full_time';
    }
  }

  private mapPositionStatus(sageStatus: string): HRJobPosition['status'] {
    const status = sageStatus?.toLowerCase() || '';
    
    if (status.includes('open') || status.includes('active') || status === 'published') {
      return 'open';
    } else if (status.includes('hold') || status.includes('paused')) {
      return 'on_hold';
    } else {
      return 'closed';
    }
  }
}