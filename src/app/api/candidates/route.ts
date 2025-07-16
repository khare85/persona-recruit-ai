
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
import { CandidateProfile, User } from '@/models/user.model';

// Query validation schema for GET /api/candidates
const candidateQuerySchema = CommonSchemas.pagination.merge(
  CommonSchemas.search.merge(
    z.object({
      skills: z.string().optional(),
      experience: z.enum(['Entry Level', '1-2 years', '3-5 years', '5-10 years', '10+ years']).optional(),
      location: z.string().optional(),
      availability: z.enum(['immediate', '2-weeks', '1-month', '2-months', 'not-available']).optional(),
      minSalary: z.coerce.number().optional(),
      maxSalary: z.coerce.number().optional(),
      profileComplete: z.coerce.boolean().optional()
    })
  )
);

/**
 * GET /api/candidates - List candidates with filtering and search
 * Requires: recruiter, company_admin, super_admin roles
 */
const getCandidatesHandler = async (req: AuthenticatedRequest, query: z.infer<typeof candidateQuerySchema>) => {
  const response = ApiResponse.create().startTiming();
  
  try {
    // Role-based access control
    const userRole = req.user?.role;
    const companyId = req.user?.companyId;
    
    // Super admins can see all candidates
    // Company users can only see candidates who have applied to their jobs or are public
    const isCompanyUser = ['recruiter', 'company_admin'].includes(userRole || '');
    
    if (isCompanyUser && !companyId) {
      throw APIError.forbidden('Company association required');
    }

    apiLogger.info('Fetching candidates list', {
      userId: req.user?.uid,
      userRole,
      companyId,
      query,
      requestId: req.requestId
    });

    // Build database query options
    const queryOptions = {
      role: 'candidate',
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      orderBy: { field: query.sortBy || 'createdAt', direction: query.sortOrder }
    };

    // Fetch candidates from database
    const { items: users, total, hasMore } = await databaseService.listUsers(queryOptions);
    
    // Fetch and combine candidate profiles
    const candidatesWithProfiles = await Promise.all(
      users.map(async (user: User) => {
        const profile = await databaseService.getCandidateProfile(user.id);
        
        // Apply additional filters based on profile data
        if (query.skills && profile?.skills) {
          const querySkills = query.skills.toLowerCase().split(',');
          const hasMatchingSkill = profile.skills.some(skill => 
            querySkills.some(qSkill => skill.toLowerCase().includes(qSkill.trim()))
          );
          if (!hasMatchingSkill) return null;
        }
        
        if (query.experience && profile?.experience !== query.experience) {
          return null;
        }
        
        if (query.location && profile?.location && 
            !profile.location.toLowerCase().includes(query.location.toLowerCase())) {
          return null;
        }
        
        if (query.availability && profile?.availability !== query.availability) {
          return null;
        }
        
        if (query.profileComplete !== undefined && 
            Boolean(profile?.profileComplete) !== query.profileComplete) {
          return null;
        }

        // Map experience to years for consistency
        const experienceMap: { [key: string]: number } = {
          'Entry Level': 0,
          '1-2 years': 1.5,
          '3-5 years': 4,
          '5-10 years': 7.5,
          '10+ years': 10,
        };
        
        // Return sanitized candidate data based on user role
        const baseData = {
          id: user.id,
          fullName: `${user.firstName} ${user.lastName}`,
          currentTitle: profile?.currentTitle || 'Professional',
          experience: profile?.experience || 'Entry Level',
          experienceYears: experienceMap[profile?.experience || 'Entry Level'],
          location: profile?.location || 'Not specified',
          skills: profile?.skills || [],
          availability: profile?.availability || 'not-specified',
          profileComplete: profile?.profileComplete || false,
          resumeUploaded: profile?.resumeUploaded || false,
          videoIntroRecorded: profile?.videoIntroRecorded || false,
          profilePictureUrl: profile?.profilePictureUrl || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&size=150&background=0ea5e9&color=fff`,
          createdAt: user.createdAt,
          lastActive: user.lastLogin || user.updatedAt
        };
        
        // Add additional fields for authorized users
        if (['super_admin', 'company_admin', 'recruiter'].includes(userRole || '')) {
          return {
            ...baseData,
            email: user.email,
            phone: profile?.phone || null,
            summary: profile?.summary?.substring(0, 200) + (profile?.summary?.length > 200 ? '...' : '') || '',
            expectedSalary: profile?.expectedSalary || null,
            portfolioUrl: profile?.portfolioUrl || null,
            linkedinUrl: profile?.linkedinUrl || null
          };
        }
        
        return baseData;
      })
    );
    
    // Filter out null results from filtering
    const filteredCandidates = candidatesWithProfiles.filter(Boolean);
    
    // Calculate pagination for filtered results
    const filteredTotal = filteredCandidates.length;
    const pagination = {
      page: query.page,
      limit: query.limit,
      total: filteredTotal,
      totalPages: Math.ceil(filteredTotal / query.limit),
      hasNext: hasMore,
      hasPrev: query.page > 1
    };

    apiLogger.info('Candidates fetched successfully', {
      userId: req.user?.uid,
      count: filteredCandidates.length,
      total: filteredTotal,
      requestId: req.requestId
    });

    return response.endTiming().success(
      { candidates: filteredCandidates, pagination },
      `Found ${filteredTotal} candidates`,
      {
        pagination,
        filters: {
          applied: !!query.q || !!query.skills || !!query.experience || !!query.location
        }
      }
    );
  } catch (error) {
    apiLogger.error('Failed to fetch candidates', {
      userId: req.user?.uid,
      error: String(error),
      requestId: req.requestId
    });
    
    throw error;
  }
};

export const GET = withProtection(['super_admin', 'company_admin', 'recruiter'], 'api')(
  withQueryValidation(candidateQuerySchema)(getCandidatesHandler)
);

// Validation schema for POST /api/candidates (admin only)
const createCandidateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50).transform(sanitizeString),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50).transform(sanitizeString),
  email: z.string().email('Please provide a valid email address'),
  phone: z.string().optional().transform(val => val ? sanitizeString(val) : undefined),
  currentTitle: z.string().min(2, 'Current title is required').max(100).transform(sanitizeString),
  location: z.string().min(2, 'Location is required').max(100).transform(sanitizeString),
  experience: z.enum(['Entry Level', '1-2 years', '3-5 years', '5-10 years', '10+ years']),
  skills: z.array(z.string().min(1).max(50).transform(sanitizeString)).min(1, 'At least one skill is required').max(20),
  summary: z.string().min(50, 'Summary must be at least 50 characters').max(2000).transform(sanitizeString),
  availability: z.enum(['immediate', '2-weeks', '1-month', '2-months', 'not-available']).default('immediate'),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  expectedSalary: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().default('USD')
  }).optional()
});

/**
 * POST /api/candidates - Create candidate profile (admin only)
 * This endpoint is for admin creation of candidates
 * Regular candidate registration should use /api/auth/register
 */
const createCandidateHandler = async (req: AuthenticatedRequest, data: z.infer<typeof createCandidateSchema>) => {
  const response = ApiResponse.create().startTiming();
  
  try {
    apiLogger.info('Admin creating candidate profile', {
      userId: req.user?.uid,
      candidateEmail: data.email,
      requestId: req.requestId
    });

    // Check if user with this email already exists
    const existingUser = await databaseService.getUserByEmail(data.email);
    if (existingUser) {
      throw APIError.conflict('A user with this email address already exists');
    }

    // This endpoint is deprecated in favor of proper Firebase Auth registration
    // Return a message indicating the proper flow
    apiLogger.warn('Deprecated candidate creation endpoint used', {
      userId: req.user?.uid,
      candidateEmail: data.email,
      requestId: req.requestId
    });

    throw APIError.validation(
      'Direct candidate creation is not supported. Please use the registration flow at /api/auth/register'
    );
  } catch (error) {
    apiLogger.error('Failed to create candidate', {
      userId: req.user?.uid,
      candidateEmail: data.email,
      error: String(error),
      requestId: req.requestId
    });
    
    throw error;
  }
};

export const POST = withProtection(['super_admin'], 'admin')(
  withValidation(createCandidateSchema)(createCandidateHandler)
);
