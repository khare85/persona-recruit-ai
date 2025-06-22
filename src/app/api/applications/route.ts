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
  },
  {
    id: 'APP-002',
    candidateId: '2', 
    candidateName: 'Marcus Chen',
    candidateEmail: 'marcus.chen@email.com',
    jobId: '2',
    jobTitle: 'DevOps Engineer',
    companyId: '1',
    companyName: 'TechCorp Inc.',
    status: 'interview_scheduled',
    appliedAt: '2024-06-19T15:00:00Z',
    lastUpdated: '2024-06-22T09:00:00Z',
    resumeUrl: '/api/files/resume_2',
    coverLetter: 'My experience in cloud infrastructure...',
    aiScore: 92,
    aiAnalysis: {
      skillsMatch: 95,
      experienceMatch: 90,
      culturalFit: 91,
      overallScore: 92,
      strengths: ['Kubernetes expertise', 'CI/CD experience', 'Strong problem solving'],
      concerns: ['None significant']
    },
    timeline: [
      { date: '2024-06-19T15:00:00Z', event: 'Application submitted', status: 'applied' },
      { date: '2024-06-20T11:00:00Z', event: 'Application reviewed', status: 'under_review' },
      { date: '2024-06-22T09:00:00Z', event: 'Interview scheduled', status: 'interview_scheduled' }
    ],
    interviewScheduled: true,
    interviewDate: '2024-06-25T14:00:00Z',
    feedback: []
  }
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const candidateId = searchParams.get('candidateId');
    const jobId = searchParams.get('jobId');
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Filter applications
    let filteredApplications = applications.filter(app => {
      if (candidateId && app.candidateId !== candidateId) return false;
      if (jobId && app.jobId !== jobId) return false;
      if (companyId && app.companyId !== companyId) return false;
      if (status && app.status !== status) return false;
      return true;
    });

    // Sort by most recent
    filteredApplications.sort((a, b) => 
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedApplications = filteredApplications.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedApplications,
      pagination: {
        page,
        limit,
        total: filteredApplications.length,
        totalPages: Math.ceil(filteredApplications.length / limit),
        hasNext: endIndex < filteredApplications.length,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { candidateId, jobId, coverLetter, resumeFileId } = body;

    // Validate required fields
    if (!candidateId || !jobId) {
      return NextResponse.json(
        { error: 'Candidate ID and Job ID are required' },
        { status: 400 }
      );
    }

    // Check if candidate already applied for this job
    const existingApplication = applications.find(
      app => app.candidateId === candidateId && app.jobId === jobId
    );

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 409 }
      );
    }

    // Create new application
    const newApplication = {
      id: `APP-${String(applications.length + 1).padStart(3, '0')}`,
      candidateId,
      candidateName: 'Demo Candidate', // In production, fetch from user data
      candidateEmail: 'demo@example.com',
      jobId,
      jobTitle: 'Demo Job Title', // In production, fetch from job data
      companyId: '1', // In production, get from job data
      companyName: 'Demo Company',
      status: 'applied',
      appliedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      resumeUrl: resumeFileId ? `/api/files/${resumeFileId}` : null,
      coverLetter: coverLetter || '',
      aiScore: null, // Will be calculated by AI service
      aiAnalysis: null,
      timeline: [
        {
          date: new Date().toISOString(),
          event: 'Application submitted',
          status: 'applied'
        }
      ],
      interviewScheduled: false,
      feedback: []
    };

    // Save to database (in production)
    applications.push(newApplication);

    // Trigger AI analysis (in production, queue this as a background job)
    setTimeout(() => {
      // Simulate AI analysis
      const analysisResult = {
        skillsMatch: Math.floor(Math.random() * 30) + 70,
        experienceMatch: Math.floor(Math.random() * 30) + 70,
        culturalFit: Math.floor(Math.random() * 30) + 70
      };
      analysisResult.overallScore = Math.round(
        (analysisResult.skillsMatch + analysisResult.experienceMatch + analysisResult.culturalFit) / 3
      );

      newApplication.aiScore = analysisResult.overallScore;
      newApplication.aiAnalysis = {
        ...analysisResult,
        strengths: ['Strong technical background', 'Good communication skills'],
        concerns: ['Limited experience in some areas']
      };
    }, 1000);

    return NextResponse.json({
      message: 'Application submitted successfully',
      application: newApplication
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}