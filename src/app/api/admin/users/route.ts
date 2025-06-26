
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

/**
 * GET /api/admin/users - Get all users with pagination and filters
 */
export const GET = withAuth(
  withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const search = searchParams.get('search') || '';
      const role = searchParams.get('role') || '';
      const status = searchParams.get('status') || '';

      const options = {
        limit,
        offset: (page - 1) * limit,
        role: role !== 'all' ? role : undefined,
        status: status !== 'all' ? status : undefined,
      };

      apiLogger.info('Admin users list requested', { userId: req.user?.id, options, search });
      
      let { items: users, total, hasMore } = await databaseService.listUsers(options);

      // Enrich users with company names
      const companyIds = [...new Set(users.map(u => u.companyId).filter(Boolean))];
      const companies = companyIds.length > 0 ? await databaseService.getCompaniesByIds(companyIds as string[]) : [];
      const companyMap = new Map(companies.map(c => [c.id, c.name]));

      let enrichedUsers = users.map(user => ({
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
        companyName: user.companyId ? companyMap.get(user.companyId) : undefined
      }));

      if (search) {
        const searchLower = search.toLowerCase();
        enrichedUsers = enrichedUsers.filter(user => 
          user.fullName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.companyName?.toLowerCase().includes(searchLower)
        );
      }
      
      const totalFiltered = enrichedUsers.length;
      const paginatedUsers = enrichedUsers.slice(0, limit);

      return NextResponse.json({
        success: true,
        data: {
          users: paginatedUsers,
          pagination: {
            page,
            limit,
            total: totalFiltered,
            totalPages: Math.ceil(totalFiltered / limit),
            hasMore: paginatedUsers.length === limit && totalFiltered > limit * page,
          },
        },
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);
