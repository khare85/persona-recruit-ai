import { z } from 'zod';
import { 
  withProtection, 
  withQueryValidation, 
  withValidation,
  CommonSchemas,
  type AuthenticatedRequest 
} from '@/middleware/api';
import { ApiResponse, APIError } from '@/lib/api-response';
import { databaseService } from '@/services/database.service';
import { sanitizeString } from '@/lib/validation';
import { apiLogger } from '@/lib/logger';

// Query validation schema for GET /api/companies
const companyQuerySchema = CommonSchemas.pagination.merge(
  CommonSchemas.search.merge(
    z.object({
      industry: z.string().optional(),
      size: z.string().optional(),
      status: z.enum(['active', 'inactive', 'pending']).optional()
    })
  )
);

/**
 * GET /api/companies - List companies with filtering and pagination
 * Requires: super_admin role
 */
const getCompaniesHandler = async (req: AuthenticatedRequest, query: z.infer<typeof companyQuerySchema>) => {
  const response = ApiResponse.create().startTiming();
  
  try {
    apiLogger.info('Fetching companies list', {
      userId: req.user?.uid,
      query,
      requestId: req.requestId
    });

    // Build filters for database query
    const filters: any = {};
    
    if (query.status) {
      filters.status = query.status;
    }
    
    if (query.industry) {
      filters.industry = query.industry;
    }
    
    if (query.size) {
      filters.size = query.size;
    }

    // Fetch companies from database
    const { items: companies, total, hasMore } = await databaseService.listCompanies({
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      status: query.status,
      search: query.q
    });

    // Calculate pagination metadata
    const pagination = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasNext: hasMore,
      hasPrev: query.page > 1
    };

    // Get filter options for frontend (cache this in production)
    const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing'];
    const sizes = ['1-10', '11-50', '51-200', '201-500', '500-1000', '1000+'];
    const statuses = ['active', 'inactive', 'pending'];

    apiLogger.info('Companies fetched successfully', {
      userId: req.user?.uid,
      count: companies.length,
      total,
      requestId: req.requestId
    });

    return response.endTiming().success(
      { companies, pagination },
      `Found ${total} companies`,
      {
        pagination,
        filters: { industries, sizes, statuses },
        cached: false
      }
    );
  } catch (error) {
    apiLogger.error('Failed to fetch companies', {
      userId: req.user?.uid,
      error: String(error),
      requestId: req.requestId
    });
    
    throw APIError.internal('Failed to fetch companies');
  }
};

export const GET = withProtection(['super_admin', 'admin'], 'admin')(
  withQueryValidation(companyQuerySchema)(getCompaniesHandler)
);

// Validation schema for POST /api/companies
const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100).transform(sanitizeString),
  industry: z.string().min(2, 'Industry is required').max(50).transform(sanitizeString),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500-1000', '1000+']),
  website: z.string().url('Please provide a valid website URL'),
  headquarters: z.string().min(2, 'Headquarters location is required').max(100).transform(sanitizeString),
  description: z.string().max(1000).optional().transform(val => val ? sanitizeString(val) : ''),
  founded: z.string().optional(),
  logo: z.string().url().optional(),
  // Subscription settings
  plan: z.enum(['startup', 'professional', 'enterprise']).default('startup'),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly'),
  // Company settings
  publicProfile: z.boolean().default(true),
  autoScreening: z.boolean().default(false),
  screeningThreshold: z.number().min(0).max(100).default(70),
  emailNotifications: z.boolean().default(true),
  maxDailyInterviews: z.number().min(1).max(20).default(4)
});

/**
 * POST /api/companies - Create a new company
 * Requires: super_admin role
 */
const createCompanyHandler = async (req: AuthenticatedRequest, data: z.infer<typeof createCompanySchema>) => {
  const response = ApiResponse.create().startTiming();
  
  try {
    apiLogger.info('Creating new company', {
      userId: req.user?.uid,
      companyName: data.name,
      industry: data.industry,
      requestId: req.requestId
    });

    // Check if company with this name already exists
    const existingCompanies = await databaseService.listCompanies({
      search: data.name,
      limit: 1
    });
    
    if (existingCompanies.items.some(c => 
      c.name.toLowerCase() === data.name.toLowerCase()
    )) {
      throw APIError.conflict('A company with this name already exists');
    }

    // Generate company slug
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Calculate subscription amount based on plan
    const planPricing = {
      startup: { monthly: 299, annual: 2990 },
      professional: { monthly: 699, annual: 6990 },
      enterprise: { monthly: 999, annual: 9990 }
    };
    
    const amount = planPricing[data.plan][data.billingCycle];
    const nextBilling = new Date();
    if (data.billingCycle === 'monthly') {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }

    // Prepare company data for database
    const companyData = {
      name: data.name,
      slug,
      industry: data.industry,
      size: data.size,
      website: data.website,
      description: data.description || '',
      headquarters: data.headquarters,
      founded: data.founded || new Date().getFullYear().toString(),
      logo: data.logo || `/logos/default.png`,
      status: 'active' as const,
      subscription: {
        plan: data.plan,
        status: 'active' as const,
        billingCycle: data.billingCycle,
        amount,
        nextBilling: nextBilling.toISOString().split('T')[0],
        trialEndsAt: null,
        cancelledAt: null
      },
      settings: {
        publicProfile: data.publicProfile,
        autoScreening: data.autoScreening,
        screeningThreshold: data.screeningThreshold,
        emailNotifications: data.emailNotifications,
        maxDailyInterviews: data.maxDailyInterviews,
        allowCandidateApplications: true,
        requireVideoIntroduction: false
      },
      domain: null, // Will be set when domain is verified
      contactEmail: null,
      supportEmail: null
    };

    // Create company in database
    const companyId = await databaseService.createCompany(companyData);
    
    // Fetch the created company to return complete data
    const createdCompany = await databaseService.getCompanyById(companyId);
    
    if (!createdCompany) {
      throw APIError.internal('Company was created but could not be retrieved');
    }

    apiLogger.info('Company created successfully', {
      userId: req.user?.uid,
      companyId,
      companyName: data.name,
      requestId: req.requestId
    });

    return response.endTiming().success(
      createdCompany,
      `Company '${data.name}' created successfully`,
      {
        companyId,
        slug
      }
    );
  } catch (error) {
    apiLogger.error('Failed to create company', {
      userId: req.user?.uid,
      companyName: data.name,
      error: String(error),
      requestId: req.requestId
    });
    
    throw error;
  }
};

export const POST = withProtection(['super_admin'], 'admin')(
  withValidation(createCompanySchema)(createCompanyHandler)
);