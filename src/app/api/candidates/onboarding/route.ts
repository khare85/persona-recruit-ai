import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/middleware';
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { aiWorkerPool } from '@/workers/AIWorkerPool';
import { firestore } from '@/lib/firebase/client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const onboardingSchema = z.object({
  firstName: z.string().min(2, 'First name is required').optional(),
  lastName: z.string().min(2, 'Last name is required').optional(),
  phone: z.string().optional(),
  location: z.string().min(2, 'Location is required').optional(),
  resumeFile: z.string().optional(), // Base64 encoded
  resumeMimeType: z.string().optional(),
  videoBlob: z.string().optional(), // Base64 encoded
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  candidateId: z.string().min(1, 'Candidate ID is required')
});

/**
 * POST /api/candidates/onboarding - Complete candidate onboarding with optimized AI services
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    
    const validation = onboardingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid onboarding data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      phone,
      location,
      resumeFile,
      resumeMimeType,
      videoBlob,
      priority,
      candidateId
    } = validation.data;

    // Get existing candidate profile
    const candidateDoc = await getDoc(doc(firestore, 'candidates', candidateId));
    const existingProfile = candidateDoc.exists() ? candidateDoc.data() : null;

    // Prepare basic profile updates
    const profileUpdates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (firstName) profileUpdates.firstName = firstName;
    if (lastName) profileUpdates.lastName = lastName;
    if (phone) profileUpdates.phone = phone;
    if (location) profileUpdates.location = location;

    // For high priority requests, process immediately
    if (priority === 'high') {
      // Process resume and video if provided
      if (resumeFile && resumeMimeType) {
        const resumeResult = await aiOrchestrator.processResume({
          candidateId,
          resumeFile,
          fileName: `${uuidv4()}.${resumeMimeType.includes('pdf') ? 'pdf' : 'docx'}`,
          fileType: resumeMimeType
        });

        Object.assign(profileUpdates, resumeResult);
      }

      if (videoBlob) {
        const videoResult = await aiOrchestrator.processVideo({
          candidateId,
          videoFile: videoBlob,
          fileName: `${uuidv4()}.webm`,
          fileType: 'video/webm'
        });

        Object.assign(profileUpdates, videoResult);
      }

      // Generate complete profile with AI
      const completeProfile = await aiOrchestrator.generateCompleteProfile({
        candidateId,
        profileData: profileUpdates,
        existingProfile
      });

      // Update candidate profile in Firestore
      await updateDoc(doc(firestore, 'candidates', candidateId), {
        ...profileUpdates,
        ...completeProfile,
        profileComplete: true,
        lastProcessed: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        data: {
          profileComplete: true,
          profile: { ...profileUpdates, ...completeProfile },
          processedImmediately: true
        },
        message: 'Profile onboarding completed successfully!',
        processedAt: new Date().toISOString()
      });
    }

    // For medium/low priority, update basic info immediately and queue AI processing
    if (Object.keys(profileUpdates).length > 1) { // More than just updatedAt
      await updateDoc(doc(firestore, 'candidates', candidateId), profileUpdates);
    }

    // Queue AI processing for resume and video
    const jobs = [];

    if (resumeFile && resumeMimeType) {
      const resumeJob = await aiWorkerPool.addJob({
        id: `onboarding-resume-${candidateId}-${Date.now()}`,
        type: 'resume',
        priority,
        data: {
          candidateId,
          resumeFile,
          fileName: `${uuidv4()}.${resumeMimeType.includes('pdf') ? 'pdf' : 'docx'}`,
          fileType: resumeMimeType
        }
      });
      jobs.push(resumeJob);
    }

    if (videoBlob) {
      const videoJob = await aiWorkerPool.addJob({
        id: `onboarding-video-${candidateId}-${Date.now()}`,
        type: 'video',
        priority,
        data: {
          candidateId,
          videoFile: videoBlob,
          fileName: `${uuidv4()}.webm`,
          fileType: 'video/webm'
        }
      });
      jobs.push(videoJob);
    }

    // Queue profile completion job
    const profileJob = await aiWorkerPool.addJob({
      id: `onboarding-profile-${candidateId}-${Date.now()}`,
      type: 'profile-generation',
      priority,
      data: {
        candidateId,
        profileData: profileUpdates,
        existingProfile
      }
    });
    jobs.push(profileJob);

    return NextResponse.json({
      success: true,
      data: {
        profileComplete: false,
        profile: profileUpdates,
        jobs: jobs.map(job => ({ id: job.id, status: 'queued' })),
        processingQueued: true
      },
      message: 'Profile updates saved. AI processing queued for completion.'
    });

  } catch (error) {
    console.error('Onboarding failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete onboarding',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/candidates/onboarding - Get onboarding status
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');
    const jobId = searchParams.get('jobId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // If jobId provided, get job status
    if (jobId) {
      const jobStatus = await aiWorkerPool.getJobStatus(jobId);
      
      if (!jobStatus) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: jobStatus
      });
    }

    // Get candidate profile
    const candidateDoc = await getDoc(doc(firestore, 'candidates', candidateId));
    
    if (!candidateDoc.exists()) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const candidateData = candidateDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        profileComplete: candidateData.profileComplete || false,
        hasResume: !!candidateData.resumeUrl,
        hasVideo: !!candidateData.videoIntroUrl,
        hasEmbeddings: !!candidateData.embedding,
        lastProcessed: candidateData.lastProcessed,
        profile: candidateData
      }
    });

  } catch (error) {
    console.error('Failed to get onboarding status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get onboarding status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware
export const POST_WITH_AUTH = withAuth(POST);
export const GET_WITH_AUTH = withAuth(GET);

// Export with middleware
export { POST_WITH_AUTH as POST, GET_WITH_AUTH as GET };
