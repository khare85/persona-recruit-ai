'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  MessageCircle, 
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  CalendarDays,
  ArrowRight,
  Star,
  Flag,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock support ticket data
const mockTickets = [
  {
    id: 'TK-2024-001',
    subject: 'Unable to access AI interview feature',
    user: 'Sarah Johnson',
    userEmail: 'sarah.johnson@email.com',
    userType: 'candidate',
    priority: 'high',
    status: 'open',
    category: 'technical',
    createdAt: '2024-06-21T10:30:00Z',
    updatedAt: '2024-06-21T14:20:00Z',
    assignedTo: 'Alex Rodriguez',
    description: 'User is unable to start AI interview session, getting error "Camera access denied" even though permissions are granted.',
    lastResponse: '2 hours ago'
  },
  {
    id: 'TK-2024-002',
    subject: 'Billing inquiry - subscription not showing',
    user: 'Marcus Chen',
    userEmail: 'marcus@techcorp.com',
    userType: 'company',
    priority: 'medium',
    status: 'in_progress',
    category: 'billing',
    createdAt: '2024-06-21T09:15:00Z',
    updatedAt: '2024-06-21T13:45:00Z',
    assignedTo: 'Jennifer Walsh',
    description: 'Company upgraded to Enterprise plan but features are not showing up in dashboard.',
    lastResponse: '1 hour ago'
  },
  {
    id: 'TK-2024-003',
    subject: 'Job posting not appearing in search',
    user: 'Emily Rodriguez',
    userEmail: 'emily@designfirst.com',
    userType: 'recruiter',
    priority: 'medium',
    status: 'pending',
    category: 'platform',
    createdAt: '2024-06-21T08:45:00Z',
    updatedAt: '2024-06-21T08:45:00Z',
    assignedTo: null,
    description: 'Posted a new UX Designer job 3 days ago but it\'s not showing up in candidate searches.',
    lastResponse: 'Never'
  },
  {
    id: 'TK-2024-004',
    subject: 'Profile picture upload failing',
    user: 'David Kim',
    userEmail: 'david.kim@email.com',
    userType: 'candidate',
    priority: 'low',
    status: 'resolved',
    category: 'technical',
    createdAt: '2024-06-20T16:20:00Z',
    updatedAt: '2024-06-21T11:30:00Z',
    assignedTo: 'Mike Thompson',
    description: 'Getting "File too large" error when trying to upload profile picture that is only 2MB.',
    lastResponse: '5 hours ago'
  },
  {
    id: 'TK-2024-005',
    subject: 'Request for enterprise features demo',
    user: 'Jennifer Walsh',
    userEmail: 'jennifer@nextgenrobotics.com',
    userType: 'company',
    priority: 'high',
    status: 'open',
    category: 'sales',
    createdAt: '2024-06-21T11:10:00Z',
    updatedAt: '2024-06-21T12:30:00Z',
    assignedTo: 'Sales Team',
    description: 'Interested in enterprise plan, would like to schedule a demo of advanced matching features.',
    lastResponse: '3 hours ago'
  }
];

const supportStats = {
  total: 127,
  open: 23,
  inProgress: 18,
  pending: 12,
  resolved: 74,
  avgResponseTime: '2.4 hours',
  satisfaction: 4.6
};

export default function AdminSupportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="mr-1 h-3 w-3" />Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="mr-1 h-3 w-3" />In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive"><Flag className="mr-1 h-3 w-3" />High</Badge>;
      case 'medium':
        return <Badge variant="secondary"><Flag className="mr-1 h-3 w-3" />Medium</Badge>;
      case 'low':
        return <Badge variant="outline"><Flag className="mr-1 h-3 w-3" />Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'candidate':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Candidate</Badge>;
      case 'recruiter':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Recruiter</Badge>;
      case 'company':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Company</Badge>;
      default:
        return <Badge variant="outline">{userType}</Badge>;
    }
  };

  const filteredTickets = mockTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <MessageSquare className="mr-3 h-8 w-8 text-primary" />
                Support Tickets
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage customer support tickets and resolve user issues
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supportStats.total}</div>
              <p className="text-xs text-muted-foreground">+5 from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supportStats.open}</div>
              <p className="text-xs text-muted-foreground">{supportStats.inProgress} in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supportStats.avgResponseTime}</div>
              <p className="text-xs text-muted-foreground">-15min from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supportStats.satisfaction}/5</div>
              <p className="text-xs text-muted-foreground">+0.2 from last month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all-tickets" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="all-tickets">All Tickets</TabsTrigger>
              <TabsTrigger value="urgent">Urgent</TabsTrigger>
              <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
              <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all-tickets" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters & Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tickets by ID, subject, or user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="platform">Platform</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
                <CardDescription>Manage and respond to customer support requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Last Response</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.id}</div>
                            <div className="text-sm text-muted-foreground">{ticket.subject}</div>
                            <div className="text-xs text-muted-foreground flex items-center mt-1">
                              <CalendarDays className="mr-1 h-3 w-3" />
                              {formatDate(ticket.createdAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.user}</div>
                            <div className="text-sm text-muted-foreground">{ticket.userEmail}</div>
                            <div className="mt-1">{getUserTypeBadge(ticket.userType)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>
                          {ticket.assignedTo ? (
                            <div className="flex items-center">
                              <User className="mr-1 h-3 w-3 text-muted-foreground" />
                              {ticket.assignedTo}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>{ticket.lastResponse}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                Assign to Me
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Change Status
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Flag className="mr-2 h-4 w-4" />
                                Update Priority
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="urgent">
            <Card>
              <CardHeader>
                <CardTitle>Urgent Tickets</CardTitle>
                <CardDescription>High priority tickets requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Urgent ticket management tools coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unassigned">
            <Card>
              <CardHeader>
                <CardTitle>Unassigned Tickets</CardTitle>
                <CardDescription>Tickets that need to be assigned to team members</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Unassigned ticket management tools coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-tickets">
            <Card>
              <CardHeader>
                <CardTitle>My Tickets</CardTitle>
                <CardDescription>Tickets assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Personal ticket management tools coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}