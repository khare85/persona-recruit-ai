import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { BackgroundJobService } from '@/lib/backgroundJobs';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/candidates/resume-process - Upload and process candidate resume with Document AI and embeddings
 */
export const POST = withRateLimit('upload',
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const formData = await req.formData();
        const file = formData.get('resume') as File;

        if (!file) {
          return NextResponse.json(
            { error: 'Resume file is required' },
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

        apiLogger.info('Resume processing started', { 
          userId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });

        // Generate unique filename with UUID
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;

        // Convert file to buffer for background processing
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        try {
          // Queue document processing in background instead of processing immediately
          const jobResult = await BackgroundJobService.addDocumentProcessingJob({
            userId,
            fileBuffer,
            fileName: uniqueFileName,
            fileType: file.type,
            originalSize: file.size
          });

          apiLogger.info('Document processing job queued', { 
            userId,
            jobId: jobResult.jobId,
            fileName: uniqueFileName,
            estimatedWait: jobResult.estimatedWait
          });

          return NextResponse.json({
            success: true,
            data: {
              jobId: jobResult.jobId,
              status: jobResult.status,
              estimatedWait: jobResult.estimatedWait,
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
        apiLogger.error('Resume processing failed', { 
          userId: req.user?.id,
          error: String(error)
        });
        return handleApiError(error);
      }
    })
  )
);

/**
 * GET /api/candidates/resume-process - Get resume processing status
 */
export const GET = withRateLimit('standard',
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;

        // Get candidate profile
        const candidateProfile = await databaseService.getCandidateProfile(userId);
        if (!candidateProfile) {
          return NextResponse.json(
            { error: 'Candidate profile not found' },
            { status: 404 }
          );
        }

        // Check if candidate has embeddings
        let hasEmbeddings = false;
        try {
          const candidateWithEmbedding = await embeddingDatabaseService.getCandidateWithEmbedding(userId);
          hasEmbeddings = !!candidateWithEmbedding?.resumeEmbedding;
        } catch (error) {
          // Embeddings not found or error - that's okay
          hasEmbeddings = false;
        }

        return NextResponse.json({
          success: true,
          data: {
            hasResume: !!candidateProfile.resumeUrl,
            resumeUrl: candidateProfile.resumeUrl,
            hasEmbeddings,
            profileComplete: candidateProfile.profileComplete,
            vectorSearchEnabled: hasEmbeddings
          }
        });

      } catch (error) {
        apiLogger.error('Failed to get resume processing status', { 
          userId: req.user?.id,
          error: String(error)
        });
        return handleApiError(error);
      }
    })
  )
);