import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { resumeProcessingService } from '@/services/resumeProcessing.service';

/**
 * POST /api/candidates/resume - Upload and process candidate resume with Document AI and embeddings
 */
export const POST = withRateLimit('upload',
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const formData = await req.formData();
        const file = formData.get('resume') as File;
        const skipAI = formData.get('skipAI') === 'true'; // Optional flag to skip AI processing

        if (!file) {
          return NextResponse.json(
            { error: 'Resume file is required' },
            { status: 400 }
          );
        }

        apiLogger.info('Resume processing request received', { 
          userId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          skipAI
        });

        // Process resume with complete pipeline
        const result = await resumeProcessingService.processResume({
          userId,
          file,
          skipEmbeddings: skipAI
        });

        if (!result.success) {
          return NextResponse.json(
            { 
              error: result.error,
              warnings: result.warnings
            },
            { status: 400 }
          );
        }

        apiLogger.info('Resume processing completed successfully', { 
          userId,
          hasEmbeddings: result.data?.hasEmbeddings,
          processingSteps: result.data?.processingSteps,
          warningsCount: result.warnings?.length || 0
        });

        return NextResponse.json({
          success: true,
          data: {
            resumeUrl: result.data!.resumeUrl,
            fileName: result.data!.fileName,
            hasEmbeddings: result.data!.hasEmbeddings,
            vectorSearchEnabled: result.data!.hasEmbeddings,
            processingComplete: true,
            aiFeatures: {
              textExtraction: result.data!.processingSteps.textExtraction,
              embeddingGeneration: result.data!.processingSteps.embeddingGeneration,
              vectorSearch: result.data!.processingSteps.vectorSearchSave
            }
          },
          warnings: result.warnings,
          message: result.warnings && result.warnings.length > 0 
            ? 'Resume uploaded with some limitations. AI features may be reduced.'
            : 'Resume uploaded and processed successfully with full AI features enabled.'
        });

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
 * GET /api/candidates/resume - Get candidate resume processing status
 */
export const GET = withRateLimit('standard',
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;

        apiLogger.info('Resume status check requested', { userId });

        // Get resume processing status
        const status = await resumeProcessingService.getCandidateResumeStatus(userId);

        return NextResponse.json({
          success: true,
          data: {
            hasResume: status.hasResume,
            resumeUrl: status.resumeUrl,
            hasEmbeddings: status.hasEmbeddings,
            vectorSearchEnabled: status.vectorSearchEnabled,
            aiFeatures: {
              textExtraction: status.hasEmbeddings, // If we have embeddings, we had text extraction
              embeddingGeneration: status.hasEmbeddings,
              vectorSearch: status.vectorSearchEnabled
            }
          }
        });

      } catch (error) {
        apiLogger.error('Failed to get resume status', { 
          userId: req.user?.id,
          error: String(error)
        });
        return handleApiError(error);
      }
    })
  )
);

/**
 * DELETE /api/candidates/resume - Delete candidate resume
 */
export const DELETE = withRateLimit('delete',
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;

        apiLogger.info('Resume deletion started', { userId });

        // Get current resume URL
        const candidateProfile = await databaseService.getCandidateProfile(userId);
        if (!candidateProfile?.resumeUrl) {
          return NextResponse.json(
            { error: 'No resume found to delete' },
            { status: 404 }
          );
        }

        // Extract file path from URL for deletion
        const resumeUrl = candidateProfile.resumeUrl;
        
        // Update candidate profile to remove resume URL
        await databaseService.updateCandidateProfile(userId, {
          resumeUrl: undefined
        });

        // TODO: Delete actual file from storage
        // This would depend on your storage implementation
        // await fileUploadService.deleteFile(filePath);

        apiLogger.info('Resume deleted successfully', { userId });

        return NextResponse.json({
          success: true,
          message: 'Resume deleted successfully'
        });

      } catch (error) {
        apiLogger.error('Resume deletion failed', { 
          userId: req.user?.id,
          error: String(error)
        });
        return handleApiError(error);
      }
    })
  )
);