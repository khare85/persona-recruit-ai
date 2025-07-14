
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { verifyFirebaseToken } from '@/middleware/auth';
import admin from 'firebase-admin';
import { databaseService } from '@/services/database.service';
import { fileUploadService } from '@/lib/storage';
import { processResumeWithDocAI } from '@/ai/flows/process-resume-document-ai-flow';
import { generateResumeSummary } from '@/ai/flows/generate-resume-summary-flow';
import { extractSkillsFromResume } from '@/ai/flows/resume-skill-extractor';
import { textEmbeddingService } from '@/services/textEmbedding.service';
import { embeddingDatabaseService } from '@/services/embeddingDatabase.service';
import { v4 as uuidv4 } from 'uuid';

const candidateRegisterSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
  resumeFile: z.string().optional(), // Base64 encoded
  resumeMimeType: z.string().optional(),
  videoBlob: z.string().optional(), // Base64 encoded
});

/**
 * POST /api/candidates/register - Register candidate with Firebase Auth integration
 * This endpoint handles candidate registration when Firebase Auth user already exists
 */
export const POST = withRateLimit('auth', async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Extract token from authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Parse and validate request body
    const body = await req.json();
    const validation = candidateRegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid registration data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    apiLogger.info('Candidate registration started', { 
      userId,
      email: userEmail,
      hasResume: !!data.resumeFile,
      hasVideo: !!data.videoBlob
    });

    // Set custom claims for the user (this is what the Cloud Function should do)
    try {
      await admin.auth().setCustomUserClaims(userId, {
        role: 'candidate'
      });
      apiLogger.info('Custom claims set for user', { userId, role: 'candidate' });
    } catch (error) {
      apiLogger.warn('Failed to set custom claims', { userId, error: String(error) });
    }

    // Create user document in Firestore
    const userDoc = {
      id: userId,
      email: userEmail,
      firstName: data.firstName,
      lastName: data.lastName,
      displayName: `${data.firstName} ${data.lastName}`,
      role: 'candidate',
      status: 'active',
      emailVerified: decodedToken.email_verified || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await admin.firestore().collection('users').doc(userId).set(userDoc);
      apiLogger.info('User document created', { userId });
    } catch (error) {
      apiLogger.warn('Failed to create user document', { userId, error: String(error) });
    }

    // Initialize profile data
    const profileData: Record<string, any> = {
      userId,
      phone: data.phone || '',
      location: data.location,
      profileComplete: false,
      availableForWork: true,
      skills: [],
      currentTitle: 'Professional',
      summary: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Process resume if provided
    let resumeUrl = '';
    let extractedText = '';
    
    if (data.resumeFile && data.resumeMimeType) {
      try {
        const resumeBuffer = Buffer.from(data.resumeFile, 'base64');
        const resumeBlob = new Blob([resumeBuffer], { type: data.resumeMimeType });
        const fileExtension = data.resumeMimeType.includes('pdf') ? 'pdf' : 'docx';
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        
        const resumeFile = new File([resumeBlob], uniqueFileName, { type: data.resumeMimeType });
        
        const uploadResult = await fileUploadService.uploadFile(resumeFile, 'document', {
          path: `candidates/${userId}/resume/${uniqueFileName}`,
          maxSize: 5 * 1024 * 1024
        });
        
        resumeUrl = uploadResult.url;
        profileData.resumeUrl = resumeUrl;

        // Process with Document AI
        const docAIResult = await processResumeWithDocAI({
          resumeFileBase64: data.resumeFile,
          mimeType: data.resumeMimeType
        });
        
        extractedText = docAIResult.extractedText;

        // Generate AI summary and skills
        if (extractedText.length > 100) {
          const summaryResult = await generateResumeSummary({
            resumeText: extractedText
          });
          profileData.summary = summaryResult.summary;

          const skillsResult = await extractSkillsFromResume({
            resumeText: extractedText
          });
          profileData.skills = skillsResult.skills.slice(0, 20);

          // Extract title from resume
          const titleMatch = extractedText.match(/(?:current\s+position|title|role)[\s:]*([^\n]+)/i);
          if (titleMatch && titleMatch[1]) {
            profileData.currentTitle = titleMatch[1].trim().substring(0, 100);
          }
        }

        apiLogger.info('Resume processed successfully', { 
          userId, 
          resumeUrl, 
          textLength: extractedText.length,
          skillsCount: profileData.skills.length
        });
      } catch (error) {
        apiLogger.error('Resume processing failed', { userId, error: String(error) });
      }
    }

    // Process video if provided
    let videoUrl = '';
    if (data.videoBlob) {
      try {
        const videoBuffer = Buffer.from(data.videoBlob, 'base64');
        const videoBlob = new Blob([videoBuffer], { type: 'video/webm' });
        const uniqueFileName = `${uuidv4()}.webm`;
        
        const videoFile = new File([videoBlob], uniqueFileName, { type: 'video/webm' });
        
        const uploadResult = await fileUploadService.uploadFile(videoFile, 'video', {
          path: `candidates/${userId}/video-intro/${uniqueFileName}`,
          maxSize: 10 * 1024 * 1024
        });
        
        videoUrl = uploadResult.url;
        profileData.videoIntroUrl = videoUrl;

        apiLogger.info('Video uploaded successfully', { userId, videoUrl });
      } catch (error) {
        apiLogger.error('Video upload failed', { userId, error: String(error) });
      }
    }

    // Mark profile as complete if we have essential data
    profileData.profileComplete = !!(profileData.summary && profileData.skills.length > 0);

    // Create candidate profile
    try {
      await admin.firestore().collection('candidateProfiles').doc(userId).set(profileData);
      apiLogger.info('Candidate profile created', { userId, profileComplete: profileData.profileComplete });
    } catch (error) {
      apiLogger.error('Failed to create candidate profile', { userId, error: String(error) });
      throw error;
    }

    // Generate embeddings for vector search
    if (extractedText.length > 50) {
      try {
        const embedding = await textEmbeddingService.generateDocumentEmbedding(extractedText);
        
        await embeddingDatabaseService.saveCandidateWithEmbedding(userId, {
          fullName: `${data.firstName} ${data.lastName}`,
          email: userEmail || '',
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
      }
    }

    apiLogger.info('Candidate registration completed successfully', { 
      userId,
      email: userEmail,
      profileComplete: profileData.profileComplete,
      hasResume: !!resumeUrl,
      hasVideo: !!videoUrl
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
        ? 'Registration completed successfully with AI-enhanced profile!' 
        : 'Registration completed. Profile created with basic information.'
    });

  } catch (error) {
    apiLogger.error('Candidate registration failed', { 
      error: String(error)
    });
    return handleApiError(error);
  }
});
