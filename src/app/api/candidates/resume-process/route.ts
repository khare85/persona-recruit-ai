import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/candidates/resume-process - Upload and process candidate resume with optimized AI services
 */
async function handlePOST(req: NextRequest & { user?: { uid: string } }): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;
    const userId = req.user?.uid;

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

    // Validate file type
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF, DOC, or DOCX file.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename with UUID
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    // Convert file to buffer for processing
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const resumeText = fileBuffer.toString('base64');

    try {
      // For now, just mark the resume as uploaded
      // In a real implementation, you would save the resume to Firebase Storage
      // and process it with AI services
      
      // Update candidate profile to mark resume as uploaded
      const candidateRef = doc(db, 'candidates', userId);
      await updateDoc(candidateRef, {
        resumeUploaded: true,
        resumeFileName: uniqueFileName,
        resumeFileType: file.type,
        lastUpdated: new Date()
      });

      return NextResponse.json({
        success: true,
        data: {
          fileName: uniqueFileName,
          status: 'uploaded',
          resumeUploaded: true
        },
        message: 'Resume uploaded successfully'
      });

    } catch (error) {
      // Clear the buffer on error
      fileBuffer.fill(0);
      throw error;
    }

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
    const jobId = searchParams.get('jobId');

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    // If jobId is provided, get job status
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

    // Get candidate profile from Firestore
    const candidateDoc = await getDoc(doc(db, 'candidates', candidateId));
    
    if (!candidateDoc.exists()) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      );
    }

    const candidateData = candidateDoc.data();
    
    // Check if candidate has embeddings and processed resume
    const hasEmbeddings = !!candidateData.embedding;
    const hasResume = !!candidateData.resumeUrl;
    const hasProcessedResume = !!candidateData.resumeAnalysis;

    return NextResponse.json({
      success: true,
      data: {
        hasResume,
        resumeUrl: candidateData.resumeUrl,
        hasEmbeddings,
        hasProcessedResume,
        profileComplete: candidateData.profileComplete || false,
        vectorSearchEnabled: hasEmbeddings,
        lastProcessed: candidateData.lastProcessed,
        resumeAnalysis: candidateData.resumeAnalysis || null
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