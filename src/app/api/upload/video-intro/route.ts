
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { getFirebaseAdmin } from '@/lib/firebase/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { videoStorageService } from '@/services/videoStorage.service';

/**
 * POST /api/upload/video-intro - Upload candidate video introduction
 * This endpoint handles the final step of the onboarding process
 */
async function handlePOST(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { videoBlob } = body;

    if (!videoBlob) {
      return NextResponse.json(
        { error: 'Video data is required' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(videoBlob, 'base64');
    
    const uploadResult = await videoStorageService.uploadVideo(buffer, 'video-intro.webm', {
        userId,
        type: 'intro',
        maxSizeMB: 50,
        generateThumbnail: true,
    });


    // Update candidate profile to mark video as uploaded and onboarding complete
    await databaseService.updateCandidateProfile(userId, {
        videoIntroUrl: uploadResult.url,
        videoIntroThumbnail: uploadResult.thumbnailUrl,
        videoIntroUploadedAt: new Date(),
        onboardingComplete: true,
        profileComplete: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        status: 'completed',
        profileComplete: true,
        onboardingComplete: true
      },
      message: 'Video introduction uploaded successfully. Profile complete!'
    });

  } catch (error) {
    console.error('Video intro upload failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload video introduction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware and export
export const POST = withAuth(handlePOST);
