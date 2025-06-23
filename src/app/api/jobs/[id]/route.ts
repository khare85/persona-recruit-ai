import { NextRequest, NextResponse } from 'next/server';
import { getMockJobs } from '@/services/mockDataService';
import { z } from 'zod';

// Job update schema
const jobUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(100).optional(),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote']).optional(),
  department: z.string().min(1).max(50).optional(),
  experience: z.string().optional(),
  salary: z.string().optional(),
  description: z.string().min(50).max(5000).optional(),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  status: z.enum(['Active', 'Closed', 'Draft']).optional()
});

// GET /api/jobs/[id] - Get a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // For now, find in mock data
    // TODO: Replace with Firestore query
    const jobs = getMockJobs();
    const job = jobs.find(j => j.id === id);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: job
    });
    
  } catch (error) {
    console.error('GET /api/jobs/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[id] - Update a job
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const validation = jobUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid update data', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }
    
    // For now, find in mock data
    // TODO: Replace with Firestore update
    const jobs = getMockJobs();
    const jobIndex = jobs.findIndex(j => j.id === id);
    
    if (jobIndex === -1) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    const updatedJob = {
      ...jobs[jobIndex],
      ...validation.data,
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updating job:', updatedJob);
    
    return NextResponse.json({
      success: true,
      data: updatedJob
    });
    
  } catch (error) {
    console.error('PUT /api/jobs/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // For now, just log
    // TODO: Implement Firestore deletion
    console.log('Deleting job:', id);
    
    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    });
    
  } catch (error) {
    console.error('DELETE /api/jobs/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}