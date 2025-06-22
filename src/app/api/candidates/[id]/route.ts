import { NextRequest, NextResponse } from 'next/server';
import { getMockCandidates } from '@/services/mockDataService';
import { z } from 'zod';

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

// Mock candidates database
let candidates = getMockCandidates();

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const candidate = candidates.find(c => c.id === id);
    
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // In production, also fetch:
    // - Applications history
    // - Interview history
    // - AI scores and analysis
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
    
    const candidateIndex = candidates.findIndex(c => c.id === id);
    
    if (candidateIndex === -1) {
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

    // Update candidate
    const updatedCandidate = {
      ...candidates[candidateIndex],
      ...validation.data,
      updatedAt: new Date().toISOString()
    };

    candidates[candidateIndex] = updatedCandidate;

    // In production, save to database and regenerate embeddings if needed
    console.log('Updated candidate:', updatedCandidate);

    return NextResponse.json({
      success: true,
      data: updatedCandidate,
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
    
    const candidateIndex = candidates.findIndex(c => c.id === id);
    
    if (candidateIndex === -1) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // In production, soft delete or check for active applications first
    const deletedCandidate = candidates.splice(candidateIndex, 1)[0];

    // In production:
    // - Check for active applications
    // - Notify relevant parties
    // - Archive related data
    console.log('Deleted candidate:', deletedCandidate);

    return NextResponse.json({
      success: true,
      message: 'Candidate deleted successfully',
      data: { id: deletedCandidate.id, name: deletedCandidate.fullName }
    });

  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json(
      { error: 'Failed to delete candidate' },
      { status: 500 }
    );
  }
}