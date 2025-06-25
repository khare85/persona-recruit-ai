import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { databaseService } from '@/services/database.service';

const createCompanySchema = z.object({
  name: z.string().min(2).max(100).transform(sanitizeString),
  domain: z.string().min(2).max(100).transform(sanitizeString),
  website: z.string().url().optional().or(z.literal("")),
  size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']),
  industry: z.string().min(2).max(100).transform(sanitizeString),
  location: z.string().min(2).max(200).transform(sanitizeString),
  description: z.string().max(2000).transform(sanitizeString).optional(),
  founded: z.number().min(1800).max(new Date().getFullYear()).optional()
});

const updateCompanySchema = createCompanySchema.partial();

/**
 * GET /api/admin/companies - Get all companies
 */
export const GET = withRateLimit('api', 
  withAuth(
    withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';

        apiLogger.info('Admin companies list requested', {
          page,
          limit,
          search,
          status,
          userId: req.user?.id
        });

        // Get companies from database
        const companiesResult = await databaseService.listCompanies({
          limit,
          offset: (page - 1) * limit,
          search,
          status: status || undefined
        });

        const companiesWithStats = await Promise.all(
          companiesResult.items.map(async (company) => {
            // Get user count and active jobs for each company
            const userCount = await databaseService.getCompanyUserCount(company.id);
            const activeJobsCount = await databaseService.getCompanyActiveJobsCount(company.id);
            
            return {
              ...company,
              userCount,
              activeJobs: activeJobsCount
            };
          })
        );

        return NextResponse.json({
          success: true,
          data: {
            companies: companiesWithStats,
            pagination: {
              page,
              limit,
              total: companiesResult.total,
              totalPages: Math.ceil(companiesResult.total / limit),
              hasMore: companiesResult.hasMore
            },
            filters: {
              search,
              status
            }
          },
          message: 'Companies retrieved successfully'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * POST /api/admin/companies - Create new company
 */
export const POST = withRateLimit('api',
  withAuth(
    withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const body = await req.json();
        const validation = createCompanySchema.safeParse(body);

        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid company data',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const companyData = validation.data;

        apiLogger.info('Company creation requested', {
          companyName: companyData.name,
          domain: companyData.domain,
          createdBy: req.user?.id
        });

        // Check if domain already exists
        const existingCompany = await databaseService.getCompanyByDomain(companyData.domain);
        if (existingCompany) {
          return NextResponse.json(
            { error: 'A company with this domain already exists' },
            { status: 409 }
          );
        }

        // Create company in database
        const companyToCreate = {
          name: companyData.name,
          domain: companyData.domain,
          size: companyData.size,
          industry: companyData.industry,
          location: companyData.location,
          status: 'active' as const
        };

        // Add optional fields only if they exist
        if (companyData.website) {
          companyToCreate.website = companyData.website;
        }
        if (companyData.description) {
          companyToCreate.description = companyData.description;
        }
        if (companyData.founded) {
          companyToCreate.founded = companyData.founded;
        }

        const companyId = await databaseService.createCompany(companyToCreate);

        // Get the created company
        const newCompany = await databaseService.getCompanyById(companyId);
        if (!newCompany) {
          throw new Error('Failed to retrieve created company');
        }

        apiLogger.info('Company created successfully', {
          companyId: newCompany.id,
          companyName: newCompany.name,
          createdBy: req.user?.id
        });

        return NextResponse.json({
          success: true,
          data: { company: newCompany },
          message: 'Company created successfully'
        }, { status: 201 });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);