/**
 * Video Processing Worker
 * Handles memory-intensive video operations in separate process
 */

import { apiLogger } from '../lib/logger';
import { fileUploadService } from '../lib/storage';
import { databaseService } from '../services/database.service';
import { embeddingDatabaseService } from '../services/embeddingDatabase.service';
import type { VideoProcessingJob, JobResult } from '../lib/backgroundJobs';

export async function processVideoJob(jobData: VideoProcessingJob): Promise<JobResult['data']> {
  const { userId, videoBlob, fileName, originalSize } = jobData;
  
  let videoBuffer: Buffer | null = null;
  let videoFile: File | null = null;
  let base64Content: string | null = null;

  try {
    apiLogger.info('Starting video processing', {
      userId,
      fileName,
      originalSize,
      memoryBefore: process.memoryUsage()
    });

    // Step 1: Convert base64 to buffer with memory management
    try {
      base64Content = videoBlob;
      videoBuffer = Buffer.from(base64Content, 'base64');
      
      // Create File object for upload
      videoFile = new File([videoBuffer], fileName, { type: 'video/webm' });
      
      // Clear base64 content immediately to free memory
      base64Content = null;
      
      apiLogger.info('Video buffer created', {
        userId,
        bufferSize: videoBuffer.length,
        memoryAfterBuffer: process.memoryUsage()
      });
    } catch (bufferError) {
      throw new Error(`Failed to process video data: ${bufferError.message}`);
    }

    // Step 2: Upload to Firebase Storage
    let uploadResult;
    try {
      uploadResult = await fileUploadService.uploadFile(videoFile, 'document', {
        path: `candidates/${userId}/video-intro/${fileName}`,
        maxSize: 10 * 1024 * 1024 // 10MB max
      });

      apiLogger.info('Video uploaded to storage', {
        userId,
        uploadUrl: uploadResult.url,
        memoryAfterUpload: process.memoryUsage()
      });
    } catch (uploadError) {
      throw new Error(`Failed to upload video: ${uploadError.message}`);
    }

    // Step 3: Update candidate profile
    try {
      await databaseService.updateCandidateProfile(userId, {
        videoIntroUrl: uploadResult.url,
        profileComplete: true
      });

      apiLogger.info('Candidate profile updated', { userId });
    } catch (profileError) {
      // Log error but don't fail the entire job
      apiLogger.error('Failed to update candidate profile', {
        userId,
        error: profileError.message
      });
    }

    // Step 4: Update vector database if candidate has embeddings
    try {
      const candidateWithEmbedding = await embeddingDatabaseService.getCandidateWithEmbedding(userId);
      if (candidateWithEmbedding) {
        await embeddingDatabaseService.saveCandidateWithEmbedding(userId, {
          ...candidateWithEmbedding,
          videoIntroductionUrl: uploadResult.url
        });
        apiLogger.info('Video URL updated in vector database', { userId });
      }
    } catch (embeddingError) {
      // Non-critical error - log but don't fail
      apiLogger.warn('Failed to update video URL in vector database', {
        userId,
        error: embeddingError.message
      });
    }

    const result = {
      videoUrl: uploadResult.url,
      profileComplete: true,
      fileName: fileName,
      originalSize: originalSize,
      uploadedSize: uploadResult.size
    };

    apiLogger.info('Video processing completed successfully', {
      userId,
      result,
      memoryFinal: process.memoryUsage()
    });

    return result;

  } catch (error) {
    apiLogger.error('Video processing failed', {
      userId,
      fileName,
      error: error.message,
      stack: error.stack,
      memoryAtError: process.memoryUsage()
    });
    throw error;
  } finally {
    // Explicit cleanup to prevent memory leaks
    try {
      if (videoBuffer) {
        videoBuffer.fill(0);
        videoBuffer = null;
      }
      
      videoFile = null;
      base64Content = null;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        apiLogger.debug('Forced garbage collection after video processing', {
          userId,
          memoryAfterGC: process.memoryUsage()
        });
      }
    } catch (cleanupError) {
      apiLogger.warn('Error during video processing cleanup', {
        userId,
        error: cleanupError.message
      });
    }
  }
}

// Memory monitoring for video worker
export function getVideoWorkerMemoryStats() {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers,
    rssMB: Math.round(usage.rss / 1024 / 1024),
    heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
    timestamp: new Date()
  };
}

// Health check for video worker
export function videoWorkerHealthCheck() {
  const memStats = getVideoWorkerMemoryStats();
  const memoryPercent = (memStats.heapUsed / memStats.heapTotal) * 100;
  
  return {
    status: memoryPercent > 85 ? 'degraded' : 'healthy',
    memory: memStats,
    memoryPercent,
    workerType: 'video'
  };
}