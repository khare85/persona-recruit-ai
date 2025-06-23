import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';
import { fileUploadService } from '@/lib/storage';
import { processResumeWithDocAI } from '@/ai/flows/process-resume-document-ai-flow';
import { textEmbeddingService } from '@/services/textEmbedding.service';
import { embeddingDatabaseService } from '@/services/embeddingDatabase.service';
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

        // Step 1: Upload raw file to Firebase Storage with UUID
        const uploadResult = await fileUploadService.uploadFile(file, 'document', {
          path: `candidates/${userId}/resume/${uniqueFileName}`,
          maxSize: maxSize
        });

        apiLogger.info('Resume file uploaded to storage', { 
          userId,
          fileUrl: uploadResult.url,
          fileName: uniqueFileName
        });

        // Step 2: Process resume with Document AI
        let extractedText = '';
        try {
          // Convert file to base64 for Document AI
          const arrayBuffer = await file.arrayBuffer();
          const base64Content = Buffer.from(arrayBuffer).toString('base64');

          const docAIResult = await processResumeWithDocAI({
            resumeFileBase64: base64Content,
            mimeType: file.type
          });

          extractedText = docAIResult.extractedText;

          apiLogger.info('Document AI processing completed', { 
            userId,
            extractedTextLength: extractedText.length
          });
        } catch (error) {
          apiLogger.error('Document AI processing failed', { 
            userId,
            error: String(error)
          });
          
          // Continue without text extraction - user can still use the uploaded file
          extractedText = 'Text extraction failed. Resume file uploaded successfully.';
        }

        // Step 3: Generate embeddings from extracted text
        let resumeEmbedding: number[] = [];
        try {
          if (extractedText && extractedText.length > 50) {
            resumeEmbedding = await textEmbeddingService.generateDocumentEmbedding(extractedText);
            
            apiLogger.info('Resume embedding generated', { 
              userId,
              embeddingDimension: resumeEmbedding.length
            });
          }
        } catch (error) {
          apiLogger.error('Embedding generation failed', { 
            userId,
            error: String(error)
          });
          
          // Continue without embeddings - basic functionality still works
          resumeEmbedding = [];
        }

        // Step 4: Get candidate profile and user data
        const [candidateProfile, user] = await Promise.all([
          databaseService.getCandidateProfile(userId),
          databaseService.getUserById(userId)
        ]);

        if (!candidateProfile || !user) {
          return NextResponse.json(
            { error: 'Candidate profile not found' },
            { status: 404 }
          );
        }

        // Step 5: Update candidate profile with resume URL
        await databaseService.updateCandidateProfile(userId, {
          resumeUrl: uploadResult.url,
          profileComplete: true
        });

        // Step 6: Save to embedding database for vector search (if we have embeddings)
        if (resumeEmbedding.length > 0) {
          try {
            await embeddingDatabaseService.saveCandidateWithEmbedding(userId, {
              fullName: `${user.firstName} ${user.lastName}`,
              email: user.email,
              currentTitle: candidateProfile.currentTitle,
              extractedResumeText: extractedText,
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

            apiLogger.info('Candidate saved with embeddings for vector search', { 
              userId,
              hasEmbedding: true
            });
          } catch (error) {
            apiLogger.error('Failed to save candidate embeddings', { 
              userId,
              error: String(error)
            });
            // Continue - basic resume upload still succeeded
          }
        }

        apiLogger.info('Resume processing completed successfully', { 
          userId,
          fileName: uniqueFileName,
          hasTextExtraction: extractedText.length > 50,
          hasEmbeddings: resumeEmbedding.length > 0,
          resumeUrl: uploadResult.url
        });

        return NextResponse.json({
          success: true,
          data: {
            resumeUrl: uploadResult.url,
            fileName: uniqueFileName,
            extractedText: extractedText.length > 50 ? 'Text extracted successfully' : 'Text extraction failed',
            hasEmbeddings: resumeEmbedding.length > 0,
            processingComplete: true
          },
          message: 'Resume uploaded and processed successfully'
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