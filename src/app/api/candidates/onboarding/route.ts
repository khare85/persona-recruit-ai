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
  firstName: z.string().min(2, 'First name is required').optional(),
  lastName: z.string().min(2, 'Last name is required').optional(),
  phone: z.string().optional(),
  location: z.string().min(2, 'Location is required').optional(),
  resumeFile: z.string().optional(), // Base64 encoded
  resumeMimeType: z.string().optional(),
  videoBlob: z.string().optional(), // Base64 encoded
});

/**
 * POST /api/candidates/onboarding - Complete candidate onboarding with AI profile generation
 * This endpoint is designed to be called after a user has been created in Firebase Auth.
 * It populates their profile details.
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

        apiLogger.info('Candidate onboarding/profile update initiated', { 
          userId,
          hasResume: !!data.resumeFile,
          hasVideo: !!data.videoBlob
        });

        // Get existing user and profile data
        const [user, existingProfile] = await Promise.all([
          databaseService.getUserById(userId),
          databaseService.getCandidateProfile(userId)
        ]);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Initialize or update profile data
        const profileUpdates: Record<string, any> = {};

        // Update basic info if provided
        if (data.firstName) profileUpdates.firstName = data.firstName;
        if (data.lastName) profileUpdates.lastName = data.lastName;
        if (data.phone) profileUpdates.phone = data.phone;
        if (data.location) profileUpdates.location = data.location;
        
        if(Object.keys(profileUpdates).length > 0) {
            await databaseService.updateUser(userId, {
                firstName: data.firstName || user.firstName,
                lastName: data.lastName || user.lastName
            });

            await databaseService.updateCandidateProfile(userId, {
                phone: data.phone || existingProfile?.phone,
                location: data.location || existingProfile?.location,
            });
        }

        // Process resume if provided
        let resumeUrl = existingProfile?.resumeUrl || '';
        let extractedText = '';
        
        if (data.resumeFile && data.resumeMimeType) {
          try {
            const resumeBuffer = Buffer.from(data.resumeFile, 'base64');
            const fileExtension = data.resumeMimeType.includes('pdf') ? 'pdf' : 'docx';
            const uniqueFileName = `${uuidv4()}.${fileExtension}`;
            
            const resumeFile = new File([resumeBuffer], uniqueFileName, { type: data.resumeMimeType });
            
            const uploadResult = await fileUploadService.uploadFile(resumeFile, 'resume', {
              path: `candidates/${userId}/resumes/${uniqueFileName}`,
            });
            
            resumeUrl = uploadResult.url;
            profileUpdates.resumeUrl = resumeUrl;
            
            apiLogger.info('Resume uploaded', { userId, resumeUrl });

            const docAIResult = await processResumeWithDocAI({
              resumeFileBase64: data.resumeFile,
              mimeType: data.resumeMimeType
            });
            extractedText = docAIResult.extractedText;

            if (extractedText.length > 100) {
              const [summaryResult, skillsResult] = await Promise.all([
                generateResumeSummary({ resumeText: extractedText }),
                extractSkillsFromResume({ resumeText: extractedText })
              ]);
              
              profileUpdates.summary = summaryResult.summary;
              profileUpdates.skills = skillsResult.skills.slice(0, 20);

              const titleMatch = extractedText.match(/(?:current\s+position|title|role)[\s:]*([^\n]+)/i);
              if (titleMatch && titleMatch[1]) {
                profileUpdates.currentTitle = titleMatch[1].trim().substring(0, 100);
              }

              apiLogger.info('AI profile generation completed', { 
                userId,
                skillsCount: profileUpdates.skills.length,
                summaryLength: profileUpdates.summary.length
              });
            }
          } catch (error) {
            apiLogger.error('Resume processing failed', { userId, error: String(error) });
          }
        }

        // Process video if provided
        let videoUrl = existingProfile?.videoIntroUrl || '';
        if (data.videoBlob) {
          try {
            const videoBuffer = Buffer.from(data.videoBlob, 'base64');
            const videoFile = new File([videoBuffer], "intro.webm", { type: 'video/webm' });
            
            const uploadResult = await fileUploadService.uploadFile(videoFile, 'video', {
              path: `candidates/${userId}/video-intro/${uuidv4()}.webm`,
            });
            
            videoUrl = uploadResult.url;
            profileUpdates.videoIntroUrl = videoUrl;

            apiLogger.info('Video uploaded', { userId, videoUrl });
          } catch (error) {
            apiLogger.error('Video upload failed', { userId, error: String(error) });
          }
        }

        // Mark profile as complete if we have essential data
        profileUpdates.profileComplete = !!(profileUpdates.summary || existingProfile?.summary) && 
                                        ((profileUpdates.skills?.length > 0) || (existingProfile?.skills?.length || 0) > 0);
        
        // Save all updates to the profile
        await databaseService.updateCandidateProfile(userId, profileUpdates);
        
        // Generate and save embeddings
        if (extractedText.length > 50) {
          try {
            const embedding = await textEmbeddingService.generateDocumentEmbedding(extractedText);
            
            await embeddingDatabaseService.saveCandidateWithEmbedding(userId, {
              fullName: `${data.firstName || user.firstName} ${data.lastName || user.lastName}`,
              email: user.email,
              currentTitle: profileUpdates.currentTitle || existingProfile?.currentTitle || '',
              extractedResumeText: extractedText,
              resumeEmbedding: embedding,
              skills: profileUpdates.skills || existingProfile?.skills || [],
              experienceSummary: profileUpdates.summary || existingProfile?.summary || '',
              resumeFileUrl: resumeUrl
            });

            apiLogger.info('Embeddings saved for vector search', { userId });
          } catch (error) {
            apiLogger.error('Embedding generation failed', { userId, error: String(error) });
          }
        }
        
        apiLogger.info('Candidate onboarding/update completed', { userId });

        return NextResponse.json({
          success: true,
          data: {
            profileComplete: profileUpdates.profileComplete,
            profile: profileUpdates
          },
          message: 'Profile updated successfully!' 
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
