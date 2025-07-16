import { NextRequest, NextResponse } from 'next/server';
import { liveInterviewService } from '@/services/liveInterviewService';
import { verifyAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';

/**
 * Start a live interview session
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      interviewId, 
      candidateId, 
      jobId, 
      jobTitle, 
      jobDescription, 
      candidateName, 
      candidateResumeSummary,
      maxTurns 
    } = body;

    if (!interviewId || !candidateId || !jobId || !jobTitle || !jobDescription || !candidateName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check permissions - only recruiters or the candidate themselves can start
    const isRecruiter = ['recruiter', 'company_admin', 'super_admin'].includes(user.role);
    const isCandidate = user.role === 'candidate' && user.id === candidateId;

    if (!isRecruiter && !isCandidate) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const session = await liveInterviewService.startInterviewSession(
      interviewId,
      candidateId,
      user.id, // recruiter ID
      jobId,
      {
        jobTitle,
        jobDescription,
        candidateName,
        candidateResumeSummary,
        maxTurns
      }
    );

    return NextResponse.json({
      success: true,
      data: session
    });

  } catch (error) {
    return handleApiError(error);
  }
}