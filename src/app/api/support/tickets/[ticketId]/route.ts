import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { databaseService } from '@/services/database.service';

// Get specific ticket
export const GET = withAuth(async (request: NextRequest, { params }: { params: { ticketId: string } }) => {
  try {
    const user = (request as any).user;
    const { ticketId } = params;

    const ticket = await databaseService.findById('supportTickets', ticketId);
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check permissions - admins can see all, users can only see their own
    if (user.role !== 'super_admin' && ticket.email !== user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ticket }
    });

  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support ticket' },
      { status: 500 }
    );
  }
});

// Update ticket (admin only)
export const PATCH = withAuth(async (request: NextRequest, { params }: { params: { ticketId: string } }) => {
  try {
    const user = (request as any).user;
    const { ticketId } = params;

    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, assignedTo, priority, tags, response } = body;

    const ticket = await databaseService.findById('supportTickets', ticketId);
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const updates: any = {
      updatedAt: new Date()
    };

    if (status) {
      updates.status = status;
      if (status === 'resolved' || status === 'closed') {
        updates.resolvedAt = new Date();
      }
    }
    
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (priority) updates.priority = priority;
    if (tags) updates.tags = tags;

    // Add response if provided
    if (response) {
      const newResponse = {
        id: Math.random().toString(36).substr(2, 9),
        author: user.email,
        authorName: `${user.firstName} ${user.lastName}`,
        content: response,
        isInternal: body.isInternal || false,
        timestamp: new Date()
      };
      
      updates.responses = [...(ticket.responses || []), newResponse];
    }

    await databaseService.update('supportTickets', ticketId, updates);

    const updatedTicket = await databaseService.findById('supportTickets', ticketId);

    // Send notification email to customer if response was added
    if (response && !body.isInternal) {
      // await emailService.sendTicketResponse(ticket.email, ticketId, response);
    }

    return NextResponse.json({
      success: true,
      data: { ticket: updatedTicket }
    });

  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
});

// Delete ticket (admin only)
export const DELETE = withAuth(async (request: NextRequest, { params }: { params: { ticketId: string } }) => {
  try {
    const user = (request as any).user;
    const { ticketId } = params;

    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await databaseService.delete('supportTickets', ticketId);

    return NextResponse.json({
      success: true,
      data: { message: 'Ticket deleted successfully' }
    });

  } catch (error) {
    console.error('Error deleting support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete support ticket' },
      { status: 500 }
    );
  }
});