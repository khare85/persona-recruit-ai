import { NextRequest, NextResponse } from 'next/server';
import { liveInterviewService } from '@/services/liveInterviewService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Process a conversation turn in live interview
 */
export async function POST(
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
    const { userInput } = body;

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'User input is required' },
        { status: 400 }
      );
    }

    // Get session to check permissions
    const session = await liveInterviewService.getInterviewSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    // Check permissions - only the candidate or recruiter can participate
    const isCandidate = user.id === session.candidateId;
    const isRecruiter = user.id === session.recruiterId;

    if (!isCandidate && !isRecruiter) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only candidates can provide input (recruiters can only observe)
    if (!isCandidate) {
      return NextResponse.json({ error: 'Only candidates can provide input' }, { status: 403 });
    }

    const result = await liveInterviewService.processConversationTurn(
      sessionId,
      userInput.trim()
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    return handleApiError(error);
  }
}