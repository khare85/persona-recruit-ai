import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';
import { fileUploadService } from '@/lib/storage';

/**
 * POST /api/company/upload - Upload company assets (logo, banner, etc.)
 */
export const POST = withRateLimit('upload',
  withAuth(
    withRole(['company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const formData = await req.formData();
        
        const file = formData.get('file') as File;
        const type = formData.get('type') as string;

        if (!file) {
          return NextResponse.json(
            { error: 'File is required' },
            { status: 400 }
          );
        }

        if (!type || !['logo', 'banner'].includes(type)) {
          return NextResponse.json(
            { error: 'Valid file type is required (logo or banner)' },
            { status: 400 }
          );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or SVG image.' },
            { status: 400 }
          );
        }

        // Validate file size based on type
        const maxSize = type === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for logo, 5MB for banner
        if (file.size > maxSize) {
          const maxSizeMB = maxSize / (1024 * 1024);
          return NextResponse.json(
            { error: `File size too large. Maximum size for ${type} is ${maxSizeMB}MB.` },
            { status: 400 }
          );
        }

        // Get company ID
        let companyId: string;
        if (userRole === 'super_admin') {
          const requestedCompanyId = formData.get('companyId') as string;
          if (!requestedCompanyId) {
            return NextResponse.json(
              { error: 'Company ID required for super admin uploads' },
              { status: 400 }
            );
          }
          companyId = requestedCompanyId;
        } else {
          const user = await databaseService.getUserById(userId);
          if (!user?.companyId) {
            return NextResponse.json(
              { error: 'User not associated with a company' },
              { status: 404 }
            );
          }
          companyId = user.companyId;
        }

        apiLogger.info('Company file upload started', { 
          userId,
          companyId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadType: type
        });

        // Upload file
        const uploadResult = await fileUploadService.uploadFile(file, 'image', {
          path: `companies/${companyId}/${type}`,
          maxSize: maxSize,
          optimize: true,
          generateThumbnail: type === 'banner'
        });

        // Update company record with new file URL
        const updateData: any = {};
        updateData[`${type}Url`] = uploadResult.url;
        
        await databaseService.updateCompany(companyId, updateData);

        apiLogger.info('Company file uploaded successfully', { 
          userId,
          companyId,
          uploadType: type,
          fileUrl: uploadResult.url
        });

        return NextResponse.json({
          success: true,
          url: uploadResult.url,
          thumbnailUrl: uploadResult.thumbnailUrl,
          message: `${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully`
        });

      } catch (error) {
        apiLogger.error('Company file upload failed', { 
          userId: req.user?.id,
          error: String(error)
        });
        return handleApiError(error);
      }
    })
  )
);

/**
 * DELETE /api/company/upload - Delete company asset
 */
export const DELETE = withRateLimit('delete',
  withAuth(
    withRole(['company_admin', 'super_admin'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const searchParams = req.nextUrl.searchParams;
        const type = searchParams.get('type');
        const companyIdParam = searchParams.get('companyId');

        if (!type || !['logo', 'banner'].includes(type)) {
          return NextResponse.json(
            { error: 'Valid file type is required (logo or banner)' },
            { status: 400 }
          );
        }

        // Get company ID
        let companyId: string;
        if (userRole === 'super_admin') {
          if (!companyIdParam) {
            return NextResponse.json(
              { error: 'Company ID required for super admin deletions' },
              { status: 400 }
            );
          }
          companyId = companyIdParam;
        } else {
          const user = await databaseService.getUserById(userId);
          if (!user?.companyId) {
            return NextResponse.json(
              { error: 'User not associated with a company' },
              { status: 404 }
            );
          }
          companyId = user.companyId;
        }

        apiLogger.info('Company file deletion started', { 
          userId,
          companyId,
          deleteType: type
        });

        // Get current file URL
        const company = await databaseService.getCompanyById(companyId);
        if (!company) {
          return NextResponse.json(
            { error: 'Company not found' },
            { status: 404 }
          );
        }

        const currentUrl = type === 'logo' ? company.logoUrl : company.bannerUrl;
        if (!currentUrl) {
          return NextResponse.json(
            { error: `No ${type} found to delete` },
            { status: 404 }
          );
        }

        // Update company record to remove file URL
        const updateData: any = {};
        updateData[`${type}Url`] = null;
        
        await databaseService.updateCompany(companyId, updateData);

        // TODO: Delete actual file from storage
        // Extract file path from URL and delete
        // await fileUploadService.deleteFile(filePath);

        apiLogger.info('Company file deleted successfully', { 
          userId,
          companyId,
          deleteType: type
        });

        return NextResponse.json({
          success: true,
          message: `${type === 'logo' ? 'Logo' : 'Banner'} deleted successfully`
        });

      } catch (error) {
        apiLogger.error('Company file deletion failed', { 
          userId: req.user?.id,
          error: String(error)
        });
        return handleApiError(error);
      }
    })
  )
);