
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
      
      // In a real implementation, 'search' would be part of the database query
      let { items: users, total, hasMore } = await databaseService.listUsers(options);

      if (search) {
        users = users.filter(user => 
          user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // We might need to adjust total/hasMore after in-memory search
      const totalFiltered = users.length;
      const paginatedUsers = users.slice(0, limit);

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
