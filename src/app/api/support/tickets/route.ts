import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { databaseService } from '@/services/database.service';

// Submit a new support ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, category, priority, description, attachments } = body;

    // Validate required fields
    if (!name || !email || !subject || !category || !priority || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate ticket ID
    const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const ticket = {
      id: ticketId,
      name,
      email,
      subject,
      category,
      priority,
      description,
      attachments: attachments || [],
      status: 'open',
      assignedTo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: [],
      tags: [],
      resolvedAt: null,
      satisfaction: null
    };

    // Save to database
    await databaseService.create('supportTickets', ticket);

    // Send confirmation email (in real implementation)
    // await emailService.sendTicketConfirmation(email, ticketId);

    return NextResponse.json({
      success: true,
      data: {
        ticketId,
        message: 'Support ticket submitted successfully'
      }
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to submit support ticket' },
      { status: 500 }
    );
  }
}

// Get support tickets (admin only)
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    
    // Only admins can view all tickets
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const priority = url.searchParams.get('priority');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    let query: any = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const tickets = await databaseService.findMany('supportTickets', {
      where: query,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const totalCount = await databaseService.count('supportTickets', query);

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
});