import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/firestoreService';
import { getMockJobs } from '@/services/mockDataService';
import { z } from 'zod';

// Job schema for validation
const jobSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().min(1).max(100),
  location: z.string().min(1).max(100),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote']),
  department: z.string().min(1).max(50),
  experience: z.string(),
  salary: z.string(),
  description: z.string().min(50).max(5000),
  requirements: z.array(z.string()),
  benefits: z.array(z.string()).optional(),
  status: z.enum(['Active', 'Closed', 'Draft']).default('Active'),
  postedDate: z.string().optional(),
  applicants: z.number().optional()
});

// GET /api/jobs - List all jobs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // For now, return mock data
    // TODO: Replace with Firestore query when jobs are stored there
    let jobs = getMockJobs();
    
    // Apply filters
    if (company) {
      jobs = jobs.filter(job => job.company.toLowerCase() === company.toLowerCase());
    }
    if (department) {
      jobs = jobs.filter(job => job.department.toLowerCase() === department.toLowerCase());
    }
    if (status) {
      jobs = jobs.filter(job => job.status === status);
    }
    
    // Limit results
    jobs = jobs.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: {
        jobs,
        total: jobs.length
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
export async function POST(request: NextRequest) {
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
    
    const jobData = {
      ...validation.data,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postedDate: new Date().toISOString(),
      applicants: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // TODO: Save to Firestore
    // For now, just return the created job
    console.log('Creating job:', jobData);
    
    return NextResponse.json({
      success: true,
      data: jobData
    }, { status: 201 });
    
  } catch (error) {
    console.error('POST /api/jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}