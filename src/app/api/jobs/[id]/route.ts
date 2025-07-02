
import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database.service';
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
    
    const job = await databaseService.getJobById(id);
    
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
    
    await databaseService.updateJob(id, validation.data);
    const updatedJob = await databaseService.getJobById(id);
    
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
    
    await databaseService.deleteJob(id); // Assuming soft delete
    
    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    });
    
  } catch (error) {
    console.error('DELETE /api/jobs/[id] error:', error);
    return NextResponse.json(
      