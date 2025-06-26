import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRole } from '@/middleware/auth';
import { handleApiError } from '@/lib/errors';
import { apiLogger } from '@/lib/logger';

/**
 * GET /api/admin/support - Get support tickets
 */
export const GET = withAuth(
  withRole(['super_admin'], async (req: NextRequest): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const status = searchParams.get('status') || '';
      const priority = searchParams.get('priority') || '';

      apiLogger.info('Fetching support tickets', { userId: req.user?.id, page, limit, status, priority });

      // Mock support tickets - in a real app, this would come from a support database
      const allTickets = [
        {
          id: 'tick_001',
          title: 'Unable to upload resume',
          description: 'Getting error when trying to upload PDF resume',
          status: 'open',
          priority: 'high',
          category: 'technical',
          userId: 'user_123',
          userEmail: 'candidate@example.com',
          userName: 'John Doe',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          assignedTo: null,
          tags: ['upload', 'resume', 'pdf'],
          responses: 2
        },
        {
          id: 'tick_002',
          title: 'Job posting not appearing',
          description: 'Posted a job 3 days ago but it\'s not showing up in search',
          status: 'in_progress',
          priority: 'medium',
          category: 'job_posting',
          userId: 'user_456',
          userEmail: 'recruiter@company.com',
          userName: 'Jane Smith',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
          assignedTo: 'admin_001',
          tags: ['job_posting', 'search', 'visibility'],
          responses: 5
        },
        {
          id: 'tick_003',
          title: 'Billing question about enterprise plan',
          description: 'Need information about upgrading to enterprise plan and pricing',
          status: 'resolved',
          priority: 'low',
          category: 'billing',
          userId: 'user_789',
          userEmail: 'ceo@startup.com',
          userName: 'Mike Johnson',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          assignedTo: 'admin_002',
          tags: ['billing', 'enterprise', 'pricing'],
          responses: 3
        },
        {
          id: 'tick_004',
          title: 'AI matching not working correctly',
          description: 'The AI is matching irrelevant candidates to our job posts',
          status: 'open',
          priority: 'high',
          category: 'ai_matching',
          userId: 'user_101',
          userEmail: 'hr@techcorp.com',
          userName: 'Sarah Wilson',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          assignedTo: null,
          tags: ['ai', 'matching', 'algorithm'],
          responses: 0
        },
        {
          id: 'tick_005',
          title: 'Feature request: Video interview scheduling',
          description: 'Would like to integrate video interview scheduling directly in the platform',
          status: 'open',
          priority: 'low',
          category: 'feature_request',
          userId: 'user_202',
          userEmail: 'recruiter2@company.com',
          userName: 'David Lee',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          assignedTo: null,
          tags: ['feature_request', 'video', 'interview', 'scheduling'],
          responses: 1
        }
      ];

      // Filter tickets
      let filteredTickets = allTickets;
      if (status && status !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === status);
      }
      if (priority && priority !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.priority === priority);
      }

      // Paginate
      const total = filteredTickets.length;
      const paginatedTickets = filteredTickets.slice((page - 1) * limit, page * limit);

      // Calculate stats
      const stats = {
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'open').length,
        inProgress: allTickets.filter(t => t.status === 'in_progress').length,
        resolved: allTickets.filter(t => t.status === 'resolved').length,
        high: allTickets.filter(t => t.priority === 'high').length,
        medium: allTickets.filter(t => t.priority === 'medium').length,
        low: allTickets.filter(t => t.priority === 'low').length,
      };

      return NextResponse.json({
        success: true,
        data: {
          tickets: paginatedTickets,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: total > page * limit,
          },
        },
      });

    } catch (error) {
      return handleApiError(error);
    }
  })
);