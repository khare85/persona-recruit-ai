import { NextRequest, NextResponse } from 'next/server';

// Mock interviews database
const interviews = [
  {
    id: 'IV-001',
    applicationId: 'APP-001',
    candidateId: '1',
    candidateName: 'Sarah Johnson',
    candidateEmail: 'sarah.johnson@email.com',
    candidateAvatar: '/avatars/sarah.jpg',
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    companyId: '1',
    companyName: 'TechCorp Inc.',
    interviewerId: 'INT-001',
    interviewerName: 'Alex Rodriguez',
    interviewerEmail: 'alex.rodriguez@techcorp.com',
    scheduledDate: '2024-06-25T14:00:00Z',
    duration: 60,
    type: 'technical',
    format: 'in-person',
    location: 'Conference Room A, Floor 3',
    status: 'scheduled',
    meetingLink: null,
    notes: 'Focus on React expertise and system design',
    preparation: [
      'Review candidate resume',
      'Prepare technical questions',
      'Set up coding environment'
    ],
    aiInterviewData: {
      completed: true,
      score: 87,
      videoUrl: '/api/interview/video/1',
      transcript: 'Interview transcript...',
      analysis: 'Strong technical skills...'
    },
    feedback: null,
    recording: null,
    createdAt: '2024-06-22T10:00:00Z',
    updatedAt: '2024-06-22T10:00:00Z',
    createdBy: 'recruiter@techcorp.com'
  },
  {
    id: 'IV-002',
    applicationId: 'APP-002',
    candidateId: '2',
    candidateName: 'Marcus Chen',
    candidateEmail: 'marcus.chen@email.com',
    candidateAvatar: '/avatars/marcus.jpg',
    jobId: '2',
    jobTitle: 'DevOps Engineer',
    companyId: '1',
    companyName: 'TechCorp Inc.',
    interviewerId: 'INT-002',
    interviewerName: 'Maria Garcia',
    interviewerEmail: 'maria.garcia@techcorp.com',
    scheduledDate: '2024-06-26T16:30:00Z',
    duration: 45,
    type: 'behavioral',
    format: 'virtual',
    location: 'Zoom Meeting',
    status: 'scheduled',
    meetingLink: 'https://zoom.us/j/123456789',
    notes: 'Assess leadership and team collaboration skills',
    preparation: [
      'Review AI interview results',
      'Prepare behavioral questions',
      'Check Zoom setup'
    ],
    aiInterviewData: {
      completed: true,
      score: 92,
      videoUrl: '/api/interview/video/2',
      transcript: 'Excellent responses...',
      analysis: 'Strong communication skills...'
    },
    feedback: null,
    recording: null,
    createdAt: '2024-06-22T11:00:00Z',
    updatedAt: '2024-06-22T11:00:00Z',
    createdBy: 'recruiter@techcorp.com'
  }
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const candidateId = searchParams.get('candidateId');
    const interviewerId = searchParams.get('interviewerId');
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Filter interviews
    let filteredInterviews = interviews.filter(interview => {
      if (candidateId && interview.candidateId !== candidateId) return false;
      if (interviewerId && interview.interviewerId !== interviewerId) return false;
      if (jobId && interview.jobId !== jobId) return false;
      if (status && interview.status !== status) return false;
      
      if (dateFrom) {
        const interviewDate = new Date(interview.scheduledDate);
        const fromDate = new Date(dateFrom);
        if (interviewDate < fromDate) return false;
      }
      
      if (dateTo) {
        const interviewDate = new Date(interview.scheduledDate);
        const toDate = new Date(dateTo);
        if (interviewDate > toDate) return false;
      }
      
      return true;
    });

    // Sort by scheduled date
    filteredInterviews.sort((a, b) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInterviews = filteredInterviews.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedInterviews,
      pagination: {
        page,
        limit,
        total: filteredInterviews.length,
        totalPages: Math.ceil(filteredInterviews.length / limit),
        hasNext: endIndex < filteredInterviews.length,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      applicationId,
      candidateId,
      jobId,
      interviewerId,
      scheduledDate,
      duration,
      type,
      format,
      location,
      meetingLink,
      notes,
      preparation
    } = body;

    // Validate required fields
    if (!candidateId || !jobId || !interviewerId || !scheduledDate) {
      return NextResponse.json(
        { error: 'Candidate ID, Job ID, Interviewer ID, and scheduled date are required' },
        { status: 400 }
      );
    }

    // Validate interview date is in the future
    if (new Date(scheduledDate) <= new Date()) {
      return NextResponse.json(
        { error: 'Interview must be scheduled for a future date' },
        { status: 400 }
      );
    }

    // Check for interviewer availability (simplified check)
    const conflictingInterview = interviews.find(interview => {
      const existingStart = new Date(interview.scheduledDate);
      const existingEnd = new Date(existingStart.getTime() + interview.duration * 60000);
      const newStart = new Date(scheduledDate);
      const newEnd = new Date(newStart.getTime() + (duration || 60) * 60000);
      
      return interview.interviewerId === interviewerId &&
             interview.status === 'scheduled' &&
             ((newStart >= existingStart && newStart < existingEnd) ||
              (newEnd > existingStart && newEnd <= existingEnd));
    });

    if (conflictingInterview) {
      return NextResponse.json(
        { error: 'Interviewer is not available at the selected time' },
        { status: 409 }
      );
    }

    // Create new interview
    const newInterview = {
      id: `IV-${String(interviews.length + 1).padStart(3, '0')}`,
      applicationId: applicationId || null,
      candidateId,
      candidateName: 'Demo Candidate', // In production, fetch from candidate data
      candidateEmail: 'demo@example.com',
      candidateAvatar: '/avatars/default.jpg',
      jobId,
      jobTitle: 'Demo Job', // In production, fetch from job data
      companyId: '1', // In production, get from job data
      companyName: 'Demo Company',
      interviewerId,
      interviewerName: 'Demo Interviewer', // In production, fetch from interviewer data
      interviewerEmail: 'interviewer@demo.com',
      scheduledDate,
      duration: duration || 60,
      type: type || 'technical',
      format: format || 'in-person',
      location: location || '',
      status: 'scheduled',
      meetingLink: meetingLink || null,
      notes: notes || '',
      preparation: preparation || [],
      aiInterviewData: {
        completed: false,
        score: null,
        videoUrl: null,
        transcript: null,
        analysis: null
      },
      feedback: null,
      recording: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'demo@example.com' // In production, get from auth context
    };

    // Save to database
    interviews.push(newInterview);

    // In production, send notifications to candidate and interviewer
    console.log('Interview scheduled:', newInterview);

    return NextResponse.json({
      message: 'Interview scheduled successfully',
      interview: newInterview
    }, { status: 201 });

  } catch (error) {
    console.error('Error scheduling interview:', error);
    return NextResponse.json(
      { error: 'Failed to schedule interview' },
      { status: 500 }
    );
  }
}