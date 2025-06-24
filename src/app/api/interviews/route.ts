import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database.service';
import { handleApiError } from '@/lib/errors';
import { withAuth } from '@/middleware/auth';
import { apiLogger } from '@/lib/logger';

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

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const candidateId = searchParams.get('candidateId');
    const interviewerId = searchParams.get('interviewerId');
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const companyId = searchParams.get('companyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    apiLogger.info('Fetching interviews', { candidateId, interviewerId, jobId, status, companyId });

    // Build filters object for database service
    const filters: any = {};
    if (candidateId) filters.candidateId = candidateId;
    if (interviewerId) filters.interviewerId = interviewerId;
    if (jobId) filters.jobId = jobId;
    if (status) filters.status = status;
    if (companyId) filters.companyId = companyId;

    // Fetch from database
    const interviews = await databaseService.getInterviews(filters);

    // Sort by scheduled date
    interviews.sort((a, b) => {
      const dateA = new Date(a.scheduledFor || a.createdAt).getTime();
      const dateB = new Date(b.scheduledFor || b.createdAt).getTime();
      return dateA - dateB;
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInterviews = interviews.slice(startIndex, endIndex);

    // Enrich interview data with job and candidate info if needed
    const enrichedInterviews = await Promise.all(
      paginatedInterviews.map(async (interview) => {
        const job = interview.jobId ? await databaseService.getJobById(interview.jobId) : null;
        const candidate = interview.candidateId ? await databaseService.getUserById(interview.candidateId) : null;
        const company = job ? await databaseService.getCompanyById(job.companyId) : null;
        
        return {
          ...interview,
          jobTitle: job?.title || 'Unknown Position',
          companyName: company?.name || 'Unknown Company',
          candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown Candidate',
          candidateEmail: candidate?.email || 'unknown@example.com'
        };
      })
    );

    return NextResponse.json({
      data: enrichedInterviews,
      pagination: {
        page,
        limit,
        total: interviews.length,
        totalPages: Math.ceil(interviews.length / limit),
        hasNext: endIndex < interviews.length,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

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