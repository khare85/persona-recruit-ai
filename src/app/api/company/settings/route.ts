import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

const companySettingsSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  facebookUrl: z.string().url().optional().or(z.literal(''))
});

/**
 * GET /api/company/settings - Get company settings
 */
export const GET = withRateLimit('settings',
  withAuth(
    withRole(['company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const userRole = req.user!.role;

        let companyId: string;

        if (userRole === 'super_admin') {
          // Super admin can access any company via query param
          const searchParams = req.nextUrl.searchParams;
          const requestedCompanyId = searchParams.get('companyId');
          
          if (!requestedCompanyId) {
            return NextResponse.json(
              { error: 'Company ID required for super admin access' },
              { status: 400 }
            );
          }
          
          companyId = requestedCompanyId;
        } else {
          // Company admin can only access their own company
          const user = await databaseService.getUserById(userId);
          if (!user?.companyId) {
            return NextResponse.json(
              { error: 'User not associated with a company' },
              { status: 404 }
            );
          }
          companyId = user.companyId;
        }

        apiLogger.info('Fetching company settings', { userId, companyId });

        const company = await databaseService.getCompanyById(companyId);
        if (!company) {
          return NextResponse.json(
            { error: 'Company not found' },
            { status: 404 }
          );
        }

        const settings = {
          id: company.id,
          name: company.name,
          description: company.description || '',
          website: company.website,
          industry: company.industry,
          size: company.size,
          location: company.location,
          phone: company.phone,
          email: company.email,
          logoUrl: company.logoUrl,
          bannerUrl: company.bannerUrl,
          primaryColor: company.primaryColor,
          secondaryColor: company.secondaryColor,
          linkedinUrl: company.linkedinUrl,
          twitterUrl: company.twitterUrl,
          facebookUrl: company.facebookUrl
        };

        return NextResponse.json({
          success: true,
          settings
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * PUT /api/company/settings - Update company settings
 */
export const PUT = withRateLimit('settings',
  withAuth(
    withRole(['company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const body = await req.json();

        const validation = companySettingsSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid settings data',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const settingsData = validation.data;
        let companyId: string;

        if (userRole === 'super_admin') {
          // Super admin can update any company via body param
          companyId = body.companyId;
          if (!companyId) {
            return NextResponse.json(
              { error: 'Company ID required for super admin updates' },
              { status: 400 }
            );
          }
        } else {
          // Company admin can only update their own company
          const user = await databaseService.getUserById(userId);
          if (!user?.companyId) {
            return NextResponse.json(
              { error: 'User not associated with a company' },
              { status: 404 }
            );
          }
          companyId = user.companyId;
        }

        apiLogger.info('Updating company settings', { 
          userId,
          companyId,
          fieldsUpdated: Object.keys(settingsData)
        });

        // Update company
        await databaseService.updateCompany(companyId, {
          name: settingsData.name,
          description: settingsData.description,
          website: settingsData.website || undefined,
          industry: settingsData.industry,
          size: settingsData.size,
          location: settingsData.location,
          phone: settingsData.phone,
          email: settingsData.email || undefined,
          logoUrl: settingsData.logoUrl || undefined,
          bannerUrl: settingsData.bannerUrl || undefined,
          primaryColor: settingsData.primaryColor,
          secondaryColor: settingsData.secondaryColor,
          linkedinUrl: settingsData.linkedinUrl || undefined,
          twitterUrl: settingsData.twitterUrl || undefined,
          facebookUrl: settingsData.facebookUrl || undefined
        });

        apiLogger.info('Company settings updated successfully', { userId, companyId });

        return NextResponse.json({
          success: true,
          message: 'Company settings updated successfully'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);