"use client";

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';

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
export const GET = withRateLimit('standard', 
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

        // TODO: Replace with actual database queries
        const mockCompanies = [
          {
            id: '1',
            name: 'TechCorp Inc.',
            domain: 'techcorp.com',
            website: 'https://techcorp.com',
            size: '201-1000',
            industry: 'Technology',
            location: 'San Francisco, CA',
            description: 'Leading technology company specializing in AI and machine learning solutions.',
            founded: 2015,
            status: 'Active',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-06-20T14:30:00Z',
            userCount: 25,
            activeJobs: 8
          },
          {
            id: '2',
            name: 'InnovateLabs',
            domain: 'innovatelabs.io',
            website: 'https://innovatelabs.io',
            size: '51-200',
            industry: 'Software Development',
            location: 'Austin, TX',
            status: 'Active',
            createdAt: '2024-02-20T14:30:00Z',
            updatedAt: '2024-06-18T09:15:00Z',
            userCount: 12,
            activeJobs: 5
          }
        ];

        // Apply filters
        let filteredCompanies = mockCompanies;
        
        if (search) {
          filteredCompanies = filteredCompanies.filter(company =>
            company.name.toLowerCase().includes(search.toLowerCase()) ||
            company.domain.toLowerCase().includes(search.toLowerCase()) ||
            company.industry.toLowerCase().includes(search.toLowerCase())
          );
        }

        if (status) {
          filteredCompanies = filteredCompanies.filter(company => 
            company.status.toLowerCase() === status.toLowerCase()
          );
        }

        // Pagination
        const offset = (page - 1) * limit;
        const paginatedCompanies = filteredCompanies.slice(offset, offset + limit);

        return NextResponse.json({
          success: true,
          data: {
            companies: paginatedCompanies,
            pagination: {
              page,
              limit,
              total: filteredCompanies.length,
              totalPages: Math.ceil(filteredCompanies.length / limit)
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
export const POST = withRateLimit('create',
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

        // TODO: Check if domain already exists
        // TODO: Create company in database
        const newCompany = {
          id: `company_${Date.now()}`,
          ...companyData,
          status: 'Active' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userCount: 0,
          activeJobs: 0
        };

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