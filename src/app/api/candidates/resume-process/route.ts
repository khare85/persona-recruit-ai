
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { v4 as uuidv4 } from 'uuid';
import { resumeProcessingService } from '@/services/resumeProcessing.service';

/**
 * POST /api/candidates/resume-process - Upload and process candidate resume with optimized AI services
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

    const processingResult = await resumeProcessingService.processResume({
      userId,
      file,
      skipEmbeddings: false,
    });

    if (!processingResult.success) {
      return NextResponse.json({ error: processingResult.error, warnings: processingResult.warnings }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: processingResult.data,
      message: 'Resume uploaded and processed successfully'
    });

  } catch (error) {
    console.error('Resume processing failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to process resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/candidates/resume-process - Get resume processing status
 */
async function handleGET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    const candidateDoc = await getDoc(doc(db, 'candidateProfiles', candidateId));
    
    if (!candidateDoc.exists()) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      );
    }

    const candidateData = candidateDoc.data();
    
    // Check if candidate has embeddings and processed resume
    const hasResume = !!candidateData.resumeUrl;

    return NextResponse.json({
      success: true,
      data: {
        hasResume,
        resumeUrl: candidateData.resumeUrl,
        lastProcessed: candidateData.lastProcessed
      }
    });

  } catch (error) {
    console.error('Failed to get resume processing status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get resume processing status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware and export
export const POST = withAuth(handlePOST);
export const GET = withAuth(handleGET);
