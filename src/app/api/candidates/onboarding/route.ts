import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';
import { fileUploadService } from '@/lib/storage';
import { processResumeWithDocAI } from '@/ai/flows/process-resume-document-ai-flow';
import { generateResumeSummary } from '@/ai/flows/generate-resume-summary-flow';
import { extractSkillsFromResume } from '@/ai/flows/resume-skill-extractor';
import { textEmbeddingService } from '@/services/textEmbedding.service';
import { embeddingDatabaseService } from '@/services/embeddingDatabase.service';
import { v4 as uuidv4 } from 'uuid';

const onboardingSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
  resumeFile: z.string().optional(), // Base64 encoded
  resumeMimeType: z.string().optional(),
  videoBlob: z.string().optional(), // Base64 encoded
});

/**
 * POST /api/candidates/onboarding - Complete candidate onboarding with AI profile generation
 */
export const POST = withRateLimit('upload',
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const body = await req.json();
        
        const validation = onboardingSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            { error: 'Invalid onboarding data', details: validation.error.errors },
            { status: 400 }
          );
        }

        const data = validation.data;

        apiLogger.info('Starting candidate onboarding', { 
          userId,
          hasResume: !!data.resumeFile,
          hasVideo: !!data.videoBlob
        });

        // Check if profile already exists
        const existingProfile = await databaseService.getCandidateProfile(userId);
        if (existingProfile && existingProfile.profileComplete) {
          return NextResponse.json(
            { error: 'Profile already completed' },
            { status: 400 }
          );
        }

        // Initialize profile data
        const profileData: Record<string, any> = {
          userId,
          phone: data.phone,
          location: data.location,
          profileComplete: false,
          availableForWork: true,
          skills: [],
          currentTitle: 'Professional', // Default, will be updated from resume
          summary: '', // Will be generated from resume
        };

        // Process resume if provided
        let resumeUrl = '';
        let extractedText = '';
        
        if (data.resumeFile && data.resumeMimeType) {
          try {
            // Upload resume file
            const resumeBuffer = Buffer.from(data.resumeFile, 'base64');
            const resumeBlob = new Blob([resumeBuffer], { type: data.resumeMimeType });
            const fileExtension = data.resumeMimeType.includes('pdf') ? 'pdf' : 'docx';
            const uniqueFileName = `${uuidv4()}.${fileExtension}`;
            
            // Create a File object from Blob
            const resumeFile = new File([resumeBlob], uniqueFileName, { type: data.resumeMimeType });
            
            const uploadResult = await fileUploadService.uploadFile(resumeFile, 'document', {
              path: `candidates/${userId}/resume/${uniqueFileName}`,
              maxSize: 5 * 1024 * 1024 // 5MB
            });
            
            resumeUrl = uploadResult.url;
            profileData.resumeUrl = resumeUrl;

            apiLogger.info('Resume uploaded', { userId, resumeUrl });

            // Process with Document AI
            const docAIResult = await processResumeWithDocAI({
              resumeFileBase64: data.resumeFile,
              mimeType: data.resumeMimeType
            });
            
            extractedText = docAIResult.extractedText;

            apiLogger.info('Resume processed with Document AI', { 
              userId,
              textLength: extractedText.length 
            });

            // Generate AI summary
            if (extractedText.length > 100) {
              const summaryResult = await generateResumeSummary({
                resumeText: extractedText
              });
              profileData.summary = summaryResult.summary;

              // Extract skills
              const skillsResult = await extractSkillsFromResume({
                resumeText: extractedText
              });
              profileData.skills = skillsResult.skills.slice(0, 20); // Limit to 20 skills

              // Extract title from resume (simple approach - look for common patterns)
              const titleMatch = extractedText.match(/(?:current\s+position|title|role)[\s:]*([^\n]+)/i);
              if (titleMatch && titleMatch[1]) {
                profileData.currentTitle = titleMatch[1].trim().substring(0, 100);
              }

              apiLogger.info('AI profile generation completed', { 
                userId,
                skillsCount: profileData.skills.length,
                summaryLength: profileData.summary.length
              });
            }
          } catch (error) {
            apiLogger.error('Resume processing failed', { userId, error: String(error) });
            // Continue without resume processing
          }
        }

        // Process video if provided
        let videoUrl = '';
        if (data.videoBlob) {
          try {
            const videoBuffer = Buffer.from(data.videoBlob, 'base64');
            const videoBlob = new Blob([videoBuffer], { type: 'video/webm' });
            const uniqueFileName = `${uuidv4()}.webm`;
            
            // Create a File object from Blob
            const videoFile = new File([videoBlob], uniqueFileName, { type: 'video/webm' });
            
            const uploadResult = await fileUploadService.uploadFile(videoFile, 'video', {
              path: `candidates/${userId}/video-intro/${uniqueFileName}`,
              maxSize: 10 * 1024 * 1024 // 10MB
            });
            
            videoUrl = uploadResult.url;
            profileData.videoIntroUrl = videoUrl;

            apiLogger.info('Video uploaded', { userId, videoUrl });
          } catch (error) {
            apiLogger.error('Video upload failed', { userId, error: String(error) });
            // Continue without video
          }
        }

        // Mark profile as complete if we have essential data
        profileData.profileComplete = !!(profileData.summary && profileData.skills.length > 0);

        // Create or update candidate profile
        if (existingProfile) {
          await databaseService.updateCandidateProfile(userId, profileData);
        } else {
          await databaseService.createCandidateProfile(profileData);
        }

        // Update user's display name if not set
        const user = await databaseService.getUserById(userId);
        if (user && !user.displayName) {
          await databaseService.updateUser(userId, {
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: `${data.firstName} ${data.lastName}`
          });
        }

        // Generate embeddings for vector search
        if (extractedText.length > 50) {
          try {
            const embedding = await textEmbeddingService.generateDocumentEmbedding(extractedText);
            
            await embeddingDatabaseService.saveCandidateWithEmbedding(userId, {
              fullName: `${data.firstName} ${data.lastName}`,
              email: user!.email,
              currentTitle: profileData.currentTitle,
              extractedResumeText: extractedText,
              resumeEmbedding: embedding,
              skills: profileData.skills,
              phone: profileData.phone,
              linkedinProfile: profileData.linkedinUrl,
              portfolioUrl: profileData.portfolioUrl,
              experienceSummary: profileData.summary,
              resumeFileUrl: resumeUrl,
              videoIntroductionUrl: videoUrl,
              availability: 'immediate'
            });

            apiLogger.info('Embeddings saved for vector search', { userId });
          } catch (error) {
            apiLogger.error('Embedding generation failed', { userId, error: String(error) });
            // Continue without embeddings
          }
        }

        apiLogger.info('Candidate onboarding completed', { 
          userId,
          profileComplete: profileData.profileComplete,
          hasResume: !!resumeUrl,
          hasVideo: !!videoUrl,
          hasAISummary: !!profileData.summary,
          skillsCount: profileData.skills.length
        });

        return NextResponse.json({
          success: true,
          data: {
            profileComplete: profileData.profileComplete,
            profile: {
              currentTitle: profileData.currentTitle,
              summary: profileData.summary,
              skills: profileData.skills,
              resumeUrl,
              videoUrl
            }
          },
          message: profileData.profileComplete 
            ? 'Profile created successfully with AI enhancements!' 
            : 'Profile created. Please upload a resume to complete your profile.'
        });

      } catch (error) {
        apiLogger.error('Onboarding failed', { 
          userId: req.user?.id,
          error: String(error)
        });
        return handleApiError(error);
      }
    })
  )
);