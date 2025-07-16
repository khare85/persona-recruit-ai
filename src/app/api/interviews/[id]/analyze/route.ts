import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { generateVideoInterviewAnalysisReport } from '@/ai/flows/video-interview-analysis';
import { databaseService } from '@/services/database.service';
import { videoStorageService } from '@/services/videoStorage.service';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

/**
 * POST /api/interviews/[id]/analyze - Analyze interview video using AI
 */
async function handlePOST(req: AuthenticatedRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const interviewId = params.id;
    const userId = req.user!.id;
    
    apiLogger.info('Starting video interview analysis', { interviewId, userId });

    // Get interview data
    const interview = await databaseService.getInterviewById(interviewId);
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Check if user has permission to analyze this interview
    const hasPermission = interview.candidateId === userId || 
                         interview.interviewerId === userId ||
                         req.user?.role === 'recruiter' ||
                         req.user?.role === 'company_admin' ||
                         req.user?.role === 'super_admin';

    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if interview has video
    if (!interview.videoUrl) {
      return NextResponse.json({ error: 'No video available for analysis' }, { status: 400 });
    }

    // Check if analysis already exists
    if (interview.analysisReport) {
      return NextResponse.json({
        success: true,
        message: 'Analysis already exists',
        data: interview.analysisReport
      });
    }

    // Get video as base64 data URI
    const videoDataUri = await videoStorageService.getVideoAsDataUri(interview.videoUrl);
    
    // Get job description
    const job = interview.jobId ? await databaseService.getJobById(interview.jobId) : null;
    const jobDescription = job?.description || 'General interview for this position';

    // Get candidate resume
    const candidate = await databaseService.getCandidateProfile(interview.candidateId);
    const candidateResume = candidate?.summary || 'No resume summary available';

    // Get behavioral questions (from interview notes or default)
    const behavioralQuestions = interview.questions || [
      'Tell me about yourself',
      'Why are you interested in this position?',
      'Describe a challenging situation you faced and how you handled it',
      'Where do you see yourself in 5 years?'
    ];

    // Generate video analysis
    const analysisResult = await generateVideoInterviewAnalysisReport({
      videoDataUri,
      jobDescription,
      candidateResume,
      behavioralQuestions
    });

    // Store analysis in database
    const analysisReport = {
      ...analysisResult,
      analyzedAt: new Date().toISOString(),
      analyzedBy: userId,
      version: '1.0'
    };

    await databaseService.updateInterview(interviewId, {
      analysisReport,
      status: 'analyzed',
      analyzedAt: new Date()
    });

    apiLogger.info('Video interview analysis completed', { 
      interviewId, 
      userId,
      recommendation: analysisResult.suitabilityAssessment.overallRecommendation,
      competencyCount: analysisResult.competencyScores.length
    });

    return NextResponse.json({
      success: true,
      message: 'Video analysis completed successfully',
      data: analysisReport
    });

  } catch (error) {
    return handleApiError(error, 'interview video analysis');
  }
}

/**
 * GET /api/interviews/[id]/analyze - Get existing video analysis
 */
async function handleGET(req: AuthenticatedRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  try {
    const interviewId = params.id;
    const userId = req.user!.id;

    const interview = await databaseService.getInterviewById(interviewId);
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Check permissions
    const hasPermission = interview.candidateId === userId || 
                         interview.interviewerId === userId ||
                         req.user?.role === 'recruiter' ||
                         req.user?.role === 'company_admin' ||
                         req.user?.role === 'super_admin';

    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!interview.analysisReport) {
      return NextResponse.json({ error: 'No analysis available' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: interview.analysisReport
    });

  } catch (error) {
    return handleApiError(error, 'get interview analysis');
  }
}

export const POST = withRateLimit('video-analysis', withAuth(handlePOST));
export const GET = withRateLimit('video-analysis', withAuth(handleGET));