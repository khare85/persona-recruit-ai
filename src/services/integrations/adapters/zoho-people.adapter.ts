/**
 * Zoho People Integration Adapter
 * Handles integration with Zoho People API for comprehensive HR data sync
 */

import { BaseHRAdapter, HREmployee, HRDepartment, HRJobPosition, WebhookPayload } from '../types';
import { integrationLogger } from '@/lib/logger';

export class ZohoPeopleAdapter extends BaseHRAdapter {
  private baseUrl: string;
  private accessToken: string;
  private refreshToken: string;
  private clientId: string;
  private clientSecret: string;
  private orgId: string;

  constructor(config: any) {
    super(config);
    this.baseUrl = config.credentials.baseUrl || 'https://people.zoho.com';
    this.accessToken = config.credentials.accessToken;
    this.refreshToken = config.credentials.refreshToken;
    this.clientId = config.credentials.clientId;
    this.clientSecret = config.credentials.clientSecret;
    this.orgId = config.credentials.orgId || 'default';
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.ensureValidToken();
      const response = await this.makeRequest('GET', '/people/api/employees');
      return response.status === 200;
    } catch (error) {
      integrationLogger.error('Zoho People connection validation failed', {
        error: String(error)
      });
      return false;
    }
  }

  async getEmployees(lastSync?: string): Promise<HREmployee[]> {
    try {
      await this.ensureValidToken();
      
      let url = '/people/api/employees';
      const params = new URLSearchParams();
      
      if (lastSync) {
        params.append('modifiedAfter', lastSync);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await this.makeRequest('GET', url);
      
      if (!response.ok) {
        throw new Error(`Zoho People API error: ${response.status}`);
      }

      const data = await response.json();
      const employees = data.response?.result || [];

      return employees.map((emp: any) => this.transformEmployeeData(emp));
    } catch (error) {
      integrationLogger.error('Failed to fetch Zoho People employees', {
        error: String(error),
        lastSync
      });
      throw error;
    }
  }

  async getDepartments(): Promise<HRDepartment[]> {
    try {
      await this.ensureValidToken();
      const response = await this.makeRequest('GET', '/people/api/forms/department/getRecords');
      
      if (!response.ok) {
        throw new Error(`Zoho People API error: ${response.status}`);
      }

      const data = await response.json();
      const departments = data.response?.result || [];

      return departments.map((dept: any) => ({
        id: dept.ID || dept.Department_ID,
        name: dept.Department_Name || dept.Name,
        description: dept.Description,
        parentDepartment: dept.Parent_Department,
        manager: dept.Department_Head,
        location: dept.Location,
        headcount: dept.Employee_Count
      }));
    } catch (error) {
      integrationLogger.error('Failed to fetch Zoho People departments', {
        error: String(error)
      });
      throw error;
    }
  }

  async getJobPositions(): Promise<HRJobPosition[]> {
    try {
      await this.ensureValidToken();
      const response = await this.makeRequest('GET', '/people/api/forms/jobopening/getRecords');
      
      if (!response.ok) {
        throw new Error(`Zoho People API error: ${response.status}`);
      }

      const data = await response.json();
      const positions = data.response?.result || [];

      return positions.map((pos: any) => ({
        id: pos.ID || pos.Job_Opening_ID,
        title: pos.Job_Title || pos.Position_Name,
        department: pos.Department || 'Unknown',
        description: pos.Job_Description || pos.Description || '',
        requirements: pos.Requirements ? pos.Requirements.split('\n') : [],
        location: pos.Location || pos.Work_Location || '',
        employmentType: this.mapEmploymentType(pos.Employment_Type || pos.Job_Type),
        salaryMin: pos.Salary_Min || pos.Minimum_Salary,
        salaryMax: pos.Salary_Max || pos.Maximum_Salary,
        currency: pos.Currency || 'USD',
        status: this.mapPositionStatus(pos.Status || pos.Job_Status),
        hiringManager: pos.Hiring_Manager || pos.Recruiter,
        requisitionNumber: pos.Requisition_Number || pos.Job_Code,
        createdDate: pos.Created_Date || pos.Date_Created || new Date().toISOString(),
        targetStartDate: pos.Target_Start_Date || pos.Expected_Start_Date
      }));
    } catch (error) {
      integrationLogger.error('Failed to fetch Zoho People job positions', {
        error: String(error)
      });
      throw error;
    }
  }

  async createEmployee(employee: Partial<HREmployee>): Promise<string> {
    try {
      await this.ensureValidToken();
      const zohoEmployee = this.transformToZohoEmployee(employee);
      
      const response = await this.makeRequest('POST', '/people/api/employees', zohoEmployee);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create employee: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      return result.response?.result?.ID || result.response?.result?.Employee_ID;
    } catch (error) {
      integrationLogger.error('Failed to create Zoho People employee', {
        error: String(error),
        employee: employee.email
      });
      throw error;
    }
  }

  async updateEmployee(id: string, employee: Partial<HREmployee>): Promise<boolean> {
    try {
      await this.ensureValidToken();
      const zohoEmployee = this.transformToZohoEmployee(employee);
      
      const response = await this.makeRequest('PUT', `/people/api/employees/${id}`, zohoEmployee);
      
      return response.ok;
    } catch (error) {
      integrationLogger.error('Failed to update Zoho People employee', {
        error: String(error),
        employeeId: id
      });
      throw error;
    }
  }

  async createJobPosition(job: Partial<HRJobPosition>): Promise<string> {
    try {
      await this.ensureValidToken();
      const zohoPosition = this.transformToZohoPosition(job);
      
      const response = await this.makeRequest('POST', '/people/api/forms/jobopening/insertRecord', zohoPosition);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create position: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      return result.response?.result?.ID || result.response?.result?.Job_Opening_ID;
    } catch (error) {
      integrationLogger.error('Failed to create Zoho People position', {
        error: String(error),
        position: job.title
      });
      throw error;
    }
  }

  async updateJobPosition(id: string, job: Partial<HRJobPosition>): Promise<boolean> {
    try {
      await this.ensureValidToken();
      const zohoPosition = this.transformToZohoPosition(job);
      
      const response = await this.makeRequest('PUT', `/people/api/forms/jobopening/updateRecord`, {
        ...zohoPosition,
        ID: id
      });
      
      return response.ok;
    } catch (error) {
      integrationLogger.error('Failed to update Zoho People position', {
        error: String(error),
        positionId: id
      });
      throw error;
    }
  }

  async handleWebhook(payload: any): Promise<WebhookPayload> {
    try {
      // Zoho People webhook payload structure
      const { eventType, data, module } = payload;
      
      let mappedEventType: WebhookPayload['eventType'];
      switch (eventType) {
        case 'employee_created':
        case 'form_data_added':
          if (module === 'employee') {
            mappedEventType = 'employee.created';
          } else if (module === 'department') {
            mappedEventType = 'department.created';
          } else if (module === 'jobopening') {
            mappedEventType = 'job.created';
          } else {
            throw new Error(`Unsupported module: ${module}`);
          }
          break;
        case 'employee_updated':
        case 'form_data_updated':
          if (module === 'employee') {
            mappedEventType = 'employee.updated';
          } else if (module === 'department') {
            mappedEventType = 'department.updated';
          } else if (module === 'jobopening') {
            mappedEventType = 'job.updated';
          } else {
            throw new Error(`Unsupported module: ${module}`);
          }
          break;
        case 'employee_terminated':
          mappedEventType = 'employee.terminated';
          break;
        default:
          throw new Error(`Unsupported webhook event: ${eventType}`);
      }

      return {
        systemType: 'zoho_people',
        eventType: mappedEventType,
        data: mappedEventType.startsWith('employee') ? this.transformEmployeeData(data) : data,
        timestamp: new Date().toISOString(),
        companyId: this.config.companyId
      };
    } catch (error) {
      integrationLogger.error('Failed to handle Zoho People webhook', {
        error: String(error),
        payload
      });
      throw error;
    }
  }

  private async ensureValidToken(): Promise<void> {
    try {
      const testResponse = await fetch(`${this.baseUrl}/people/api/employees?limit=1`, {
        headers: {
          'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
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
      const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
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
      
      // Note: Zoho doesn't always return a new refresh token
      if (tokenData.refresh_token) {
        this.refreshToken = tokenData.refresh_token;
      }

      integrationLogger.info('Zoho People access token refreshed successfully');
    } catch (error) {
      integrationLogger.error('Failed to refresh Zoho People access token', {
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
        'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    integrationLogger.info('Making Zoho People API request', {
      method,
      endpoint,
      hasBody: !!body
    });

    return fetch(url, options);
  }

  private transformEmployeeData(zohoEmployee: any): HREmployee {
    return {
      id: zohoEmployee.EmployeeID || zohoEmployee.Employee_ID || zohoEmployee.ID,
      employeeNumber: zohoEmployee.Employee_Number || zohoEmployee.EmployeeNumber,
      firstName: zohoEmployee.First_Name || zohoEmployee.FirstName || '',
      lastName: zohoEmployee.Last_Name || zohoEmployee.LastName || '',
      email: zohoEmployee.EmailId || zohoEmployee.Email || zohoEmployee.Work_Email || '',
      phone: zohoEmployee.Mobile || zohoEmployee.Phone || zohoEmployee.Mobile_Number,
      department: zohoEmployee.Department || 'Unknown',
      jobTitle: zohoEmployee.Designation || zohoEmployee.Job_Title || zohoEmployee.Position || 'Unknown',
      manager: zohoEmployee.Reporting_To || zohoEmployee.Manager,
      hireDate: zohoEmployee.Date_of_Joining || zohoEmployee.Hire_Date || new Date().toISOString(),
      status: this.mapEmployeeStatus(zohoEmployee.Employee_Status || zohoEmployee.Status),
      location: zohoEmployee.Work_Location || zohoEmployee.Location || zohoEmployee.Office_Location,
      employmentType: this.mapEmploymentType(zohoEmployee.Employment_Type || zohoEmployee.Employee_Type),
      customFields: {
        zohoId: zohoEmployee.EmployeeID || zohoEmployee.ID,
        originalData: zohoEmployee
      }
    };
  }

  private transformToZohoEmployee(employee: Partial<HREmployee>): any {
    const zohoEmployee: any = {};

    if (employee.firstName) zohoEmployee.First_Name = employee.firstName;
    if (employee.lastName) zohoEmployee.Last_Name = employee.lastName;
    if (employee.email) zohoEmployee.EmailId = employee.email;
    if (employee.phone) zohoEmployee.Mobile = employee.phone;
    if (employee.department) zohoEmployee.Department = employee.department;
    if (employee.jobTitle) zohoEmployee.Designation = employee.jobTitle;
    if (employee.hireDate) zohoEmployee.Date_of_Joining = employee.hireDate.split('T')[0];
    if (employee.location) zohoEmployee.Work_Location = employee.location;
    if (employee.employeeNumber) zohoEmployee.Employee_Number = employee.employeeNumber;

    return zohoEmployee;
  }

  private transformToZohoPosition(job: Partial<HRJobPosition>): any {
    const zohoPosition: any = {};

    if (job.title) zohoPosition.Job_Title = job.title;
    if (job.description) zohoPosition.Job_Description = job.description;
    if (job.requirements) zohoPosition.Requirements = job.requirements.join('\n');
    if (job.location) zohoPosition.Work_Location = job.location;
    if (job.salaryMin) zohoPosition.Salary_Min = job.salaryMin;
    if (job.salaryMax) zohoPosition.Salary_Max = job.salaryMax;
    if (job.currency) zohoPosition.Currency = job.currency;
    if (job.employmentType) zohoPosition.Employment_Type = job.employmentType;
    if (job.requisitionNumber) zohoPosition.Job_Code = job.requisitionNumber;
    if (job.targetStartDate) zohoPosition.Expected_Start_Date = job.targetStartDate;
    if (job.department) zohoPosition.Department = job.department;

    return zohoPosition;
  }

  private mapEmployeeStatus(zohoStatus: string): HREmployee['status'] {
    const status = zohoStatus?.toLowerCase() || '';
    
    if (status.includes('active') || status.includes('current') || status === 'employed') {
      return 'active';
    } else if (status.includes('terminated') || status.includes('left') || status.includes('resigned')) {
      return 'terminated';
    } else {
      return 'inactive';
    }
  }

  private mapEmploymentType(zohoType: string): HREmployee['employmentType'] {
    const type = zohoType?.toLowerCase() || '';
    
    if (type.includes('part') || type.includes('pt')) {
      return 'part_time';
    } else if (type.includes('contract') || type.includes('temp') || type.includes('freelance')) {
      return 'contractor';
    } else if (type.includes('intern') || type.includes('trainee')) {
      return 'intern';
    } else {
      return 'full_time';
    }
  }

  private mapPositionStatus(zohoStatus: string): HRJobPosition['status'] {
    const status = zohoStatus?.toLowerCase() || '';
    
    if (status.includes('open') || status.includes('active') || status === 'published') {
      return 'open';
    } else if (status.includes('hold') || status.includes('paused') || status.includes('on hold')) {
      return 'on_hold';
    } else {
      return 'closed';
    }
  }
}