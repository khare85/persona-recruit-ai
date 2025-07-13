import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database.service';
import { z } from 'zod';
import { CandidateProfile, User } from '@/models/user.model';

// Candidate update schema
const candidateUpdateSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  currentTitle: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(100).optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  summary: z.string().min(50).max(2000).optional(),
  resumeUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  linkedinProfile: z.string().url().optional(),
  availability: z.string().optional(),
  salaryExpectation: z.string().optional(),
  isOpenToRemote: z.boolean().optional(),
  status: z.enum(['Active', 'Inactive', 'Hired', 'Not Looking']).optional()
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const user = await databaseService.getUserById(id);
    if (!user || user.role !== 'candidate') {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    const profile: CandidateProfile | null = await databaseService.getCandidateProfile(id);
    
    const experienceMap: { [key: string]: number } = {
      'Entry Level': 1,
      '1-2 years': 2,
      '3-5 years': 4,
      '5-10 years': 7,
      '10+ years': 10,
    };

    const candidate = {
      id: user.id,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: profile?.phone || '',
      currentTitle: profile?.currentTitle || 'N/A',
      experience: profile?.experience ? experienceMap[profile.experience] || 0 : 0,
      location: profile?.location || 'N/A',
      skills: profile?.skills || [],
      education: 'N/A',
      previousCompanies: [],
      profilePictureUrl: `https://placehold.co/150x150.png?text=${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`,
      availability: profile?.availability || 'Not Specified',
      expectedSalary: profile?.expectedSalary ? `$${profile.expectedSalary.min} - $${profile.expectedSalary.max}` : 'Not Specified',
      summary: profile?.summary || '',
      certifications: [],
      languages: [],
      aiMatchScore: Math.floor(Math.random() * 20) + 75,
    };

    // Mock additional data for now
    const candidateWithDetails = {
      ...candidate,
      applications: [
        {
          id: 'APP-001',
          jobId: '1',
          jobTitle: 'Senior Frontend Developer',
          companyName: 'TechCorp Inc.',
          status: 'under_review',
          appliedAt: '2024-06-20T10:00:00Z',
          aiScore: 87
        }
      ],
      interviews: [
        {
          id: 'IV-001',
          jobTitle: 'Senior Frontend Developer',
          interviewerName: 'Alex Rodriguez',
          scheduledDate: '2024-06-25T14:00:00Z',
          type: 'technical',
          status: 'scheduled'
        }
      ],
      aiAnalysis: {
        overallScore: 87,
        skillsAssessment: {
          technical: 92,
          communication: 85,
          leadership: 78
        },
        strengthAreas: ['React', 'TypeScript', 'System Design'],
        improvementAreas: ['Backend Development', 'DevOps']
      }
    };

    return NextResponse.json({
      success: true,
      data: candidateWithDetails
    });

  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidate' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const user = await databaseService.getUserById(id);
    if (!user || user.role !== 'candidate') {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Validate update data
    const validation = candidateUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid candidate data', 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    // Update user and profile data
    const profileData = validation.data;
    await databaseService.updateCandidateProfile(id, profileData);

    // Get updated profile
    const updatedProfile = await databaseService.getCandidateProfile(id);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        ...updatedProfile,
        updatedAt: new Date().toISOString()
      },
      message: 'Candidate updated successfully'
    });

  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json(
      { error: 'Failed to update candidate' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const user = await databaseService.getUserById(id);
    if (!user || user.role !== 'candidate') {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // In production, soft delete or check for active applications first
    // For now, we'll just deactivate the user
    await databaseService.updateUser(id, { status: 'inactive' });

    return NextResponse.json({
      success: true,
      message: 'Candidate deactivated successfully',
      data: { id: user.id, name: `${user.firstName} ${user.lastName}` }
    });

  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json(
      { error: 'Failed to delete candidate' },
      { status: 500 }
    );
  }
}