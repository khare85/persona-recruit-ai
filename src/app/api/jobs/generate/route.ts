import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { aiWorkerPool } from '@/workers/AIWorkerPool';
import { withAuth } from '@/lib/auth/middleware';

// Validation schema for job generation request
const jobGenerationSchema = z.object({
  jobTitle: z.string().min(2).max(200),
  yearsOfExperience: z.string().min(1).max(50),
  company: z.string().min(1, "Company name is required"),
  department: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  jobType: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote']).optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  includeSkills: z.boolean().default(true),
  includeRequirements: z.boolean().default(true)
});

/**
 * Generate job description using AI
 */
async function handlePOST(req: NextRequest): Promise<NextResponse> {
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

    const { 
      jobTitle, 
      yearsOfExperience, 
      company, 
      department, 
      location, 
      jobType, 
      priority,
      includeSkills,
      includeRequirements 
    } = validation.data;

    // For high priority requests, process immediately
    if (priority === 'high') {
      const jobData = {
        title: jobTitle,
        company,
        experienceLevel: yearsOfExperience,
        department,
        location,
        type: jobType || 'Full-time'
      };

      // Generate job description using AI orchestrator
      const generatedJob = await aiOrchestrator.generateJobDescription(jobData);
      
      let skills = [];
      let requirements = [];

      if (includeSkills) {
        skills = await aiOrchestrator.generateJobSkills(jobData);
      }

      if (includeRequirements) {
        requirements = await aiOrchestrator.generateJobRequirements(jobData);
      }

      return NextResponse.json({
        success: true,
        data: {
          ...generatedJob,
          skills,
          requirements
        },
        message: 'Job description generated successfully',
        processedAt: new Date().toISOString()
      });
    }

    // For medium/low priority, queue for background processing
    const job = await aiWorkerPool.addJob({
      id: `job-gen-${Date.now()}`,
      type: 'job-generation',
      priority,
      data: {
        jobTitle,
        yearsOfExperience,
        company,
        department,
        location,
        jobType,
        includeSkills,
        includeRequirements
      }
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'Job generation queued for processing'
    });

  } catch (error) {
    console.error('Job generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate job description',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate skills only for a job title
 */
async function handleGET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const jobTitle = searchParams.get('jobTitle');
    const yearsOfExperience = searchParams.get('yearsOfExperience');
    const department = searchParams.get('department');
    const company = searchParams.get('company');

    if (!jobTitle || !yearsOfExperience) {
      return NextResponse.json(
        { error: 'jobTitle and yearsOfExperience are required' },
        { status: 400 }
      );
    }
    
    // Generate AI-powered skills using optimized orchestrator
    const jobData = {
      title: jobTitle,
      experienceLevel: yearsOfExperience,
      department,
      company: company || 'Tech Company'
    };

    const skills = await aiOrchestrator.generateJobSkills(jobData);

    return NextResponse.json({
      success: true,
      data: { skills },
      message: 'Skills generated successfully using AI',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Skills generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate skills',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get job generation status
 */
async function handlePUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    const jobStatus = await aiWorkerPool.getJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: jobStatus
    });

  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Apply authentication middleware and export
export const POST = withAuth(handlePOST);
export const GET = withAuth(handleGET);
export const PUT = withAuth(handlePUT);
