import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

/**
 * GET /api/auth/me - Get current user information
 */
export const GET = withAuth(async (req: NextRequest): Promise<NextResponse> => {
  try {
    const user = req.user!;
    
    apiLogger.info('User info requested', { userId: user.id, role: user.role });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        }
      }
    });

  } catch (error) {
    apiLogger.error('Failed to get user info', { error: String(error) });
    return handleApiError(error);
  }
});