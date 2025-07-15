import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';
import { z } from 'zod';

const feedbackSchema = z.object({
  overallRating: z.number().min(1).max(5),
  recommendation: z.enum(['Strong Hire', 'Hire', 'Hire with Reservations', 'No Hire']),
  technicalSkills: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
  problemSolving: z.number().min(1).max(5).optional(),
  culturalFit: z.number().min(1).max(5).optional(),
  leadership: z.number().min(1).max(5).optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  detailedFeedback: z.string().optional(),
  questionsAsked: z.array(z.string()).optional(),
  confidenceLevel: z.number().min(1).max(5).optional(),
  additionalNotes: z.string().optional()
});

interface RouteParams {
  params: {
    id: string;
  };
}

export const GET = withAuth(
  withRole(['interviewer', 'recruiter', 'company_admin'], async (request: NextRequest, { params }: RouteParams) => {
    try {
      const { id } = params;
      const userId = request.user!.id;
      
      const interview = await databaseService.getInterviewById(id);
      
      if (!interview) {
        return NextResponse.json(
          { error: 'Interview not found' },
          { status: 404 }
        );
      }

      // Check if user has access to this interview
      if (request.user!.role === 'interviewer' && interview.interviewerId !== userId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      if (!interview.feedback) {
        return NextResponse.json(
          { error: 'No feedback submitted for this interview' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          interviewId: id,
          feedback: interview.feedback
        }
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);

export const POST = withAuth(
  withRole(['interviewer'], async (request: NextRequest, { params }: RouteParams) => {
    try {
      const { id } = params;
      const userId = request.user!.id;
      const body = await request.json();
      
      const validation = feedbackSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Invalid feedback data',
            details: validation.error.errors
          },
          { status: 400 }
        );
      }

      const interview = await databaseService.getInterviewById(id);
      
      if (!interview) {
        return NextResponse.json(
          { error: 'Interview not found' },
          { status: 404 }
        );
      }

      // Check if user is the interviewer for this interview
      if (interview.interviewerId !== userId) {
        return NextResponse.json(
          { error: 'Only the assigned interviewer can submit feedback' },
          { status: 403 }
        );
      }

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

      const feedbackData = validation.data;

      // Create feedback object
      const feedback = {
        ...feedbackData,
        submittedAt: new Date(),
        submittedBy: userId
      };

      // Update interview with feedback
      await databaseService.updateInterview(id, { 
        feedback,
        rating: feedbackData.overallRating,
        recommendation: feedbackData.recommendation,
        updatedAt: new Date()
      });

      apiLogger.info('Interview feedback submitted', {
        interviewId: id,
        interviewerId: userId,
        rating: feedbackData.overallRating,
        recommendation: feedbackData.recommendation
      });

      return NextResponse.json({
        success: true,
        message: 'Interview feedback submitted successfully',
        data: {
          interviewId: id,
          feedback
        }
      }, { status: 201 });

    } catch (error) {
      return handleApiError(error);
    }
  })
);

export const PUT = withAuth(
  withRole(['interviewer'], async (request: NextRequest, { params }: RouteParams) => {
    try {
      const { id } = params;
      const userId = request.user!.id;
      const body = await request.json();
      
      const validation = feedbackSchema.partial().safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Invalid feedback data',
            details: validation.error.errors
          },
          { status: 400 }
        );
      }

      const interview = await databaseService.getInterviewById(id);
      
      if (!interview) {
        return NextResponse.json(
          { error: 'Interview not found' },
          { status: 404 }
        );
      }

      // Check if user is the interviewer for this interview
      if (interview.interviewerId !== userId) {
        return NextResponse.json(
          { error: 'Only the assigned interviewer can update feedback' },
          { status: 403 }
        );
      }

      if (!interview.feedback) {
        return NextResponse.json(
          { error: 'No feedback exists to update' },
          { status: 404 }
        );
      }

      const feedbackData = validation.data;

      // Update feedback fields
      const updatedFeedback = {
        ...interview.feedback,
        ...feedbackData,
        updatedAt: new Date(),
        updatedBy: userId
      };

      // Update interview
      await databaseService.updateInterview(id, {
        feedback: updatedFeedback,
        rating: feedbackData.overallRating || interview.feedback.overallRating,
        recommendation: feedbackData.recommendation || interview.feedback.recommendation,
        updatedAt: new Date()
      });

      apiLogger.info('Interview feedback updated', {
        interviewId: id,
        interviewerId: userId,
        updatedFields: Object.keys(feedbackData)
      });

      return NextResponse.json({
        success: true,
        message: 'Interview feedback updated successfully',
        data: {
          interviewId: id,
          feedback: updatedFeedback
        }
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);