import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { resumeProcessingService } from '@/services/resumeProcessing.service';
import { databaseService } from '@/services/database.service';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

/**
 * POST /api/candidates/ai-profile-generation - Generate comprehensive profile from resume using AI
 */
async function handlePOST(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;
    const userId = req.user?.id;

    if (!file) {
      return NextResponse.json(
        { error: 'Resume file is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Validate user role
    if (req.user?.role !== 'candidate') {
      return NextResponse.json(
        { error: 'This endpoint is only available for candidates' },
        { status: 403 }
      );
    }

    apiLogger.info('Starting AI profile generation', {
      userId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Process resume with comprehensive AI analysis
    const processingResult = await resumeProcessingService.processResume({
      userId,
      file,
      skipEmbeddings: false, // Enable full processing including embeddings
    });

    if (!processingResult.success) {
      return NextResponse.json({
        error: processingResult.error,
        warnings: processingResult.warnings
      }, { status: 400 });
    }

    // Get the updated candidate profile
    const candidateProfile = await databaseService.getCandidateProfile(userId);
    
    if (!candidateProfile) {
      return NextResponse.json(
        { error: 'Failed to retrieve generated profile' },
        { status: 500 }
      );
    }

    // Return comprehensive profile data
    const profileData = {
      // Basic info
      summary: candidateProfile.summary,
      aiGeneratedSummary: candidateProfile.aiGeneratedSummary,
      currentTitle: candidateProfile.currentTitle,
      experience: candidateProfile.experience,
      location: candidateProfile.location,
      
      // Skills and competencies
      skills: candidateProfile.skills || [],
      
      // Contact information
      phone: candidateProfile.phone,
      linkedinUrl: candidateProfile.linkedinUrl,
      portfolioUrl: candidateProfile.portfolioUrl,
      
      // Work preferences
      expectedSalary: candidateProfile.expectedSalary,
      preferredLocations: candidateProfile.preferredLocations,
      preferredJobTypes: candidateProfile.preferredJobTypes,
      willingToRelocate: candidateProfile.willingToRelocate,
      availableForWork: candidateProfile.availableForWork,
      
      // Profile status
      profileComplete: candidateProfile.profileComplete,
      resumeUrl: candidateProfile.resumeUrl,
      
      // Processing metadata
      processingSteps: processingResult.data?.processingSteps,
      hasEmbeddings: processingResult.data?.hasEmbeddings || false,
      extractedText: processingResult.data?.extractedText ? 
        processingResult.data.extractedText.substring(0, 200) + '...' : undefined,
      
      // Generated at timestamp
      generatedAt: new Date().toISOString()
    };

    apiLogger.info('AI profile generation completed successfully', {
      userId,
      profileComplete: candidateProfile.profileComplete,
      skillsCount: candidateProfile.skills?.length || 0,
      hasSummary: !!candidateProfile.summary,
      hasEmbeddings: processingResult.data?.hasEmbeddings || false,
      processingSteps: processingResult.data?.processingSteps
    });

    return NextResponse.json({
      success: true,
      message: 'Profile generated successfully with AI',
      data: profileData,
      warnings: processingResult.warnings
    });

  } catch (error) {
    apiLogger.error('AI profile generation failed', {
      userId: req.user?.id,
      error: String(error)
    });
    
    return handleApiError(error, 'AI profile generation');
  }
}

/**
 * GET /api/candidates/ai-profile-generation - Check if user has AI-generated profile
 */
async function handleGET(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    if (req.user?.role !== 'candidate') {
      return NextResponse.json(
        { error: 'This endpoint is only available for candidates' },
        { status: 403 }
      );
    }

    const candidateProfile = await databaseService.getCandidateProfile(userId);
    
    if (!candidateProfile) {
      return NextResponse.json({
        hasProfile: false,
        hasResume: false,
        hasAIGenerated: false
      });
    }

    const hasAIGenerated = !!(candidateProfile.aiGeneratedSummary || candidateProfile.summary);
    const hasResume = !!candidateProfile.resumeUrl;

    return NextResponse.json({
      hasProfile: true,
      hasResume,
      hasAIGenerated,
      profileComplete: candidateProfile.profileComplete,
      skillsCount: candidateProfile.skills?.length || 0,
      lastUpdated: candidateProfile.updatedAt
    });

  } catch (error) {
    return handleApiError(error, 'check AI profile generation status');
  }
}

export const POST = withRateLimit('ai-profile-generation', withAuth(handlePOST));
export const GET = withRateLimit('ai-profile-generation', withAuth(handleGET));