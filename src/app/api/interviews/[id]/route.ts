import { NextRequest, NextResponse } from 'next/server';

// Mock interviews database (same as in route.ts)
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
    
    const interview = interviews.find(int => int.id === id);
    
    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(interview);

  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const interviewIndex = interviews.findIndex(int => int.id === id);
    
    if (interviewIndex === -1) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    const {
      scheduledDate,
      duration,
      location,
      meetingLink,
      notes,
      status,
      preparation
    } = body;

    // Update interview
    const updatedInterview = {
      ...interviews[interviewIndex],
      updatedAt: new Date().toISOString()
    };

    // Handle rescheduling
    if (scheduledDate && scheduledDate !== interviews[interviewIndex].scheduledDate) {
      // Validate new date is in future
      if (new Date(scheduledDate) <= new Date()) {
        return NextResponse.json(
          { error: 'Interview must be scheduled for a future date' },
          { status: 400 }
        );
      }
      updatedInterview.scheduledDate = scheduledDate;
    }

    // Update other fields
    if (duration !== undefined) updatedInterview.duration = duration;
    if (location !== undefined) updatedInterview.location = location;
    if (meetingLink !== undefined) updatedInterview.meetingLink = meetingLink;
    if (notes !== undefined) updatedInterview.notes = notes;
    if (status !== undefined) updatedInterview.status = status;
    if (preparation !== undefined) updatedInterview.preparation = preparation;

    interviews[interviewIndex] = updatedInterview;

    // In production, send notifications about changes
    console.log('Interview updated:', updatedInterview);

    return NextResponse.json({
      message: 'Interview updated successfully',
      interview: updatedInterview
    });

  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json(
      { error: 'Failed to update interview' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const interviewIndex = interviews.findIndex(int => int.id === id);
    
    if (interviewIndex === -1) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    const deletedInterview = interviews.splice(interviewIndex, 1)[0];

    // In production, send cancellation notifications
    console.log('Interview cancelled:', deletedInterview);

    return NextResponse.json({
      message: 'Interview cancelled successfully',
      interview: deletedInterview
    });

  } catch (error) {
    console.error('Error deleting interview:', error);
    return NextResponse.json(
      { error: 'Failed to cancel interview' },
      { status: 500 }
    );
  }
}