import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';
import { databaseService } from '@/services/database.service';

interface RouteParams {
  params: {
    id: string;
  };
}

export const GET = withAuth(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = params;
    
    const application = await databaseService.getApplicationById(id);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application
    });

  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(
  withRole(['recruiter', 'company_admin'], async (request: NextRequest, { params }: RouteParams) => {
    try {
      const { id } = params;
      const body = await request.json();
      const userId = request.user!.id;
      
      const application = await databaseService.getApplicationById(id);
      
      if (!application) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }

      const { status, notes } = body;

      // Prepare update data
      const updateData: any = {
        lastActivityAt: new Date(),
        updatedAt: new Date()
      };

      // Handle status update
      if (status && status !== application.status) {
        updateData.status = status;
        
        // Add timeline entry
        const newTimelineEntry = {
          event: getStatusEventText(status),
          timestamp: new Date(),
          userId: userId,
          notes: notes || undefined
        };
        
        updateData.timeline = [...(application.timeline || []), newTimelineEntry];
      }

      // Handle notes
      if (notes) {
        updateData.notes = notes;
      }

      // Update application in database
      await databaseService.updateApplication(id, updateData);
      
      // Get updated application
      const updatedApplication = await databaseService.getApplicationById(id);

      return NextResponse.json({
        success: true,
        message: 'Application updated successfully',
        data: updatedApplication
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);

export const DELETE = withAuth(
  withRole(['company_admin'], async (request: NextRequest, { params }: RouteParams) => {
    try {
      const { id } = params;
      
      const application = await databaseService.getApplicationById(id);
      
      if (!application) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }

      await databaseService.deleteApplication(id);

      return NextResponse.json({
        success: true,
        message: 'Application deleted successfully'
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);

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