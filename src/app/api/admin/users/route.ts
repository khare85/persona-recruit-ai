
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
      const companyIds = [...new Set(users.map(u => u.companyId).filter(Boolean))] as string[];
      const companies = companyIds.length > 0 ? await databaseService.getCompaniesByIds(companyIds) : [];
      const companyMap = new Map(companies.map(c => [c.id, c.name]));

      let enrichedUsers = users.map(user => ({
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
        companyName: user.companyId ? companyMap.get(user.companyId) : undefined
      }));

      // In-memory search after enriching data
      if (search) {
        const searchLower = search.toLowerCase();
        enrichedUsers = enrichedUsers.filter(user => 
          user.fullName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.companyName?.toLowerCase().includes(searchLower)
        );
        total = enrichedUsers.length; // Update total after filtering
      }
      
      const paginatedUsers = enrichedUsers.slice(0, limit);
      hasMore = enrichedUsers.length > limit;

      return NextResponse.json({
        success: true,
        data: {
          users: paginatedUsers,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore,
          },
        },
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);

/**
 * POST /api/admin/users - Create a new user (alternative to /api/auth/create-user)
 */
export const POST = withAuth(
  withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const body = await req.json();
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        role, 
        companyId, 
        department 
      } = body;

      // Validate required fields
      if (!email || !firstName || !lastName || !role) {
        return NextResponse.json(
          { error: 'Email, first name, last name, and role are required' },
          { status: 400 }
        );
      }

      // Validate password if provided
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existingUser = await databaseService.getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        );
      }

      apiLogger.info('Super admin creating user', {
        adminId: req.user?.id,
        targetEmail: email,
        targetRole: role,
        companyId
      });

      // Create user using database service
      const userId = await databaseService.createUser({
        email,
        firstName,
        lastName,
        role,
        companyId,
        status: 'active',
        emailVerified: true,
        passwordHash: password // Will be hashed in the service
      });

      apiLogger.info('User created successfully by super admin', {
        userId,
        email,
        role,
        createdBy: req.user?.id
      });

      return NextResponse.json({
        success: true,
        data: {
          userId,
          email,
          firstName,
          lastName,
          role,
          companyId
        },
        message: 'User created successfully'
      }, { status: 201 });

    } catch (error) {
      apiLogger.error('Error creating user via admin endpoint', {
        error: String(error),
        userId: req.user?.id
      });
      return handleApiError(error);
    }
  })
);

    