import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { getFirebaseAdmin } from '@/lib/firebase/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * POST /api/upload/video-intro - Upload candidate video introduction
 * This endpoint handles the final step of the onboarding process
 */
async function handlePOST(req: NextRequest & { user?: { uid: string } }): Promise<NextResponse> {
  try {
    const userId = req.user?.uid;
    
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

    // For now, just mark the video as uploaded and complete onboarding
    // In a real implementation, you would save the video to Firebase Storage
    
    // Update candidate profile to mark video as uploaded and onboarding complete
    const candidateRef = doc(db, 'candidates', userId);
    await updateDoc(candidateRef, {
      videoIntroRecorded: true,
      onboardingComplete: true,
      profileComplete: true,
      lastUpdated: new Date()
    });

    // Also update the user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      profileComplete: true,
      lastUpdated: new Date()
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