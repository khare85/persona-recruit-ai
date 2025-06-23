/**
 * HR System Integration Registry
 * Central registry for all supported HR system integrations
 */

import { HRSystemIntegration, HRSystemType } from './types';

export const HR_SYSTEM_REGISTRY: Record<HRSystemType, HRSystemIntegration> = {
  bamboohr: {
    systemType: 'bamboohr',
    name: 'BambooHR',
    description: 'Complete HR management platform with employee records, performance tracking, and recruitment tools.',
    logoUrl: '/images/integrations/bamboohr.png',
    authType: 'api_key',
    requiredFields: ['apiKey', 'subdomain'],
    optionalFields: ['customFields'],
    supportedFeatures: {
      employeeSync: true,
      departmentSync: true,
      jobSync: true,
      applicationSync: true,
      interviewSync: false,
      realTimeWebhooks: true,
      bidirectionalSync: true
    },
    documentationUrl: 'https://documentation.bamboohr.com/docs',
    setupInstructions: [
      'Log in to your BambooHR account as an administrator',
      'Navigate to Settings > API Keys',
      'Generate a new API key with appropriate permissions',
      'Copy your company subdomain from the URL (e.g., "companyname" from companyname.bamboohr.com)',
      'Enter both the API key and subdomain in the integration settings'
    ]
  },

  sage_hr: {
    systemType: 'sage_hr',
    name: 'Sage HR',
    description: 'Cloud-based HR and people management system with employee self-service and analytics.',
    logoUrl: '/images/integrations/sage-hr.png',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret'],
    optionalFields: ['baseUrl'],
    supportedFeatures: {
      employeeSync: true,
      departmentSync: true,
      jobSync: true,
      applicationSync: false,
      interviewSync: false,
      realTimeWebhooks: false,
      bidirectionalSync: true
    },
    documentationUrl: 'https://developer.sage.com/hr/',
    setupInstructions: [
      'Contact Sage HR support to enable API access for your account',
      'Register your application in the Sage Developer Portal',
      'Obtain your Client ID and Client Secret',
      'Configure the OAuth redirect URL in your Sage application settings',
      'Complete the OAuth authorization flow'
    ]
  },

  zoho_people: {
    systemType: 'zoho_people',
    name: 'Zoho People',
    description: 'Comprehensive HR management suite with attendance, performance, and employee engagement tools.',
    logoUrl: '/images/integrations/zoho-people.png',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret'],
    optionalFields: ['baseUrl'],
    supportedFeatures: {
      employeeSync: true,
      departmentSync: true,
      jobSync: true,
      applicationSync: true,
      interviewSync: true,
      realTimeWebhooks: true,
      bidirectionalSync: true
    },
    documentationUrl: 'https://www.zoho.com/people/api/',
    setupInstructions: [
      'Log in to Zoho API Console (https://api-console.zoho.com/)',
      'Create a new application of type "Server-based Applications"',
      'Add the required scopes: ZohoPeople.employee.ALL, ZohoPeople.forms.ALL',
      'Configure the redirect URL for OAuth',
      'Note down the Client ID and Client Secret',
      'Complete the OAuth authorization process'
    ]
  },

  servicenow_hr: {
    systemType: 'servicenow_hr',
    name: 'ServiceNow HR Service Delivery',
    description: 'Enterprise HR service management platform with case management and employee lifecycle automation.',
    logoUrl: '/images/integrations/servicenow.png',
    authType: 'basic_auth',
    requiredFields: ['baseUrl', 'username', 'password'],
    optionalFields: ['customFields'],
    supportedFeatures: {
      employeeSync: true,
      departmentSync: true,
      jobSync: true,
      applicationSync: false,
      interviewSync: false,
      realTimeWebhooks: true,
      bidirectionalSync: true
    },
    documentationUrl: 'https://docs.servicenow.com/bundle/paris-application-development/page/integrate/inbound-rest/concept/c_RESTAPI.html',
    setupInstructions: [
      'Ensure you have admin access to your ServiceNow instance',
      'Create a dedicated integration user with appropriate roles',
      'Enable the REST API plugin if not already active',
      'Configure ACL rules for the integration user',
      'Test the connection using your instance URL and credentials'
    ]
  },

  workday: {
    systemType: 'workday',
    name: 'Workday HCM',
    description: 'Enterprise cloud applications for finance, HR, and planning with advanced analytics.',
    logoUrl: '/images/integrations/workday.png',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret', 'baseUrl'],
    optionalFields: ['tenantName'],
    supportedFeatures: {
      employeeSync: true,
      departmentSync: true,
      jobSync: true,
      applicationSync: true,
      interviewSync: false,
      realTimeWebhooks: true,
      bidirectionalSync: true
    },
    documentationUrl: 'https://community.workday.com/sites/default/files/file-hosting/restapi/index.html',
    setupInstructions: [
      'Contact your Workday administrator to enable API access',
      'Register your application in Workday',
      'Configure OAuth 2.0 settings and obtain credentials',
      'Set up appropriate security permissions for the integration',
      'Test the connection with your tenant URL'
    ]
  },

  adp_workforce: {
    systemType: 'adp_workforce',
    name: 'ADP Workforce Now',
    description: 'Comprehensive HR, payroll, talent, and benefits administration platform.',
    logoUrl: '/images/integrations/adp.png',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret'],
    optionalFields: ['baseUrl'],
    supportedFeatures: {
      employeeSync: true,
      departmentSync: true,
      jobSync: false,
      applicationSync: false,
      interviewSync: false,
      realTimeWebhooks: false,
      bidirectionalSync: false
    },
    documentationUrl: 'https://developers.adp.com/',
    setupInstructions: [
      'Register for ADP Developer Portal access',
      'Create a new application in the ADP Marketplace',
      'Obtain your Client ID and Client Secret',
      'Configure API access permissions',
      'Complete the certification process for production access'
    ]
  },

  paycom: {
    systemType: 'paycom',
    name: 'Paycom',
    description: 'Single-software HR technology platform with payroll, talent acquisition, and HR management.',
    logoUrl: '/images/integrations/paycom.png',
    authType: 'api_key',
    requiredFields: ['apiKey', 'baseUrl'],
    optionalFields: ['customFields'],
    supportedFeatures: {
      employeeSync: true,
      departmentSync: true,
      jobSync: true,
      applicationSync: false,
      interviewSync: false,
      realTimeWebhooks: false,
      bidirectionalSync: false
    },
    documentationUrl: 'https://www.paycom.com/api-documentation/',
    setupInstructions: [
      'Contact Paycom support to enable API access',
      'Obtain your API key from Paycom administrator',
      'Configure API permissions for data access',
      'Test connection with your Paycom instance URL'
    ]
  },

  namely: {
    systemType: 'namely',
    name: 'Namely',
    description: 'Modern HR platform combining HRIS, payroll, benefits, and talent management.',
    logoUrl: '/images/integrations/namely.png',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret', 'subdomain'],
    optionalFields: [],
    supportedFeatures: {
      employeeSync: true,
      departmentSync: true,
      jobSync: true,
      applicationSync: false,
      interviewSync: false,
      realTimeWebhooks: true,
      bidirectionalSync: true
    },
    documentationUrl: 'https://developers.namely.com/',
    setupInstructions: [
      'Contact Namely to request API access',
      'Register your application in Namely',
      'Obtain OAuth credentials',
      'Configure webhook endpoints if using real-time sync',
      'Test the integration with your Namely subdomain'
    ]
  },

  greenhouse: {
    systemType: 'greenhouse',
    name: 'Greenhouse',
    description: 'Recruiting optimization platform with structured hiring and candidate tracking.',
    logoUrl: '/images/integrations/greenhouse.png',
    authType: 'api_key',
    requiredFields: ['apiKey'],
    optionalFields: ['baseUrl'],
    supportedFeatures: {
      employeeSync: false,
      departmentSync: true,
      jobSync: true,
      applicationSync: true,
      interviewSync: true,
      realTimeWebhooks: true,
      bidirectionalSync: true
    },
    documentationUrl: 'https://developers.greenhouse.io/',
    setupInstructions: [
      'Log in to Greenhouse as an admin',
      'Navigate to Configure > Dev Center > API Credential Management',
      'Create a new API key with appropriate permissions',
      'Configure webhook endpoints for real-time updates',
      'Test the connection with the API key'
    ]
  },

  lever: {
    systemType: 'lever',
    name: 'Lever',
    description: 'Talent acquisition suite with ATS and CRM capabilities for modern recruiting.',
    logoUrl: '/images/integrations/lever.png',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret'],
    optionalFields: [],
    supportedFeatures: {
      employeeSync: false,
      departmentSync: false,
      jobSync: true,
      applicationSync: true,
      interviewSync: true,
      realTimeWebhooks: true,
      bidirectionalSync: true
    },
    documentationUrl: 'https://hire.lever.co/developer/documentation',
    setupInstructions: [
      'Access Lever Settings > Integrations',
      'Create a new API application',
      'Configure OAuth settings and permissions',
      'Set up webhook endpoints for real-time sync',
      'Complete OAuth authorization flow'
    ]
  },

  icims: {
    systemType: 'icims',
    name: 'iCIMS Talent Cloud',
    description: 'Enterprise talent acquisition platform with comprehensive recruiting tools.',
    logoUrl: '/images/integrations/icims.png',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret', 'baseUrl'],
    optionalFields: ['customerId'],
    supportedFeatures: {
      employeeSync: false,
      departmentSync: true,
      jobSync: true,
      applicationSync: true,
      interviewSync: true,
      realTimeWebhooks: false,
      bidirectionalSync: true
    },
    documentationUrl: 'https://developer.icims.com/',
    setupInstructions: [
      'Contact iCIMS to enable API access',
      'Register your application in iCIMS',
      'Obtain OAuth 2.0 credentials',
      'Configure API permissions and scopes',
      'Test with your iCIMS customer URL'
    ]
  },

  successfactors: {
    systemType: 'successfactors',
    name: 'SAP SuccessFactors',
    description: 'Cloud-based HCM suite with talent management, HR analytics, and workforce planning.',
    logoUrl: '/images/integrations/successfactors.png',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret', 'baseUrl'],
    optionalFields: ['companyId'],
    supportedFeatures: {
      employeeSync: true,
      departmentSync: true,
      jobSync: true,
      applicationSync: true,
      interviewSync: false,
      realTimeWebhooks: true,
      bidirectionalSync: true
    },
    documentationUrl: 'https://help.sap.com/docs/SAP_SUCCESSFACTORS_PLATFORM/d599f15995d348a1b45ba5603e2aba9b/03e096b1d5f94ad98da5acb9dc6de75a.html',
    setupInstructions: [
      'Access SAP SuccessFactors Admin Center',
      'Navigate to Integration Center > My Integrations',
      'Create new OAuth application',
      'Configure API permissions and scopes',
      'Obtain client credentials and test connection'
    ]
  },

  oracle_hcm: {
    systemType: 'oracle_hcm',
    name: 'Oracle HCM Cloud',
    description: 'Complete human capital management solution with global HR, talent, and workforce management.',
    logoUrl: '/images/integrations/oracle-hcm.png',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret', 'baseUrl'],
    optionalFields: ['tenantName'],
    supportedFeatures: {
      employeeSync: true,
      departmentSync: true,
      jobSync: true,
      applicationSync: true,
      interviewSync: false,
      realTimeWebhooks: true,
      bidirectionalSync: true
    },
    documentationUrl: 'https://docs.oracle.com/en/cloud/saas/human-resources/23d/farfa/index.html',
    setupInstructions: [
      'Access Oracle Cloud Applications as an administrator',
      'Navigate to Setup and Maintenance > Manage REST API Integrations',
      'Create new REST API integration',
      'Configure OAuth 2.0 settings and obtain credentials',
      'Set up appropriate security permissions'
    ]
  },

  custom_api: {
    systemType: 'custom_api',
    name: 'Custom API Integration',
    description: 'Connect with any HR system through custom REST API integration.',
    logoUrl: '/images/integrations/custom-api.png',
    authType: 'api_key',
    requiredFields: ['baseUrl', 'apiKey'],
    optionalFields: ['username', 'password', 'customFields'],
    supportedFeatures: {
      employeeSync: true,
      departmentSync: true,
      jobSync: true,
      applicationSync: true,
      interviewSync: true,
      realTimeWebhooks: true,
      bidirectionalSync: true
    },
    documentationUrl: '/docs/custom-api-integration',
    setupInstructions: [
      'Prepare your HR system API endpoints',
      'Ensure API supports JSON format for data exchange',
      'Configure authentication (API key, OAuth, or basic auth)',
      'Map your data fields to our standard format',
      'Test API endpoints and authentication'
    ]
  }
};

export function getHRSystemIntegration(systemType: HRSystemType): HRSystemIntegration {
  return HR_SYSTEM_REGISTRY[systemType];
}

export function getAllHRSystemIntegrations(): HRSystemIntegration[] {
  return Object.values(HR_SYSTEM_REGISTRY);
}

export function getPopularHRSystems(): HRSystemIntegration[] {
  const popularSystems: HRSystemType[] = [
    'bamboohr',
    'sage_hr',
    'zoho_people',
    'servicenow_hr',
    'workday',
    'greenhouse',
    'lever'
  ];
  
  return popularSystems.map(type => HR_SYSTEM_REGISTRY[type]);
}

export function getHRSystemsByCategory(): Record<string, HRSystemIntegration[]> {
  return {
    'Complete HR Platforms': [
      HR_SYSTEM_REGISTRY.bamboohr,
      HR_SYSTEM_REGISTRY.sage_hr,
      HR_SYSTEM_REGISTRY.zoho_people,
      HR_SYSTEM_REGISTRY.workday,
      HR_SYSTEM_REGISTRY.adp_workforce,
      HR_SYSTEM_REGISTRY.paycom,
      HR_SYSTEM_REGISTRY.namely
    ],
    'Enterprise Solutions': [
      HR_SYSTEM_REGISTRY.servicenow_hr,
      HR_SYSTEM_REGISTRY.workday,
      HR_SYSTEM_REGISTRY.successfactors,
      HR_SYSTEM_REGISTRY.oracle_hcm
    ],
    'Recruiting Focused': [
      HR_SYSTEM_REGISTRY.greenhouse,
      HR_SYSTEM_REGISTRY.lever,
      HR_SYSTEM_REGISTRY.icims
    ],
    'Custom Solutions': [
      HR_SYSTEM_REGISTRY.custom_api
    ]
  };
}