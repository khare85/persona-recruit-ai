import { NextRequest, NextResponse } from 'next/server';

// Mock interviews database
const interviews = [
  {
    id: 'IV-001',
    applicationId: 'APP-001',
    candidateId: '1',
    candidateName: 'Sarah Johnson',
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    interviewerId: 'INT-001',
    interviewerName: 'Alex Rodriguez',
    scheduledDate: '2024-06-25T14:00:00Z',
    status: 'completed',
    feedback: {
      overallRating: 4,
      recommendation: 'Hire',
      technicalSkills: 5,
      communication: 4,
      problemSolving: 4,
      culturalFit: 4,
      leadership: 3,
      strengths: 'Excellent React knowledge and system design skills',
      weaknesses: 'Could improve on backend technologies',
      detailedFeedback: 'Strong candidate with excellent technical skills...',
      questionsAsked: [
        'Explain React virtual DOM',
        'Design a scalable frontend architecture'
      ],
      confidenceLevel: 4,
      additionalNotes: 'Would be a great addition to the team',
      submittedAt: '2024-06-25T15:30:00Z',
      submittedBy: 'alex.rodriguez@techcorp.com'
    }
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

    if (!interview.feedback) {
      return NextResponse.json(
        { error: 'No feedback submitted for this interview' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      interviewId: id,
      feedback: interview.feedback
    });

  } catch (error) {
    console.error('Error fetching interview feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview feedback' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const interview = interviews[interviewIndex];

    // Check if interview is completed
    if (interview.status !== 'completed') {
      return NextResponse.json(
        { error: 'Cannot submit feedback for an incomplete interview' },
        { status: 400 }
      );
    }

    // Check if feedback already exists
    if (interview.feedback) {
      return NextResponse.json(
        { error: 'Feedback has already been submitted for this interview' },
        { status: 409 }
      );
    }

    const {
      overallRating,
      recommendation,
      technicalSkills,
      communication,
      problemSolving,
      culturalFit,
      leadership,
      strengths,
      weaknesses,
      detailedFeedback,
      questionsAsked,
      confidenceLevel,
      additionalNotes
    } = body;

    // Validate required fields
    if (!overallRating || !recommendation) {
      return NextResponse.json(
        { error: 'Overall rating and recommendation are required' },
        { status: 400 }
      );
    }

    // Validate rating ranges (1-5)
    const ratings = [overallRating, technicalSkills, communication, problemSolving, culturalFit, leadership, confidenceLevel];
    const invalidRating = ratings.find(rating => rating && (rating < 1 || rating > 5));
    
    if (invalidRating) {
      return NextResponse.json(
        { error: 'All ratings must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Create feedback object
    const feedback = {
      overallRating,
      recommendation,
      technicalSkills: technicalSkills || null,
      communication: communication || null,
      problemSolving: problemSolving || null,
      culturalFit: culturalFit || null,
      leadership: leadership || null,
      strengths: strengths || '',
      weaknesses: weaknesses || '',
      detailedFeedback: detailedFeedback || '',
      questionsAsked: questionsAsked || [],
      confidenceLevel: confidenceLevel || null,
      additionalNotes: additionalNotes || '',
      submittedAt: new Date().toISOString(),
      submittedBy: 'demo@example.com' // In production, get from auth context
    };

    // Update interview with feedback
    interviews[interviewIndex] = {
      ...interview,
      feedback,
      updatedAt: new Date().toISOString()
    };

    // In production, trigger additional workflows:
    // - Update application status
    // - Send notifications to recruiters
    // - Calculate overall candidate score
    console.log('Interview feedback submitted:', feedback);

    return NextResponse.json({
      message: 'Interview feedback submitted successfully',
      interviewId: id,
      feedback
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting interview feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit interview feedback' },
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

    const interview = interviews[interviewIndex];

    if (!interview.feedback) {
      return NextResponse.json(
        { error: 'No feedback exists to update' },
        { status: 404 }
      );
    }

    // Update feedback fields
    const updatedFeedback = {
      ...interview.feedback,
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: 'demo@example.com' // In production, get from auth context
    };

    // Update interview
    interviews[interviewIndex] = {
      ...interview,
      feedback: updatedFeedback,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      message: 'Interview feedback updated successfully',
      interviewId: id,
      feedback: updatedFeedback
    });

  } catch (error) {
    console.error('Error updating interview feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update interview feedback' },
      { status: 500 }
    );
  }
}