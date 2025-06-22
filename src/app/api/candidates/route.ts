import { NextRequest, NextResponse } from 'next/server';
import { getMockCandidates } from '@/services/mockDataService';
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
    const skills = searchParams.get('skills')?.split(',') || [];
    const location = searchParams.get('location');
    const experience = searchParams.get('experience');
    const availability = searchParams.get('availability');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // For now, return mock data
    // TODO: Replace with Firestore query when candidates are stored there
    let candidates = getMockCandidates();
    
    // Apply filters
    if (skills.length > 0) {
      candidates = candidates.filter(candidate => 
        skills.some(skill => 
          candidate.skills.some(candidateSkill => 
            candidateSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }
    
    if (location) {
      candidates = candidates.filter(candidate => 
        candidate.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (experience) {
      candidates = candidates.filter(candidate => 
        candidate.experience.toLowerCase().includes(experience.toLowerCase())
      );
    }
    
    if (availability) {
      candidates = candidates.filter(candidate => 
        candidate.availability.toLowerCase().includes(availability.toLowerCase())
      );
    }
    
    // Limit results
    candidates = candidates.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: {
        candidates,
        total: candidates.length
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
    
    const candidateData = {
      ...validation.data,
      id: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Active',
      applications: []
    };
    
    // TODO: Save to Firestore with embeddings
    // For now, just return the created candidate
    console.log('Creating candidate:', candidateData);
    
    return NextResponse.json({
      success: true,
      data: candidateData
    }, { status: 201 });
    
  } catch (error) {
    console.error('POST /api/candidates error:', error);
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}