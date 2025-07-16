import { NextRequest, NextResponse } from 'next/server';
import { liveInterviewService } from '@/services/liveInterviewService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Get live interview session details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.sessionId;
    const session = await liveInterviewService.getInterviewSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    // Check permissions
    const isCandidate = user.id === session.candidateId;
    const isRecruiter = user.id === session.recruiterId;
    const isAdmin = user.role === 'super_admin';

    if (!isCandidate && !isRecruiter && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: session
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Update interview session (cancel, etc.)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = params.sessionId;
    const body = await req.json();
    const { action, reason } = body;

    // Get session to check permissions
    const session = await liveInterviewService.getInterviewSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    // Check permissions - only recruiter or candidate can cancel
    const isCandidate = user.id === session.candidateId;
    const isRecruiter = user.id === session.recruiterId;

    if (!isCandidate && !isRecruiter) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (action === 'cancel') {
      await liveInterviewService.cancelInterviewSession(sessionId, reason);
      
      return NextResponse.json({
        success: true,
        data: { sessionId, action: 'cancelled', reason }
      });
    }

    if (action === 'complete') {
      // Only recruiters can manually complete
      if (!isRecruiter) {
        return NextResponse.json({ error: 'Only recruiters can complete interviews' }, { status: 403 });
      }

      await liveInterviewService.completeInterviewSession(sessionId, reason);
      
      return NextResponse.json({
        success: true,
        data: { sessionId, action: 'completed', reason }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    return handleApiError(error);
  }
}