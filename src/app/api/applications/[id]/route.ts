import { NextRequest, NextResponse } from 'next/server';

// Mock applications database
const applications = [
  {
    id: 'APP-001',
    candidateId: '1',
    candidateName: 'Sarah Johnson',
    candidateEmail: 'sarah.johnson@email.com',
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    companyId: '1',
    companyName: 'TechCorp Inc.',
    status: 'under_review',
    appliedAt: '2024-06-20T10:00:00Z',
    lastUpdated: '2024-06-21T14:30:00Z',
    resumeUrl: '/api/files/resume_1',
    coverLetter: 'I am excited to apply for this position...',
    aiScore: 87,
    aiAnalysis: {
      skillsMatch: 92,
      experienceMatch: 85,
      culturalFit: 88,
      overallScore: 87,
      strengths: ['React expertise', 'Strong portfolio', 'Team leadership'],
      concerns: ['Limited backend experience']
    },
    timeline: [
      { date: '2024-06-20T10:00:00Z', event: 'Application submitted', status: 'applied' },
      { date: '2024-06-21T14:30:00Z', event: 'Application under review', status: 'under_review' }
    ],
    interviewScheduled: false,
    feedback: []
  }
];

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const application = applications.find(app => app.id === id);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(application);

  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const applicationIndex = applications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const { status, notes, feedback } = body;

    // Update application
    const updatedApplication = {
      ...applications[applicationIndex],
      lastUpdated: new Date().toISOString()
    };

    // Handle status update
    if (status && status !== applications[applicationIndex].status) {
      updatedApplication.status = status;
      updatedApplication.timeline.push({
        date: new Date().toISOString(),
        event: getStatusEventText(status),
        status: status
      });
    }

    // Handle feedback
    if (feedback) {
      updatedApplication.feedback.push({
        id: `FB-${Date.now()}`,
        feedback: feedback,
        submittedAt: new Date().toISOString(),
        submittedBy: 'recruiter' // In production, get from auth context
      });
    }

    // Handle notes
    if (notes) {
      updatedApplication.notes = notes;
    }

    applications[applicationIndex] = updatedApplication;

    return NextResponse.json({
      message: 'Application updated successfully',
      application: updatedApplication
    });

  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const applicationIndex = applications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const deletedApplication = applications.splice(applicationIndex, 1)[0];

    return NextResponse.json({
      message: 'Application deleted successfully',
      application: deletedApplication
    });

  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}

function getStatusEventText(status: string): string {
  const statusEvents = {
    'applied': 'Application submitted',
    'under_review': 'Application under review',
    'ai_screening': 'AI screening in progress',
    'screening_passed': 'Screening passed',
    'interview_scheduled': 'Interview scheduled',
    'interviewed': 'Interview completed',
    'offer_extended': 'Offer extended',
    'hired': 'Candidate hired',
    'rejected': 'Application rejected',
    'withdrawn': 'Application withdrawn'
  };
  
  return statusEvents[status as keyof typeof statusEvents] || 'Status updated';
}