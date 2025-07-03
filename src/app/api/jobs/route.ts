
import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database.service';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { AuthenticatedRequest } from '@/middleware/auth';

// Job schema for validation
const jobSchema = z.object({
  title: z.string().min(1).max(200),
  location: z.string().min(1).max(100),
  type: z.enum(['full-time', 'part-time', 'contract', 'remote', 'internship']),
  department: z.string().min(1).max(50),
  experience: z.string(),
  salary: z.string().optional(),
  description: z.string().min(50).max(5000),
  requirements: z.array(z.string()),
  mustHaveRequirements: z.array(z.string()),
  benefits: z.array(z.string()),
  skills: z.array(z.string()),
  responsibilities: z.array(z.string()).optional(),
  isRemote: z.boolean().optional(),
  urgency: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['active', 'closed', 'draft']).default('active'),
});

// GET /api/jobs - List all jobs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status') || 'active'; // Default to active jobs for public view
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const { items: jobs, total } = await databaseService.listJobs({
      companyId: companyId || undefined,
      status: status,
      limit,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        jobs,
        total,
      }
    });
    
  } catch (error) {
    console.error('GET /api/jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export const POST = withAuth(
  withRole(['recruiter', 'company_admin'], async (request: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const validation = jobSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          { 
            error: 'Invalid job data', 
            details: validation.error.errors 
          },
          { status: 400 }
        );
      }
      
      const user = request.user;
      if (!user?.companyId) {
        return NextResponse.json(
          { error: 'User must be associated with a company to post jobs' },
          { status: 400 }
        );
      }

      const jobData = {
        ...validation.data,
        qualifications: validation.data.requirements, // Map requirements to qualifications
        responsibilities: validation.data.responsibilities || [], // Ensure array
        recruiterId: user.id,
        companyId: user.companyId,
        postedDate: new Date().toISOString(),
        quickApplyEnabled: true, // Default to enabled
        locationType: (validation.data.type === 'remote' || validation.data.isRemote) ? 'remote' as const : 'onsite' as const, // Set locationType
        // Handle salary field - if it's a string, convert to object or leave undefined
        salary: validation.data.salary ? {
          min: 0,
          max: 0,
          currency: 'USD',
          period: 'yearly' as const
        } : undefined,
        stats: {
          views: 0,
          applications: 0,
          interviews: 0,
          offers: 0
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const newJobId = await databaseService.createJob(jobData);
      const newJob = await databaseService.getJobById(newJobId);
      
      return NextResponse.json({
        success: true,
        data: newJob
      }, { status: 201 });
      
    } catch (error) {
      return handleApiError(error);
    }
  })
);
