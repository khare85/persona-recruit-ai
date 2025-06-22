import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { jobGenerationService } from '@/services/jobGenerationService';
import { withRateLimit } from '@/middleware/security';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

// Validation schema for job generation request
const jobGenerationSchema = z.object({
  jobTitle: z.string().min(2).max(200),
  yearsOfExperience: z.string().min(1).max(50),
  company: z.string().max(200).optional(),
  department: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  jobType: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote']).optional()
});

/**
 * Generate job description using AI
 */
export const POST = withRateLimit('ai', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const validation = jobGenerationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const input = validation.data;

    apiLogger.info('Job generation requested', {
      jobTitle: input.jobTitle,
      experience: input.yearsOfExperience
    });

    // Generate job description using AI
    const generatedJob = await jobGenerationService.generateJobDescription(input);

    return NextResponse.json({
      success: true,
      data: generatedJob,
      message: 'Job description generated successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * Generate skills only for a job title
 */
export const GET = withRateLimit('ai', async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const jobTitle = searchParams.get('jobTitle');
    const yearsOfExperience = searchParams.get('yearsOfExperience');

    if (!jobTitle || !yearsOfExperience) {
      return NextResponse.json(
        { error: 'jobTitle and yearsOfExperience are required' },
        { status: 400 }
      );
    }

    const skills = await jobGenerationService.generateSkillsOnly(jobTitle, yearsOfExperience);

    return NextResponse.json({
      success: true,
      data: { skills },
      message: 'Skills generated successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});