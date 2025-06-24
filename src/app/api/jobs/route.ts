
import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database.service';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';

// Job schema for validation
const jobSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(100).optional(),
  location: z.string().min(1).max(100),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote']),
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
  urgency: z.enum(['Low', 'Medium', 'High']).optional(),
  status: z.enum(['Active', 'Closed', 'Draft']).default('Active'),
  postedDate: z.string().optional(),
  applicants: z.number().optional()
});

// GET /api/jobs - List all jobs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const { items: jobs, total } = await databaseService.listJobs({
      companyId: companyId || undefined,
      status: status || undefined,
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
  withRole(['recruiter', 'company_admin'], async (request: NextRequest): Promise<NextResponse> => {
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
      
      const user = (request as any).user;
      if (!user.companyId) {
        return NextResponse.json(
          { error: 'User must be associated with a company to post jobs' },
          { status: 400 }
        );
      }

      const jobData = {
        ...validation.data,
        recruiterId: user.id,
        companyId: user.companyId,
        postedDate: new Date().toISOString(),
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
