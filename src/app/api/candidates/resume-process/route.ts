import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { aiWorkerPool } from '@/workers/AIWorkerPool';
import { firestore } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/candidates/resume-process - Upload and process candidate resume with optimized AI services
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;
    const priority = formData.get('priority') as string || 'medium';
    const candidateId = formData.get('candidateId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Resume file is required' },
        { status: 400 }
      );
    }

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
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
      // For high priority requests, process immediately
      if (priority === 'high') {
        const result = await aiOrchestrator.processResume({
          candidateId,
          resumeFile: resumeText,
          fileName: uniqueFileName,
          fileType: file.type
        });

        return NextResponse.json({
          success: true,
          data: {
            ...result,
            fileName: uniqueFileName,
            processedImmediately: true
          },
          message: 'Resume processed successfully',
          processedAt: new Date().toISOString()
        });
      }

      // For medium/low priority, queue for background processing
      const job = await aiWorkerPool.addJob({
        id: `resume-${candidateId}-${Date.now()}`,
        type: 'resume',
        priority: priority as 'high' | 'medium' | 'low',
        data: {
          candidateId,
          resumeFile: resumeText,
          fileName: uniqueFileName,
          fileType: file.type,
          originalSize: file.size
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          jobId: job.id,
          status: 'queued',
          fileName: uniqueFileName,
          processingQueued: true
        },
        message: 'Resume upload queued for processing. You will be notified when complete.'
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
    const candidateDoc = await getDoc(doc(firestore, 'candidates', candidateId));
    
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

// Apply authentication middleware
export const POST_WITH_AUTH = withAuth(POST);
export const GET_WITH_AUTH = withAuth(GET);

// Export with middleware
export { POST_WITH_AUTH as POST, GET_WITH_AUTH as GET };