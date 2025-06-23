import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';

const updateCompanySchema = z.object({
  name: z.string().min(2).max(100).transform(sanitizeString).optional(),
  domain: z.string().min(2).max(100).transform(sanitizeString).optional(),
  website: z.string().url().optional().or(z.literal("")),
  size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
  industry: z.string().min(2).max(100).transform(sanitizeString).optional(),
  location: z.string().min(2).max(200).transform(sanitizeString).optional(),
  description: z.string().max(2000).transform(sanitizeString).optional(),
  founded: z.number().min(1800).max(new Date().getFullYear()).optional(),
  status: z.enum(['Active', 'Inactive', 'Pending']).optional()
});

/**
 * GET /api/admin/companies/[id] - Get company details
 */
export const GET = withRateLimit('standard',
  withAuth(
    withRole(['super_admin'], async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      try {
        const companyId = params.id;

        apiLogger.info('Company details requested', {
          companyId,
          requestedBy: req.user?.id
        });

        // TODO: Get company from database
        const mockCompany = {
          id: companyId,
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
          activeJobs: 8,
          users: [
            {
              id: 'u1',
              email: 'admin@techcorp.com',
              firstName: 'John',
              lastName: 'Smith',
              role: 'company_admin',
              department: 'Administration',
              status: 'Active',
              lastLogin: '2024-06-22T09:15:00Z',
              invitedAt: '2024-01-15T10:00:00Z'
            }
          ]
        };

        return NextResponse.json({
          success: true,
          data: { company: mockCompany },
          message: 'Company details retrieved successfully'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * PUT /api/admin/companies/[id] - Update company
 */
export const PUT = withRateLimit('update',
  withAuth(
    withRole(['super_admin'], async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      try {
        const companyId = params.id;
        const body = await req.json();
        const validation = updateCompanySchema.safeParse(body);

        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid company update data',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const updateData = validation.data;

        apiLogger.info('Company update requested', {
          companyId,
          updatedBy: req.user?.id,
          fields: Object.keys(updateData)
        });

        // TODO: Update company in database
        const updatedCompany = {
          id: companyId,
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
          updatedAt: new Date().toISOString(),
          userCount: 25,
          activeJobs: 8,
          ...updateData
        };

        apiLogger.info('Company updated successfully', {
          companyId,
          updatedBy: req.user?.id
        });

        return NextResponse.json({
          success: true,
          data: { company: updatedCompany },
          message: 'Company updated successfully'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * DELETE /api/admin/companies/[id] - Delete company
 */
export const DELETE = withRateLimit('delete',
  withAuth(
    withRole(['super_admin'], async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      try {
        const companyId = params.id;

        apiLogger.info('Company deletion requested', {
          companyId,
          deletedBy: req.user?.id
        });

        // TODO: Check if company has active jobs or users
        // TODO: Soft delete or archive company
        // TODO: Notify company users

        apiLogger.info('Company deleted successfully', {
          companyId,
          deletedBy: req.user?.id
        });

        return NextResponse.json({
          success: true,
          message: 'Company deleted successfully'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);