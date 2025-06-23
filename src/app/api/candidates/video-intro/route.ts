import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { videoStorageService } from '@/services/videoStorage.service';
import { databaseService } from '@/services/database.service';

const videoIntroSchema = z.object({
  duration: z.number().min(8).max(15), // Allow 8-15 seconds for some flexibility
  fileSize: z.number().max(50 * 1024 * 1024), // Max 50MB
  mimeType: z.enum(['video/webm', 'video/mp4', 'video/quicktime']),
  thumbnail: z.string().optional()
});

/**
 * POST /api/candidates/video-intro - Upload video introduction
 */
export const POST = withRateLimit('upload',
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const formData = await req.formData();
        const videoFile = formData.get('video') as File;
        const duration = parseFloat(formData.get('duration') as string);
        const thumbnail = formData.get('thumbnail') as string | null;

        if (!videoFile) {
          return NextResponse.json(
            { error: 'Video file is required' },
            { status: 400 }
          );
        }

        const validation = videoIntroSchema.safeParse({
          duration,
          fileSize: videoFile.size,
          mimeType: videoFile.type,
          thumbnail
        });

        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid video data',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const candidateId = req.user?.id;

        apiLogger.info('Video introduction upload requested', {
          candidateId,
          fileSize: videoFile.size,
          mimeType: videoFile.type,
          duration
        });

        // Upload video to Firebase Storage
        const videoMetadata = await videoStorageService.uploadVideoFromBlob(
          videoFile,
          `intro_${candidateId}.${videoFile.type.split('/')[1]}`,
          {
            userId: candidateId,
            type: 'intro',
            maxSizeMB: 50,
            generateThumbnail: true
          }
        );

        // Update candidate profile with video intro
        await databaseService.updateCandidateProfile(candidateId, {
          videoIntroUrl: videoMetadata.url,
          videoIntroThumbnail: videoMetadata.thumbnailUrl,
          videoIntroDuration: duration,
          videoIntroUploadedAt: videoMetadata.uploadedAt,
          profileComplete: true
        });

        apiLogger.info('Video introduction uploaded successfully', {
          candidateId,
          videoUrl: videoMetadata.url,
          duration
        });

        return NextResponse.json({
          success: true,
          data: {
            videoUrl: videoMetadata.url,
            thumbnailUrl: videoMetadata.thumbnailUrl,
            duration,
            profileComplete: true
          },
          message: 'Video introduction uploaded successfully! Your profile is now complete.'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * GET /api/candidates/video-intro - Get video introduction status
 */
export const GET = withRateLimit('standard',
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const candidateId = req.user?.id;

        apiLogger.info('Video introduction status requested', {
          candidateId
        });

        // Get candidate profile from database
        const candidateProfile = await databaseService.getCandidateProfile(candidateId);
        
        if (!candidateProfile) {
          return NextResponse.json(
            { error: 'Candidate profile not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            hasVideoIntro: !!candidateProfile.videoIntroUrl,
            videoIntroUrl: candidateProfile.videoIntroUrl,
            thumbnailUrl: candidateProfile.videoIntroThumbnail,
            duration: candidateProfile.videoIntroDuration,
            uploadedAt: candidateProfile.videoIntroUploadedAt,
            profileComplete: candidateProfile.profileComplete
          }
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * DELETE /api/candidates/video-intro - Delete and re-record video introduction
 */
export const DELETE = withRateLimit('delete',
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const candidateId = req.user?.id;

        apiLogger.info('Video introduction deletion requested', {
          candidateId
        });

        // Get current candidate profile
        const candidateProfile = await databaseService.getCandidateProfile(candidateId);
        
        if (!candidateProfile) {
          return NextResponse.json(
            { error: 'Candidate profile not found' },
            { status: 404 }
          );
        }

        // Delete video from storage if it exists
        if (candidateProfile.videoIntroUrl) {
          try {
            await videoStorageService.deleteVideo(candidateProfile.videoIntroUrl);
          } catch (deleteError) {
            apiLogger.warn('Failed to delete video from storage', {
              candidateId,
              videoUrl: candidateProfile.videoIntroUrl,
              error: String(deleteError)
            });
            // Continue with database update even if storage deletion fails
          }
        }

        // Update candidate profile to remove video intro
        await databaseService.updateCandidateProfile(candidateId, {
          videoIntroUrl: undefined,
          videoIntroThumbnail: undefined,
          videoIntroDuration: undefined,
          videoIntroUploadedAt: undefined,
          profileComplete: false
        });

        apiLogger.info('Video introduction deleted successfully', {
          candidateId
        });

        return NextResponse.json({
          success: true,
          message: 'Video introduction deleted. You can now record a new one.'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);