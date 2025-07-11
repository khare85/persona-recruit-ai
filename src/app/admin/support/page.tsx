
'use client';

import { useAdminData, AdminPageWrapper } from '@/utils/adminPageTemplate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  MessageSquare, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Flag
} from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  user: string;
  userEmail: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'pending' | 'resolved';
  createdAt: string;
  lastResponse: string;
}

interface SupportStats {
  total: number;
  open: number;
  inProgress: number;
  pending: number;
  resolved: number;
}

export default function AdminSupportPage() {
  const { data, isLoading, error, refetch } = useAdminData<{
    tickets: SupportTicket[];
    stats: SupportStats;
  }>({
    endpoint: '/api/admin/support'
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="mr-1 h-3 w-3" />Open</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800"><Clock className="mr-1 h-3 w-3" />In Progress</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'resolved': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Resolved</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive"><Flag className="mr-1 h-3 w-3" />High</Badge>;
      case 'medium': return <Badge variant="secondary"><Flag className="mr-1 h-3 w-3" />Medium</Badge>;
      case 'low': return <Badge variant="outline"><Flag className="mr-1 h-3 w-3" />Low</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <AdminPageWrapper
      title="Support Tickets"
      description="Manage customer support tickets and resolve user issues"
      icon={MessageSquare}
      isLoading={isLoading}
      error={error}
      onRefresh={refetch}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Tickets</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.stats?.total || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Open Tickets</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.stats?.open || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">In Progress</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.stats?.inProgress || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Resolved</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.stats?.resolved || 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Queue</CardTitle>
          <CardDescription>All active and recent support tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Response</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div className="font-medium">{ticket.id}</div>
                    <div className="text-sm text-muted-foreground">{ticket.subject}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{ticket.user}</div>
                    <div className="text-sm text-muted-foreground">{ticket.userEmail}</div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>{ticket.lastResponse}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminPageWrapper>
  );
}
