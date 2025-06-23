import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withRole } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  currentTitle: z.string().min(1, 'Current title is required'),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  availability: z.enum(['immediate', 'within_2_weeks', 'within_month', 'flexible']).optional()
});

/**
 * GET /api/candidates/profile - Get current candidate's profile
 */
export const GET = withRateLimit('profile',
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;

        apiLogger.info('Fetching candidate profile', { userId });

        // Get user basic info
        const user = await databaseService.getUserById(userId);
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Get candidate profile
        const candidateProfile = await databaseService.getCandidateProfile(userId);
        if (!candidateProfile) {
          return NextResponse.json(
            { error: 'Candidate profile not found' },
            { status: 404 }
          );
        }

        // Combine user and profile data
        const profile = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: candidateProfile.phone,
          currentTitle: candidateProfile.currentTitle,
          summary: candidateProfile.summary,
          skills: candidateProfile.skills || [],
          linkedinUrl: candidateProfile.linkedinUrl,
          portfolioUrl: candidateProfile.portfolioUrl,
          location: candidateProfile.location,
          availability: candidateProfile.availability,
          resumeUrl: candidateProfile.resumeUrl,
          videoIntroUrl: candidateProfile.videoIntroUrl,
          profileComplete: candidateProfile.profileComplete
        };

        return NextResponse.json({
          success: true,
          profile
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);

/**
 * PUT /api/candidates/profile - Update candidate profile
 */
export const PUT = withRateLimit('profile',
  withAuth(
    withRole(['candidate'], async (req: NextRequest): Promise<NextResponse> => {
      try {
        const userId = req.user!.id;
        const body = await req.json();

        const validation = updateProfileSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            {
              error: 'Invalid profile data',
              details: validation.error.errors
            },
            { status: 400 }
          );
        }

        const profileData = validation.data;

        apiLogger.info('Updating candidate profile', { 
          userId,
          fieldsUpdated: Object.keys(profileData)
        });

        // Update user basic info
        await databaseService.updateUser(userId, {
          firstName: profileData.firstName,
          lastName: profileData.lastName
        } as any);

        // Update candidate profile
        await databaseService.updateCandidateProfile(userId, {
          phone: profileData.phone,
          currentTitle: profileData.currentTitle,
          summary: profileData.summary,
          skills: profileData.skills,
          linkedinUrl: profileData.linkedinUrl || undefined,
          portfolioUrl: profileData.portfolioUrl || undefined,
          location: profileData.location,
          availability: profileData.availability,
          profileComplete: true // Mark as complete since they're updating
        });

        apiLogger.info('Candidate profile updated successfully', { userId });

        return NextResponse.json({
          success: true,
          message: 'Profile updated successfully'
        });

      } catch (error) {
        return handleApiError(error);
      }
    })
  )
);