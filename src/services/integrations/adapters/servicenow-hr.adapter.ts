/**
 * ServiceNow HR Service Delivery Integration Adapter
 * Handles integration with ServiceNow HR API for employee and organizational data sync
 */

import { BaseHRAdapter, HREmployee, HRDepartment, HRJobPosition, WebhookPayload } from '../types';
import { integrationLogger } from '@/lib/logger';

export class ServiceNowHRAdapter extends BaseHRAdapter {
  private baseUrl: string;
  private username: string;
  private password: string;
  private authHeader: string;

  constructor(config: any) {
    super(config);
    this.baseUrl = config.credentials.baseUrl; // e.g., https://company.service-now.com
    this.username = config.credentials.username;
    this.password = config.credentials.password;
    this.authHeader = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/api/now/table/sys_user?sysparm_limit=1');
      return response.status === 200;
    } catch (error) {
      integrationLogger.error('ServiceNow HR connection validation failed', {
        error: String(error),
        baseUrl: this.baseUrl
      });
      return false;
    }
  }

  async getEmployees(lastSync?: string): Promise<HREmployee[]> {
    try {
      let url = '/api/now/table/sys_user?sysparm_fields=sys_id,employee_number,first_name,last_name,email,phone,department,title,manager,u_hire_date,active,location,u_employment_type';
      
      if (lastSync) {
        url += `&sysparm_query=sys_updated_on>${lastSync}`;
      }

      const response = await this.makeRequest('GET', url);
      
      if (!response.ok) {
        throw new Error(`ServiceNow API error: ${response.status}`);
      }

      const data = await response.json();
      const employees = data.result || [];

      return employees.map((emp: any) => this.transformEmployeeData(emp));
    } catch (error) {
      integrationLogger.error('Failed to fetch ServiceNow HR employees', {
        error: String(error),
        lastSync
      });
      throw error;
    }
  }

  async getDepartments(): Promise<HRDepartment[]> {
    try {
      const response = await this.makeRequest('GET', '/api/now/table/cmn_department?sysparm_fields=sys_id,name,description,parent,head_count,dept_head');
      
      if (!response.ok) {
        throw new Error(`ServiceNow API error: ${response.status}`);
      }

      const data = await response.json();
      const departments = data.result || [];

      return departments.map((dept: any) => ({
        id: dept.sys_id,
        name: dept.name,
        description: dept.description,
        parentDepartment: dept.parent?.value,
        manager: dept.dept_head?.value,
        location: undefined,
        headcount: dept.head_count ? parseInt(dept.head_count) : undefined
      }));
    } catch (error) {
      integrationLogger.error('Failed to fetch ServiceNow HR departments', {
        error: String(error)
      });
      throw error;
    }
  }

  async getJobPositions(): Promise<HRJobPosition[]> {
    try {
      // ServiceNow uses hr_job_posting table for job positions
      const response = await this.makeRequest('GET', '/api/now/table/hr_job_posting?sysparm_fields=sys_id,title,description,department,location,employment_type,salary_min,salary_max,state,requisition_number,opened_at,hiring_manager');
      
      if (!response.ok) {
        throw new Error(`ServiceNow API error: ${response.status}`);
      }

      const data = await response.json();
      const positions = data.result || [];

      return positions.map((pos: any) => ({
        id: pos.sys_id,
        title: pos.title || 'Unknown Position',
        department: pos.department?.display_value || 'Unknown',
        description: pos.description || '',
        requirements: pos.requirements ? pos.requirements.split('\n') : [],
        location: pos.location?.display_value || '',
        employmentType: this.mapEmploymentType(pos.employment_type),
        salaryMin: pos.salary_min ? parseFloat(pos.salary_min) : undefined,
        salaryMax: pos.salary_max ? parseFloat(pos.salary_max) : undefined,
        currency: 'USD', // ServiceNow doesn't always specify currency
        status: this.mapPositionStatus(pos.state),
        hiringManager: pos.hiring_manager?.value || '',
        requisitionNumber: pos.requisition_number,
        createdDate: pos.opened_at || pos.sys_created_on || new Date().toISOString(),
        targetStartDate: pos.target_start_date
      }));
    } catch (error) {
      integrationLogger.error('Failed to fetch ServiceNow HR job positions', {
        error: String(error)
      });
      throw error;
    }
  }

  async createEmployee(employee: Partial<HREmployee>): Promise<string> {
    try {
      const serviceNowEmployee = this.transformToServiceNowEmployee(employee);
      
      const response = await this.makeRequest('POST', '/api/now/table/sys_user', serviceNowEmployee);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create employee: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      return result.result.sys_id;
    } catch (error) {
      integrationLogger.error('Failed to create ServiceNow HR employee', {
        error: String(error),
        employee: employee.email
      });
      throw error;
    }
  }

  async updateEmployee(id: string, employee: Partial<HREmployee>): Promise<boolean> {
    try {
      const serviceNowEmployee = this.transformToServiceNowEmployee(employee);
      
      const response = await this.makeRequest('PUT', `/api/now/table/sys_user/${id}`, serviceNowEmployee);
      
      return response.ok;
    } catch (error) {
      integrationLogger.error('Failed to update ServiceNow HR employee', {
        error: String(error),
        employeeId: id
      });
      throw error;
    }
  }

  async createJobPosition(job: Partial<HRJobPosition>): Promise<string> {
    try {
      const serviceNowPosition = this.transformToServiceNowPosition(job);
      
      const response = await this.makeRequest('POST', '/api/now/table/hr_job_posting', serviceNowPosition);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create position: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      return result.result.sys_id;
    } catch (error) {
      integrationLogger.error('Failed to create ServiceNow HR position', {
        error: String(error),
        position: job.title
      });
      throw error;
    }
  }

  async updateJobPosition(id: string, job: Partial<HRJobPosition>): Promise<boolean> {
    try {
      const serviceNowPosition = this.transformToServiceNowPosition(job);
      
      const response = await this.makeRequest('PUT', `/api/now/table/hr_job_posting/${id}`, serviceNowPosition);
      
      return response.ok;
    } catch (error) {
      integrationLogger.error('Failed to update ServiceNow HR position', {
        error: String(error),
        positionId: id
      });
      throw error;
    }
  }

  async handleWebhook(payload: any): Promise<WebhookPayload> {
    try {
      // ServiceNow webhook payload structure
      const { event, record } = payload;
      
      let eventType: WebhookPayload['eventType'];
      const table = record?.table || '';
      
      switch (event) {
        case 'inserted':
          if (table === 'sys_user') {
            eventType = 'employee.created';
          } else if (table === 'cmn_department') {
            eventType = 'department.created';
          } else if (table === 'hr_job_posting') {
            eventType = 'job.created';
          } else {
            throw new Error(`Unsupported table for insert: ${table}`);
          }
          break;
        case 'updated':
          if (table === 'sys_user') {
            eventType = 'employee.updated';
          } else if (table === 'cmn_department') {
            eventType = 'department.updated';
          } else if (table === 'hr_job_posting') {
            eventType = 'job.updated';
          } else {
            throw new Error(`Unsupported table for update: ${table}`);
          }
          break;
        case 'deleted':
          if (table === 'sys_user') {
            eventType = 'employee.terminated';
          } else if (table === 'hr_job_posting') {
            eventType = 'job.closed';
          } else {
            throw new Error(`Unsupported table for delete: ${table}`);
          }
          break;
        default:
          throw new Error(`Unsupported webhook event: ${event}`);
      }

      return {
        systemType: 'servicenow_hr',
        eventType,
        data: eventType.startsWith('employee') ? this.transformEmployeeData(record) : record,
        timestamp: new Date().toISOString(),
        companyId: this.config.companyId
      };
    } catch (error) {
      integrationLogger.error('Failed to handle ServiceNow HR webhook', {
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
        'Authorization': this.authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    integrationLogger.info('Making ServiceNow HR API request', {
      method,
      endpoint,
      hasBody: !!body
    });

    return fetch(url, options);
  }

  private transformEmployeeData(serviceNowEmployee: any): HREmployee {
    return {
      id: serviceNowEmployee.sys_id,
      employeeNumber: serviceNowEmployee.employee_number,
      firstName: serviceNowEmployee.first_name || '',
      lastName: serviceNowEmployee.last_name || '',
      email: serviceNowEmployee.email || '',
      phone: serviceNowEmployee.phone || serviceNowEmployee.mobile_phone,
      department: serviceNowEmployee.department?.display_value || serviceNowEmployee.department || 'Unknown',
      jobTitle: serviceNowEmployee.title || 'Unknown',
      manager: serviceNowEmployee.manager?.value,
      hireDate: serviceNowEmployee.u_hire_date || serviceNowEmployee.sys_created_on || new Date().toISOString(),
      status: this.mapEmployeeStatus(serviceNowEmployee.active),
      location: serviceNowEmployee.location?.display_value || serviceNowEmployee.location,
      employmentType: this.mapEmploymentType(serviceNowEmployee.u_employment_type),
      customFields: {
        serviceNowId: serviceNowEmployee.sys_id,
        originalData: serviceNowEmployee
      }
    };
  }

  private transformToServiceNowEmployee(employee: Partial<HREmployee>): any {
    const serviceNowEmployee: any = {};

    if (employee.firstName) serviceNowEmployee.first_name = employee.firstName;
    if (employee.lastName) serviceNowEmployee.last_name = employee.lastName;
    if (employee.email) serviceNowEmployee.email = employee.email;
    if (employee.phone) serviceNowEmployee.phone = employee.phone;
    if (employee.department) serviceNowEmployee.department = employee.department;
    if (employee.jobTitle) serviceNowEmployee.title = employee.jobTitle;
    if (employee.hireDate) serviceNowEmployee.u_hire_date = employee.hireDate.split('T')[0];
    if (employee.location) serviceNowEmployee.location = employee.location;
    if (employee.employeeNumber) serviceNowEmployee.employee_number = employee.employeeNumber;
    if (employee.status !== undefined) {
      serviceNowEmployee.active = employee.status === 'active';
    }

    return serviceNowEmployee;
  }

  private transformToServiceNowPosition(job: Partial<HRJobPosition>): any {
    const serviceNowPosition: any = {};

    if (job.title) serviceNowPosition.title = job.title;
    if (job.description) serviceNowPosition.description = job.description;
    if (job.requirements) serviceNowPosition.requirements = job.requirements.join('\n');
    if (job.location) serviceNowPosition.location = job.location;
    if (job.salaryMin) serviceNowPosition.salary_min = job.salaryMin.toString();
    if (job.salaryMax) serviceNowPosition.salary_max = job.salaryMax.toString();
    if (job.employmentType) serviceNowPosition.employment_type = job.employmentType;
    if (job.requisitionNumber) serviceNowPosition.requisition_number = job.requisitionNumber;
    if (job.department) serviceNowPosition.department = job.department;
    if (job.status) serviceNowPosition.state = this.mapToServiceNowPositionStatus(job.status);

    return serviceNowPosition;
  }

  private mapEmployeeStatus(active: string | boolean): HREmployee['status'] {
    if (typeof active === 'boolean') {
      return active ? 'active' : 'inactive';
    }
    
    const status = active?.toString().toLowerCase() || '';
    return status === 'true' ? 'active' : 'inactive';
  }

  private mapEmploymentType(serviceNowType: string): HREmployee['employmentType'] {
    const type = serviceNowType?.toLowerCase() || '';
    
    if (type.includes('part') || type.includes('pt')) {
      return 'part_time';
    } else if (type.includes('contract') || type.includes('temp') || type.includes('consultant')) {
      return 'contractor';
    } else if (type.includes('intern') || type.includes('trainee')) {
      return 'intern';
    } else {
      return 'full_time';
    }
  }

  private mapPositionStatus(serviceNowState: string): HRJobPosition['status'] {
    const state = serviceNowState?.toLowerCase() || '';
    
    if (state.includes('open') || state.includes('active') || state === '1') {
      return 'open';
    } else if (state.includes('hold') || state.includes('paused')) {
      return 'on_hold';
    } else {
      return 'closed';
    }
  }

  private mapToServiceNowPositionStatus(status: HRJobPosition['status']): string {
    switch (status) {
      case 'open':
        return '1'; // Active/Open in ServiceNow
      case 'on_hold':
        return '2'; // On Hold
      case 'closed':
        return '3'; // Closed
      default:
        return '1';
    }
  }
}