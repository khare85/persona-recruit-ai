
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { databaseService } from '@/services/database.service';

const updateCompanySchema = z.object({
  name: z.string().min(2).max(100).transform(sanitizeString).optional(),
  domain: z.string().min(2).max(100).transform(sanitizeString).optional(),
  website: z.string().url().optional().or(z.literal("")),
  size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
  industry: z.string().min(2).max(100).transform(sanitizeString).optional(),
  location: z.string().min(2).max(200).transform(sanitizeString).optional(),
  description: z.string().max(2000).transform(sanitizeString).optional(),
  founded: z.number().min(1800).max(new Date().getFullYear()).optional(),
  status: z.enum(['active', 'suspended', 'pending']).optional()
});

/**
 * GET /api/admin/companies/[id] - Get company details
 */
export const GET = withRateLimit('api',
  withAuth(
    withRole(['super_admin'], async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      try {
        const companyId = params.id;

        apiLogger.info('Company details requested', {
          companyId,
          requestedBy: req.user?.id
        });

        // Get company from database
        const company = await databaseService.getCompanyById(companyId);
        if (!company) {
          return NextResponse.json(
            { error: 'Company not found' },
            { status: 404 }
          );
        }

        // Get associated users
        const { items: users } = await databaseService.listUsers({ companyId });

        const companyDetails = {
          ...company,
          userCount: users.length,
          users: users.slice(0, 10).map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            status: u.status
          })),
        };

        return NextResponse.json({
          success: true,
          data: { company: companyDetails },
          message: 'Company details retrieved successfully'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * PATCH /api/admin/companies/[id] - Update company (partial update)
 */
export const PATCH = withRateLimit('api',
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

        await databaseService.updateCompany(companyId, updateData as any);
        
        const updatedCompany = await databaseService.getCompanyById(companyId);
        if (!updatedCompany) {
          return NextResponse.json(
            { error: 'Company not found after update' },
            { status: 404 }
          );
        }

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
export const DELETE = withRateLimit('api',
  withAuth(
    withRole(['super_admin'], async (req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
      try {
        const companyId = params.id;

        apiLogger.info('Company deletion requested', {
          companyId,
          deletedBy: req.user?.id
        });

        // Check if company exists
        const existingCompany = await databaseService.getCompanyById(companyId);
        if (!existingCompany) {
          return NextResponse.json(
            { error: 'Company not found' },
            { status: 404 }
          );
        }

        await databaseService.deleteCompany(companyId);

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
