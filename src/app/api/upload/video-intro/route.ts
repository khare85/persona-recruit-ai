import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';
import { fileUploadService } from '@/lib/storage';
import { embeddingDatabaseService } from '@/services/embeddingDatabase.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/upload/video-intro - Upload candidate video introduction
 * This endpoint handles the final step of the onboarding process
 */
export const POST = withRateLimit('upload',
  withAuth(
    withRole(['candidate'], async (request: NextRequest): Promise<NextResponse> => {
      try {
        const userId = request.user!.id;
        const body = await request.json();
        const { videoBlob } = body;

        if (!videoBlob) {
          return NextResponse.json(
            { error: 'Video data is required' },
            { status: 400 }
          );
        }

        apiLogger.info('Video introduction upload started', { userId });

        try {
          // Convert base64 to buffer and create file
          const videoBuffer = Buffer.from(videoBlob, 'base64');
          const fileName = `${uuidv4()}.webm`;
          const videoFile = new File([videoBuffer], fileName, { type: 'video/webm' });
          
          // Upload to Firebase Storage
          const uploadResult = await fileUploadService.uploadFile(videoFile, 'video', {
            path: `candidates/${userId}/video-intro/${fileName}`,
            maxSize: 10 * 1024 * 1024 // 10MB max
          });

          // Update candidate profile with video URL
          await databaseService.updateCandidateProfile(userId, {
            videoIntroUrl: uploadResult.url,
            profileComplete: true // Mark profile as complete after video upload
          });

          // Update vector database if candidate has embeddings
          try {
            const candidateWithEmbedding = await embeddingDatabaseService.getCandidateWithEmbedding(userId);
            if (candidateWithEmbedding) {
              await embeddingDatabaseService.saveCandidateWithEmbedding(userId, {
                ...candidateWithEmbedding,
                videoIntroductionUrl: uploadResult.url
              });
              apiLogger.info('Video URL updated in vector database', { userId });
            }
          } catch (error) {
            // Don't fail the upload if vector database update fails
            apiLogger.warn('Failed to update video URL in vector database', { 
              userId, 
              error: String(error) 
            });
          }

          apiLogger.info('Video introduction uploaded successfully', { 
            userId, 
            videoUrl: uploadResult.url 
          });

          return NextResponse.json({
            success: true,
            data: {
              videoUrl: uploadResult.url,
              profileComplete: true
            },
            message: 'Video introduction uploaded successfully! Your profile is now complete.'
          });

        } catch (uploadError) {
          apiLogger.error('Video upload failed', { 
            userId, 
            error: String(uploadError) 
          });
          
          return NextResponse.json(
            { 
              error: 'Failed to upload video. Please try again.',
              details: uploadError instanceof Error ? uploadError.message : String(uploadError)
            },
            { status: 500 }
          );
        }

      } catch (error) {
        apiLogger.error('Video intro upload endpoint failed', { 
          userId: request.user?.id,
          error: String(error)
        });
        return handleApiError(error);
      }
    })
  )
);