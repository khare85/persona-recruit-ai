'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CalendarDays, 
  Plus, 
  Search, 
  Clock,
  Video,
  MapPin,
  Phone,
  User,
  Briefcase,
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Eye,
  RefreshCw,
  Filter,
  Users
} from 'lucide-react';
import Link from 'next/link';

interface Interview {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobId: string;
  interviewerName: string;
  interviewerEmail: string;
  scheduledAt: string;
  duration: number;
  type: 'video' | 'phone' | 'in-person';
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  feedback?: string;
  rating?: number;
  notes?: string;
  createdAt: string;
}

interface InterviewStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  avgRating: number;
  completionRate: number;
}

export default function RecruiterInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<InterviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    fetchInterviews();
  }, []);

  useEffect(() => {
    filterInterviews();
  }, [interviews, searchTerm, statusFilter, typeFilter]);

  const fetchInterviews = async () => {
    try {
      const response = await fetch('/api/recruiter/interviews');
      if (response.ok) {
        const result = await response.json();
        setInterviews(result.data.interviews || []);
        setStats(result.data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      // Mock data for demonstration
      const mockInterviews: Interview[] = [
        {
          id: '1',
          candidateName: 'John Smith',
          candidateEmail: 'john.smith@email.com',
          jobTitle: 'Senior Frontend Developer',
          jobId: 'job_1',
          interviewerName: 'Sarah Johnson',
          interviewerEmail: 'sarah@techcorp.com',
          scheduledAt: '2024-06-25T14:00:00Z',
          duration: 60,
          type: 'video',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          status: 'scheduled',
          createdAt: '2024-06-20T10:30:00Z'
        },
        {
          id: '2',
          candidateName: 'Sarah Johnson',
          candidateEmail: 'sarah.j@email.com',
          jobTitle: 'Product Manager',
          jobId: 'job_2',
          interviewerName: 'Mike Chen',
          interviewerEmail: 'mike@techcorp.com',
          scheduledAt: '2024-06-24T16:00:00Z',
          duration: 45,
          type: 'video',
          meetingLink: 'https://zoom.us/j/123456789',
          status: 'completed',
          feedback: 'Strong candidate with excellent product sense. Good communication skills and relevant experience.',
          rating: 4,
          notes: 'Follow up on timeline availability',
          createdAt: '2024-06-19T14:15:00Z'
        },
        {
          id: '3',
          candidateName: 'Mike Chen',
          candidateEmail: 'mike.chen@email.com',
          jobTitle: 'Data Scientist',
          jobId: 'job_3',
          interviewerName: 'Lisa Park',
          interviewerEmail: 'lisa@techcorp.com',
          scheduledAt: '2024-06-26T10:00:00Z',
          duration: 90,
          type: 'in-person',
          location: 'TechCorp Office, Conference Room A',
          status: 'scheduled',
          createdAt: '2024-06-18T16:20:00Z'
        }
      ];
      setInterviews(mockInterviews);
      setStats({
        total: 3,
        scheduled: 2,
        completed: 1,
        cancelled: 0,
        noShow: 0,
        avgRating: 4.0,
        completionRate: 100
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterInterviews = () => {
    let filtered = interviews;

    if (searchTerm) {
      filtered = filtered.filter(interview => 
        interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        interview.interviewerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(interview => interview.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(interview => interview.type === typeFilter);
    }

    setFilteredInterviews(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'no-show': return <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="h-3 w-3 mr-1" />No Show</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4 text-blue-600" />;
      case 'phone': return <Phone className="h-4 w-4 text-green-600" />;
      case 'in-person': return <MapPin className="h-4 w-4 text-purple-600" />;
      default: return <CalendarDays className="h-4 w-4" />;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const handleStatusChange = async (interviewId: string, newStatus: string) => {
    try {
      setInterviews(interviews => 
        interviews.map(interview => 
          interview.id === interviewId 
            ? { ...interview, status: newStatus as Interview['status'] }
            : interview
        )
      );
    } catch (error) {
      console.error('Error updating interview status:', error);
    }
  };

  const submitFeedback = async () => {
    if (!selectedInterview) return;

    try {
      setInterviews(interviews => 
        interviews.map(interview => 
          interview.id === selectedInterview.id 
            ? { ...interview, feedback, rating, status: 'completed' }
            : interview
        )
      );
      setShowFeedbackDialog(false);
      setFeedback('');
      setRating(0);
      setSelectedInterview(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const isUpcoming = (scheduledAt: string) => {
    return new Date(scheduledAt) > new Date();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <CalendarDays className="mr-3 h-8 w-8 text-primary" />
            Interview Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Schedule, manage, and track all your candidate interviews
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.scheduled || 0}</div>
              <p className="text-xs text-muted-foreground">Upcoming interviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.completionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">Successful interviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.avgRating || 0}/5</div>
              <p className="text-xs text-muted-foreground">Interview quality</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all">All Interviews ({stats?.total || 0})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({stats?.scheduled || 0})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({stats?.completed || 0})</TabsTrigger>
            </TabsList>
            <Link href="/recruiter/schedule-interview">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Interview
              </Button>
            </Link>
          </div>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Interviews</CardTitle>
                    <CardDescription>Complete history of candidate interviews</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchInterviews}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search interviews..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no-show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="in-person">In-Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Interviews Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Interviewer</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInterviews.map((interview) => {
                      const { date, time } = formatDateTime(interview.scheduledAt);
                      return (
                        <TableRow key={interview.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{interview.candidateName}</div>
                              <div className="text-sm text-muted-foreground">{interview.candidateEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{interview.jobTitle}</div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{interview.interviewerName}</div>
                              <div className="text-sm text-muted-foreground">{interview.interviewerEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{date}</div>
                              <div className="text-sm text-muted-foreground">{time}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(interview.type)}
                              <span className="capitalize">{interview.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(interview.status)}
                          </TableCell>
                          <TableCell>
                            {interview.rating ? (
                              <div className="flex items-center gap-1">
                                {getRatingStars(interview.rating)}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {interview.status === 'scheduled' && isUpcoming(interview.scheduledAt) && (
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {interview.status === 'scheduled' && !isUpcoming(interview.scheduledAt) && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedInterview(interview);
                                    setShowFeedbackDialog(true);
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              )}
                              <Select onValueChange={(value) => handleStatusChange(interview.id, value)}>
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue placeholder="Update" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="scheduled">Scheduled</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                  <SelectItem value="no-show">No Show</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Interviews</CardTitle>
                <CardDescription>Interviews scheduled for the coming days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredInterviews.filter(interview => 
                    interview.status === 'scheduled' && isUpcoming(interview.scheduledAt)
                  ).map((interview) => {
                    const { date, time } = formatDateTime(interview.scheduledAt);
                    return (
                      <div key={interview.id} className="flex justify-between items-center p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{interview.candidateName}</h4>
                              <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
                              <p className="text-sm text-muted-foreground">
                                with {interview.interviewerName}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{date}</div>
                          <div className="text-sm text-muted-foreground">{time}</div>
                          <div className="flex items-center gap-1 mt-1">
                            {getTypeIcon(interview.type)}
                            <span className="text-xs capitalize">{interview.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {interview.meetingLink && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                                <Video className="h-4 w-4 mr-1" />
                                Join
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Interviews</CardTitle>
                <CardDescription>Interviews with feedback and ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredInterviews.filter(interview => interview.status === 'completed').map((interview) => {
                    const { date, time } = formatDateTime(interview.scheduledAt);
                    return (
                      <div key={interview.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{interview.candidateName}</h4>
                            <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
                            <p className="text-sm text-muted-foreground">{date} at {time}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {interview.rating && getRatingStars(interview.rating)}
                          </div>
                        </div>
                        {interview.feedback && (
                          <div className="bg-muted/50 p-3 rounded-md">
                            <p className="text-sm">{interview.feedback}</p>
                          </div>
                        )}
                        {interview.notes && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground">Notes: {interview.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feedback Dialog */}
        <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Interview Feedback</DialogTitle>
              <DialogDescription>
                Provide feedback for {selectedInterview?.candidateName}'s interview
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rating</label>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setRating(i + 1)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Feedback</label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide detailed feedback about the candidate's performance..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={submitFeedback}>
                  Submit Feedback
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}