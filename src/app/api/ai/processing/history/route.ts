import { NextRequest, NextResponse } from 'next/server';
import { aiProcessingService } from '@/services/aiProcessingService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Get user's AI processing history
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const history = await aiProcessingService.getUserProcessingHistory(user.id, limit);

    return NextResponse.json({
      success: true,
      data: history
    });

  } catch (error) {
    return handleApiError(error);
  }
}