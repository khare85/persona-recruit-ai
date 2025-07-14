import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { BackgroundJobService } from '@/lib/backgroundJobs';
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
          // Queue video processing in background instead of processing immediately
          const fileName = `${uuidv4()}.webm`;
          const originalSize = Buffer.byteLength(videoBlob, 'base64');
          
          // Validate video size before queuing
          if (originalSize > 10 * 1024 * 1024) { // 10MB max
            return NextResponse.json(
              { error: 'Video file too large. Maximum size is 10MB.' },
              { status: 400 }
            );
          }

          // Queue the video processing job
          const jobResult = await BackgroundJobService.addVideoProcessingJob({
            userId,
            videoBlob,
            fileName,
            originalSize
          });

          apiLogger.info('Video processing job queued', { 
            userId,
            jobId: jobResult.jobId,
            estimatedWait: jobResult.estimatedWait
          });

          return NextResponse.json({
            success: true,
            data: {
              jobId: jobResult.jobId,
              status: jobResult.status,
              estimatedWait: jobResult.estimatedWait,
              fileName: fileName
            },
            message: 'Video upload queued for processing. You will be notified when complete.'
          });

        } catch (uploadError) {
          apiLogger.error('Video upload queueing failed', { 
            userId, 
            error: String(uploadError) 
          });
          
          return NextResponse.json(
            { 
              error: 'Failed to queue video processing. Please try again.',
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