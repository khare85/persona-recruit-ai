
import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database.service';
import { z } from 'zod';

// Candidate schema for validation
const candidateSchema = z.object({
  fullName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  currentTitle: z.string().min(1).max(200),
  location: z.string().min(1).max(100),
  experience: z.string(),
  skills: z.array(z.string()),
  summary: z.string().min(50).max(2000),
  resumeUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  linkedinProfile: z.string().url().optional(),
  availability: z.string(),
  salaryExpectation: z.string().optional(),
  isOpenToRemote: z.boolean().default(false)
});

// GET /api/candidates - List all candidates with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    // In a real app, you'd have more sophisticated filtering here
    const { items: candidates, total } = await databaseService.listUsers({
      role: 'candidate',
      limit,
      offset: (page - 1) * limit,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        candidates,
        total,
      }
    });
    
  } catch (error) {
    console.error('GET /api/candidates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

// POST /api/candidates - Create a new candidate profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = candidateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid candidate data', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }
    
    // This endpoint should ideally not be used for creation,
    // candidate registration handles this. This is a placeholder.
    console.log('Creating candidate:', validation.data);
    
    return NextResponse.json({
      success: true,
      data: { id: `cand_${Date.now()}`, ...validation.data }
    }, { status: 201 });
    
  } catch (error) {
    console.error('POST /api/candidates error:', error);
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}
