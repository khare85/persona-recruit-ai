/**
 * Document Processing Worker
 * Handles memory-intensive document/resume operations in separate process
 */

import { apiLogger } from '../lib/logger';
import { fileUploadService } from '../lib/storage';
import { databaseService } from '../services/database.service';
import { embeddingDatabaseService } from '../services/embeddingDatabase.service';
import { textEmbeddingService } from '../services/textEmbedding.service';
import { processResumeWithDocAI } from '../ai/flows/process-resume-document-ai-flow';
import type { DocumentProcessingJob, JobResult } from '../lib/backgroundJobs';

export async function processDocumentJob(jobData: DocumentProcessingJob): Promise<JobResult['data']> {
  const { userId, fileBuffer, fileName, fileType, originalSize } = jobData;
  
  let arrayBuffer: ArrayBuffer | null = null;
  let base64Content: string | null = null;
  let extractedText: string | null = null;
  let resumeEmbedding: number[] = [];

  try {
    apiLogger.info('Starting document processing', {
      userId,
      fileName,
      fileType,
      originalSize,
      memoryBefore: process.memoryUsage()
    });

    // Step 1: Create File object and upload to storage
    let uploadResult;
    try {
      const file = new File([fileBuffer], fileName, { type: fileType });
      
      uploadResult = await fileUploadService.uploadFile(file, 'document', {
        path: `candidates/${userId}/resume/${fileName}`,
        maxSize: 5 * 1024 * 1024 // 5MB max
      });

      apiLogger.info('Document uploaded to storage', {
        userId,
        uploadUrl: uploadResult.url,
        memoryAfterUpload: process.memoryUsage()
      });
    } catch (uploadError) {
      throw new Error(`Failed to upload document: ${uploadError.message}`);
    }

    // Step 2: Process with Document AI (with memory management)
    try {
      // Convert buffer to base64 for Document AI with explicit cleanup
      arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
      const buffer = Buffer.from(arrayBuffer);
      base64Content = buffer.toString('base64');
      
      // Clear buffer immediately after conversion
      buffer.fill(0);
      arrayBuffer = null;

      apiLogger.info('Starting Document AI processing', {
        userId,
        base64Length: base64Content.length,
        memoryAfterBase64: process.memoryUsage()
      });

      const docAIResult = await processResumeWithDocAI({
        resumeFileBase64: base64Content,
        mimeType: fileType
      });

      extractedText = docAIResult.extractedText;

      apiLogger.info('Document AI processing completed', {
        userId,
        extractedTextLength: extractedText.length,
        memoryAfterDocAI: process.memoryUsage()
      });

    } catch (docAIError) {
      apiLogger.error('Document AI processing failed', {
        userId,
        error: docAIError.message
      });
      // Continue without text extraction - still a valid upload
      extractedText = 'Text extraction failed. Resume file uploaded successfully.';
    } finally {
      // Clear Document AI memory
      base64Content = null;
      arrayBuffer = null;
      
      if (global.gc) {
        global.gc();
      }
    }

    // Step 3: Generate embeddings from extracted text (with memory management)
    try {
      if (extractedText && extractedText.length > 50) {
        resumeEmbedding = await textEmbeddingService.generateDocumentEmbedding(extractedText);
        
        apiLogger.info('Resume embedding generated', {
          userId,
          embeddingDimension: resumeEmbedding.length,
          memoryAfterEmbedding: process.memoryUsage()
        });
      }
    } catch (embeddingError) {
      apiLogger.error('Embedding generation failed', {
        userId,
        error: embeddingError.message
      });
      // Continue without embeddings - basic functionality still works
      resumeEmbedding = [];
    } finally {
      // Clear large text from memory after embedding generation
      if (extractedText && extractedText.length > 10000) {
        extractedText = extractedText.substring(0, 500) + '... [truncated for memory]';
      }
    }

    // Step 4: Update candidate profile
    try {
      await databaseService.updateCandidateProfile(userId, {
        resumeUrl: uploadResult.url,
        profileComplete: true
      });

      apiLogger.info('Candidate profile updated with resume', { userId });
    } catch (profileError) {
      apiLogger.error('Failed to update candidate profile', {
        userId,
        error: profileError.message
      });
      // Don't fail the entire job for this
    }

    // Step 5: Save to embedding database for vector search (if we have embeddings)
    let vectorSearchEnabled = false;
    if (resumeEmbedding.length > 0) {
      try {
        // Get user data for embedding database
        const [candidateProfile, user] = await Promise.all([
          databaseService.getCandidateProfile(userId),
          databaseService.getUserById(userId)
        ]);

        if (candidateProfile && user) {
          await embeddingDatabaseService.saveCandidateWithEmbedding(userId, {
            fullName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            currentTitle: candidateProfile.currentTitle,
            extractedResumeText: extractedText || '',
            resumeEmbedding: resumeEmbedding,
            skills: candidateProfile.skills,
            phone: candidateProfile.phone,
            linkedinProfile: candidateProfile.linkedinUrl,
            portfolioUrl: candidateProfile.portfolioUrl,
            experienceSummary: candidateProfile.summary,
            resumeFileUrl: uploadResult.url,
            videoIntroductionUrl: candidateProfile.videoIntroUrl,
            availability: candidateProfile.availability
          });

          vectorSearchEnabled = true;
          apiLogger.info('Candidate saved with embeddings for vector search', {
            userId,
            hasEmbedding: true
          });
        }
      } catch (embeddingDBError) {
        apiLogger.error('Failed to save candidate embeddings', {
          userId,
          error: embeddingDBError.message
        });
        // Continue - basic resume upload still succeeded
      }
    }

    const result = {
      resumeUrl: uploadResult.url,
      fileName: fileName,
      originalSize: originalSize,
      uploadedSize: uploadResult.size,
      extractedText: extractedText && extractedText.length > 50 ? 'Text extracted successfully' : 'Text extraction failed',
      hasEmbeddings: resumeEmbedding.length > 0,
      vectorSearchEnabled,
      processingComplete: true
    };

    apiLogger.info('Document processing completed successfully', {
      userId,
      result,
      memoryFinal: process.memoryUsage()
    });

    return result;

  } catch (error) {
    apiLogger.error('Document processing failed', {
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
      arrayBuffer = null;
      base64Content = null;
      extractedText = null;
      resumeEmbedding = [];
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        apiLogger.debug('Forced garbage collection after document processing', {
          userId,
          memoryAfterGC: process.memoryUsage()
        });
      }
    } catch (cleanupError) {
      apiLogger.warn('Error during document processing cleanup', {
        userId,
        error: cleanupError.message
      });
    }
  }
}

// Memory monitoring for document worker
export function getDocumentWorkerMemoryStats() {
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

// Health check for document worker
export function documentWorkerHealthCheck() {
  const memStats = getDocumentWorkerMemoryStats();
  const memoryPercent = (memStats.heapUsed / memStats.heapTotal) * 100;
  
  return {
    status: memoryPercent > 85 ? 'degraded' : 'healthy',
    memory: memStats,
    memoryPercent,
    workerType: 'document'
  };
}