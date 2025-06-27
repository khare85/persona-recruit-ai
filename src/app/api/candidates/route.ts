
import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database.service';
import { z } from 'zod';
import { CandidateProfile, User } from '@/models/user.model';

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
    
    const { items: users, total } = await databaseService.listUsers({
      role: 'candidate',
      limit,
      offset: (page - 1) * limit,
    });
    
    const candidatesWithProfiles = await Promise.all(
      users.map(async (user: User) => {
        const profile: CandidateProfile | null = await databaseService.getCandidateProfile(user.id);
        
        const experienceMap: { [key: string]: number } = {
          'Entry Level': 1,
          '1-2 years': 2,
          '3-5 years': 4,
          '5-10 years': 7,
          '10+ years': 10,
        };
        
        return {
          id: user.id,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: profile?.phone || '',
          currentTitle: profile?.currentTitle || 'N/A',
          experience: profile?.experience ? experienceMap[profile.experience] || 0 : 0,
          location: profile?.location || 'N/A',
          skills: profile?.skills || [], // Ensure skills is always an array
          education: 'N/A', // This data is not in the current user/profile model
          previousCompanies: [], // This data is not in the current user/profile model
          profilePictureUrl: `https://placehold.co/150x150.png?text=${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`,
          availability: profile?.availability || 'Not Specified',
          expectedSalary: profile?.expectedSalary ? `$${profile.expectedSalary.min} - $${profile.expectedSalary.max}` : 'Not Specified',
          summary: profile?.summary || '',
          certifications: [], // This data is not in the current user/profile model
          languages: [], // This data is not in the current user/profile model
          aiMatchScore: Math.floor(Math.random() * 20) + 75, // Mock score
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: {
        candidates: candidatesWithProfiles,
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
