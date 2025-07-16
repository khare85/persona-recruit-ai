/**
 * Resume processing service that handles the complete pipeline:
 * 1. File upload with UUID to Firebase Storage
 * 2. Document AI text extraction
 * 3. Vertex AI embedding generation
 * 4. Database storage with vector search support
 */

import { v4 as uuidv4 } from 'uuid';
import { fileUploadService } from '@/lib/storage';
import { processResumeWithDocAI } from '@/ai/flows/process-resume-document-ai-flow';
import { generateResumeSummary } from '@/ai/flows/generate-resume-summary-flow';
import { extractProfileFromResume } from '@/ai/flows/extract-profile-from-resume';
import { textEmbeddingService } from './textEmbedding.service';
import { embeddingDatabaseService } from './embeddingDatabase.service';
import { databaseService } from './database.service';
import { apiLogger } from '@/lib/logger';

export interface ResumeProcessingOptions {
  userId: string;
  file: File;
  skipEmbeddings?: boolean; // For testing or when AI services are unavailable
}

export interface ResumeProcessingResult {
  success: boolean;
  data?: {
    resumeUrl: string;
    fileName: string;
    extractedText?: string;
    hasEmbeddings: boolean;
    processingSteps: {
      fileUpload: boolean;
      textExtraction: boolean;
      embeddingGeneration: boolean;
      databaseSave: boolean;
      vectorSearchSave: boolean;
    };
  };
  error?: string;
  warnings?: string[];
}

class ResumeProcessingService {
  
  /**
   * Complete resume processing pipeline
   */
  async processResume(options: ResumeProcessingOptions): Promise<ResumeProcessingResult> {
    const { userId, file, skipEmbeddings = false } = options;
    const warnings: string[] = [];
    
    const processingSteps = {
      fileUpload: false,
      textExtraction: false,
      embeddingGeneration: false,
      databaseSave: false,
      vectorSearchSave: false
    };

    try {
      apiLogger.info('Starting resume processing pipeline', {
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        skipEmbeddings
      });

      // Validate file
      const validation = this.validateResumeFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Step 1: Upload file to storage with UUID
      const uploadResult = await this.uploadResumeFile(userId, file);
      processingSteps.fileUpload = true;
      
      apiLogger.info('Resume file uploaded successfully', {
        userId,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.url
      });

      // Step 2: Extract text with Document AI
      let extractedText = '';
      try {
        if (!skipEmbeddings) {
          extractedText = await this.extractTextFromResume(file);
          processingSteps.textExtraction = true;
          
          apiLogger.info('Text extraction completed', {
            userId,
            textLength: extractedText.length
          });
        }
      } catch (error) {
        apiLogger.warn('Text extraction failed, continuing without embeddings', {
          userId,
          error: String(error)
        });
        warnings.push('Text extraction failed - resume uploaded but AI features may be limited');
      }

      // Step 3: Extract comprehensive profile information
      let profileData: Record<string, any> = {};
      let aiGeneratedSummary: string | undefined;
      try {
        if (!skipEmbeddings && extractedText && extractedText.length > 100) {
          // Extract full profile information
          const profileResult = await extractProfileFromResume({
            resumeText: extractedText
          });
          
          profileData = profileResult;
          aiGeneratedSummary = profileResult.professionalSummary;
          
          apiLogger.info('Profile extraction completed successfully', {
            userId,
            extractedFields: Object.keys(profileResult).filter(key => profileResult[key as keyof typeof profileResult] !== undefined)
          });
        }
      } catch (error) {
        apiLogger.warn('Profile extraction failed, falling back to summary generation', {
          userId,
          error: String(error)
        });
        
        // Fallback to just summary generation
        try {
          if (!skipEmbeddings && extractedText && extractedText.length > 100) {
            const summaryResult = await generateResumeSummary({
              resumeText: extractedText
            });
            aiGeneratedSummary = summaryResult.summary;
          }
        } catch (summaryError) {
          apiLogger.warn('Summary generation also failed', {
            userId,
            error: String(summaryError)
          });
        }
        
        warnings.push('Full profile extraction failed - some fields may need manual update');
      }

      // Step 4: Generate embeddings
      let resumeEmbedding: number[] = [];
      try {
        if (!skipEmbeddings && extractedText && extractedText.length > 50) {
          resumeEmbedding = await this.generateEmbeddings(extractedText);
          processingSteps.embeddingGeneration = true;
          
          apiLogger.info('Embeddings generated successfully', {
            userId,
            embeddingDimension: resumeEmbedding.length
          });
        }
      } catch (error) {
        apiLogger.warn('Embedding generation failed, continuing without vector search', {
          userId,
          error: String(error)
        });
        warnings.push('Embedding generation failed - vector search features may be limited');
      }

      // Step 5: Update candidate profile with all extracted data
      await this.updateCandidateProfile(userId, uploadResult.url, profileData, aiGeneratedSummary);
      processingSteps.databaseSave = true;

      // Step 6: Save to vector database (if we have embeddings)
      if (resumeEmbedding.length > 0) {
        try {
          await this.saveToVectorDatabase(userId, {
            extractedText,
            resumeEmbedding,
            resumeUrl: uploadResult.url,
            aiSummary: aiGeneratedSummary
          });
          processingSteps.vectorSearchSave = true;
          
          apiLogger.info('Candidate saved to vector database', { userId });
        } catch (error) {
          apiLogger.warn('Vector database save failed, basic functionality still available', {
            userId,
            error: String(error)
          });
          warnings.push('Vector search features may be limited due to database save failure');
        }
      }

      apiLogger.info('Resume processing pipeline completed', {
        userId,
        processingSteps,
        hasEmbeddings: resumeEmbedding.length > 0,
        warningsCount: warnings.length
      });

      return {
        success: true,
        data: {
          resumeUrl: uploadResult.url,
          fileName: uploadResult.fileName,
          extractedText: extractedText.length > 50 ? extractedText : undefined,
          hasEmbeddings: resumeEmbedding.length > 0,
          processingSteps
        },
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      apiLogger.error('Resume processing pipeline failed', {
        userId,
        error: String(error),
        processingSteps
      });
      
      return {
        success: false,
        error: `Resume processing failed: ${error instanceof Error ? error.message : String(error)}`,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }
  }

  /**
   * Validate resume file
   */
  private validateResumeFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload a PDF, DOC, or DOCX file.'
      };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size too large. Maximum size is 5MB.'
      };
    }

    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty.'
      };
    }

    return { isValid: true };
  }

  /**
   * Upload resume file to storage with UUID
   */
  private async uploadResumeFile(userId: string, file: File): Promise<{ url: string; fileName: string }> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const uploadResult = await fileUploadService.uploadFile(file, 'document', {
      path: `candidates/${userId}/resume/${uniqueFileName}`,
      maxSize: 5 * 1024 * 1024
    });

    return {
      url: uploadResult.url,
      fileName: uniqueFileName
    };
  }

  /**
   * Extract text from resume using Document AI
   */
  private async extractTextFromResume(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const base64Content = Buffer.from(arrayBuffer).toString('base64');

    const result = await processResumeWithDocAI({
      resumeFileBase64: base64Content,
      mimeType: file.type
    });

    if (!result.extractedText || result.extractedText.length < 10) {
      throw new Error('Document AI returned insufficient text content');
    }

    return result.extractedText;
  }

  /**
   * Generate embeddings from extracted text
   */
  private async generateEmbeddings(text: string): Promise<number[]> {
    if (text.length < 50) {
      throw new Error('Text too short for meaningful embeddings');
    }

    const embedding = await textEmbeddingService.generateDocumentEmbedding(text);
    
    if (!embedding || embedding.length === 0) {
      throw new Error('Failed to generate embeddings');
    }

    return embedding;
  }

  /**
   * Update candidate profile with resume URL and extracted profile data
   */
  private async updateCandidateProfile(userId: string, resumeUrl: string, profileData: Record<string, any>, aiSummary?: string): Promise<void> {
    const updates: Record<string, any> = {
      resumeUrl: resumeUrl,
      resumeUploaded: true,
      profileComplete: true,
      updatedAt: new Date().toISOString()
    };

    // Add AI-generated summary
    if (aiSummary) {
      updates.summary = aiSummary;
      updates.aiGeneratedSummary = aiSummary;
    }

    // Add extracted profile fields
    if (profileData.currentTitle) {
      updates.currentTitle = profileData.currentTitle;
    }

    if (profileData.experience) {
      // Map AI experience levels to database format
      const experienceMap: { [key: string]: string } = {
        'entry_level': 'Entry Level',
        'mid_level': '3-5 years',
        'senior': '5-10 years',
        'executive': '10+ years'
      };
      updates.experience = experienceMap[profileData.experience] || '3-5 years';
    }

    if (profileData.location) {
      updates.location = profileData.location;
    }

    if (profileData.skills && profileData.skills.length > 0) {
      updates.skills = profileData.skills;
    }

    if (profileData.phone) {
      updates.phone = profileData.phone;
    }

    if (profileData.linkedinUrl) {
      updates.linkedinUrl = profileData.linkedinUrl;
    }

    if (profileData.expectedSalary) {
      // Parse salary string to extract min/max values
      // Handle formats like "$80,000 - $100,000" or "80k-100k" or "$90,000"
      const salaryStr = profileData.expectedSalary;
      const numbers = salaryStr.match(/\d+/g);
      
      if (numbers && numbers.length > 0) {
        const min = parseInt(numbers[0]) * (salaryStr.toLowerCase().includes('k') ? 1000 : 1);
        const max = numbers.length > 1 ? parseInt(numbers[1]) * (salaryStr.toLowerCase().includes('k') ? 1000 : 1) : min;
        
        updates.expectedSalary = {
          min: min,
          max: max,
          currency: 'USD' // Default to USD, could be enhanced to detect currency
        };
      }
    }

    if (profileData.preferredLocations && profileData.preferredLocations.length > 0) {
      updates.preferredLocations = profileData.preferredLocations;
      // If candidate has multiple preferred locations, they're likely willing to relocate
      updates.willingToRelocate = profileData.preferredLocations.length > 1;
    }

    if (profileData.preferredJobTypes && profileData.preferredJobTypes.length > 0) {
      updates.preferredJobTypes = profileData.preferredJobTypes;
    }

    // Set availableForWork to true if profile is being updated with resume
    updates.availableForWork = true;

    await databaseService.updateCandidateProfile(userId, updates);
  }

  /**
   * Save candidate data to vector database for search
   */
  private async saveToVectorDatabase(
    userId: string, 
    data: { 
      extractedText: string; 
      resumeEmbedding: number[]; 
      resumeUrl: string;
      aiSummary?: string;
    }
  ): Promise<void> {
    // Get candidate profile and user data
    const [candidateProfile, user] = await Promise.all([
      databaseService.getCandidateProfile(userId),
      databaseService.getUserById(userId)
    ]);

    if (!candidateProfile || !user) {
      throw new Error('Candidate profile or user data not found');
    }

    await embeddingDatabaseService.saveCandidateWithEmbedding(userId, {
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      currentTitle: candidateProfile.currentTitle,
      extractedResumeText: data.extractedText,
      resumeEmbedding: data.resumeEmbedding,
      skills: candidateProfile.skills,
      phone: candidateProfile.phone,
      linkedinProfile: candidateProfile.linkedinUrl,
      portfolioUrl: candidateProfile.portfolioUrl,
      experienceSummary: candidateProfile.summary,
      aiGeneratedSummary: data.aiSummary,
      resumeFileUrl: data.resumeUrl,
      videoIntroductionUrl: candidateProfile.videoIntroUrl
    });
  }

  /**
   * Check if candidate has processed resume with embeddings
   */
  async getCandidateResumeStatus(userId: string): Promise<{
    hasResume: boolean;
    hasEmbeddings: boolean;
    resumeUrl?: string;
    vectorSearchEnabled: boolean;
  }> {
    try {
      const candidateProfile = await databaseService.getCandidateProfile(userId);
      
      if (!candidateProfile) {
        return {
          hasResume: false,
          hasEmbeddings: false,
          vectorSearchEnabled: false
        };
      }

      let hasEmbeddings = false;
      try {
        const candidateWithEmbedding = await embeddingDatabaseService.getCandidateWithEmbedding(userId);
        hasEmbeddings = !!candidateWithEmbedding?.resumeEmbedding;
      } catch {
        hasEmbeddings = false;
      }

      return {
        hasResume: !!candidateProfile.resumeUrl,
        hasEmbeddings,
        resumeUrl: candidateProfile.resumeUrl,
        vectorSearchEnabled: hasEmbeddings
      };
    } catch (error) {
      apiLogger.error('Failed to get candidate resume status', {
        userId,
        error: String(error)
      });
      
      return {
        hasResume: false,
        hasEmbeddings: false,
        vectorSearchEnabled: false
      };
    }
  }

  /**
   * Reprocess existing resume (for updating embeddings, etc.)
   */
  async reprocessExistingResume(userId: string): Promise<ResumeProcessingResult> {
    try {
      const candidateProfile = await databaseService.getCandidateProfile(userId);
      
      if (!candidateProfile?.resumeUrl) {
        return {
          success: false,
          error: 'No resume found to reprocess'
        };
      }

      // For reprocessing, we'd need to fetch the file from storage
      // This is a placeholder for that functionality
      return {
        success: false,
        error: 'Reprocessing functionality not yet implemented - please upload a new resume'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to reprocess resume: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export const resumeProcessingService = new ResumeProcessingService();
export default resumeProcessingService;