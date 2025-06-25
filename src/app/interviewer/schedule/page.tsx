'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CalendarDays, 
  Clock, 
  Users, 
  MapPin, 
  Phone, 
  Video,
  CheckCircle,
  AlertTriangle,
  Play,
  Eye,
  Edit,
  MoreHorizontal,
  Filter,
  Download,
  ArrowLeft,
  ArrowRight,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

// Mock schedule data
const scheduleData = {
  currentWeek: '2024-06-17 to 2024-06-23',
  totalThisWeek: 8,
  completedThisWeek: 5,
  upcomingThisWeek: 3,
  interviews: [
    {
      id: 'IV-001',
      candidateName: 'Sarah Johnson',
      candidateAvatar: '/avatars/sarah.jpg',
      candidateEmail: 'sarah.johnson@email.com',
      position: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      scheduledTime: '2024-06-22T10:00:00Z',
      duration: 60,
      type: 'Technical Interview',
      format: 'In-Person',
      location: 'Conference Room A, Floor 3',
      status: 'confirmed',
      jobId: 'JOB-001',
      candidateProfile: '/candidates/1',
      aiInterviewCompleted: true,
      aiScore: 87,
      recruiterName: 'Jennifer Walsh',
      recruiterEmail: 'jennifer@techcorp.com',
      interviewNotes: 'Focus on React expertise and system design',
      preparation: ['Review candidate resume', 'Prepare technical questions', 'Set up coding environment']
    },
    {
      id: 'IV-002',
      candidateName: 'Marcus Chen',
      candidateAvatar: '/avatars/marcus.jpg',
      candidateEmail: 'marcus.chen@email.com',
      position: 'DevOps Engineer',
      company: 'CloudScale Solutions',
      scheduledTime: '2024-06-22T14:30:00Z',
      duration: 45,
      type: 'Behavioral Interview',
      format: 'Virtual',
      location: 'Zoom Meeting (Link sent)',
      status: 'confirmed',
      jobId: 'JOB-002',
      candidateProfile: '/candidates/2',
      aiInterviewCompleted: true,
      aiScore: 92,
      recruiterName: 'Mark Thompson',
      recruiterEmail: 'mark@cloudscale.com',
      interviewNotes: 'Assess leadership and team collaboration skills',
      preparation: ['Review AI interview results', 'Prepare behavioral questions', 'Check Zoom setup']
    },
    {
      id: 'IV-003',
      candidateName: 'Emily Rodriguez',
      candidateAvatar: '/avatars/emily.jpg',
      candidateEmail: 'emily@designfirst.com',
      position: 'UX Designer',
      company: 'DesignFirst Studio',
      scheduledTime: '2024-06-23T11:00:00Z',
      duration: 50,
      type: 'Portfolio Review',
      format: 'In-Person',
      location: 'Design Studio, Building B',
      status: 'pending',
      jobId: 'JOB-003',
      candidateProfile: '/candidates/3',
      aiInterviewCompleted: false,
      aiScore: null,
      recruiterName: 'Sarah Chen',
      recruiterEmail: 'sarah@designfirst.com',
      interviewNotes: 'Review design portfolio and problem-solving approach',
      preparation: ['Review portfolio materials', 'Prepare design challenges', 'Set up presentation space']
    },
    {
      id: 'IV-004',
      candidateName: 'David Kim',
      candidateAvatar: '/avatars/david.jpg',
      candidateEmail: 'david.kim@email.com',
      position: 'Data Scientist',
      company: 'DataDriven Analytics',
      scheduledTime: '2024-06-24T15:00:00Z',
      duration: 60,
      type: 'Technical + Case Study',
      format: 'Hybrid',
      location: 'Conference Room C + Screen Share',
      status: 'confirmed',
      jobId: 'JOB-004',
      candidateProfile: '/candidates/4',
      aiInterviewCompleted: true,
      aiScore: 94,
      recruiterName: 'Lisa Wang',
      recruiterEmail: 'lisa@datadriven.com',
      interviewNotes: 'Machine learning case study and coding assessment',
      preparation: ['Prepare ML datasets', 'Review Python environment', 'Set up case study materials']
    },
    {
      id: 'IV-005',
      candidateName: 'Jennifer Walsh',
      candidateAvatar: '/avatars/jennifer.jpg',
      candidateEmail: 'jennifer@nextgen.com',
      position: 'Product Manager',
      company: 'NextGen Robotics',
      scheduledTime: '2024-06-21T15:00:00Z',
      duration: 45,
      type: 'Final Round',
      format: 'Virtual',
      location: 'Microsoft Teams',
      status: 'completed',
      jobId: 'JOB-005',
      candidateProfile: '/candidates/5',
      aiInterviewCompleted: true,
      aiScore: 89,
      recruiterName: 'Michael Foster',
      recruiterEmail: 'michael@nextgen.com',
      interviewNotes: 'Strategic thinking and product vision assessment',
      preparation: ['Review previous interview feedback', 'Prepare strategic questions', 'Coordinate with team']
    }
  ]
};

export default function InterviewerSchedulePage() {
  const [viewMode, setViewMode] = useState('week');
  const [statusFilter, setStatusFilter] = useState('all');

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'Virtual':
        return <Video className="h-4 w-4 text-blue-600" />;
      case 'In-Person':
        return <MapPin className="h-4 w-4 text-green-600" />;
      case 'Phone':
        return <Phone className="h-4 w-4 text-orange-600" />;
      case 'Hybrid':
        return <Users className="h-4 w-4 text-purple-600" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredInterviews = scheduleData.interviews.filter(interview => {
    if (statusFilter === 'all') return true;
    return interview.status === statusFilter;
  });

  const upcomingInterviews = filteredInterviews.filter(interview => 
    new Date(interview.scheduledTime) > new Date()
  );

  const completedInterviews = filteredInterviews.filter(interview => 
    interview.status === 'completed'
  );

  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <CalendarDays className="mr-3 h-8 w-8 text-primary" />
                Interview Schedule
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your interview calendar and candidate meetings
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Block Time
              </Button>
            </div>
          </div>
        </div>

        {/* Week Navigation & Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">{scheduleData.currentWeek}</h2>
            <Button variant="outline" size="sm">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="font-medium">{scheduleData.totalThisWeek}</span> total
            </div>
            <div className="text-sm">
              <span className="font-medium text-green-600">{scheduleData.completedThisWeek}</span> completed
            </div>
            <div className="text-sm">
              <span className="font-medium text-blue-600">{scheduleData.upcomingThisWeek}</span> upcoming
            </div>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="day">Today</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => {
                const { date, time, dayOfWeek, fullDate } = formatDateTime(interview.scheduledTime);
                return (
                  <Card key={interview.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={interview.candidateAvatar} />
                            <AvatarFallback>{interview.candidateName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{interview.candidateName}</h3>
                                <p className="text-muted-foreground">{interview.position}</p>
                                <p className="text-sm text-muted-foreground">{interview.company}</p>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm font-medium">{dayOfWeek}</div>
                                <div className="text-lg font-bold">{time}</div>
                                <div className="text-sm text-muted-foreground">{date}</div>
                              </div>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{interview.duration} minutes</span>
                                  <Badge variant="outline">{interview.type}</Badge>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  {getFormatIcon(interview.format)}
                                  <span className="text-sm">{interview.location}</span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">Recruiter: {interview.recruiterName}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Status:</span>
                                  {getStatusBadge(interview.status)}
                                </div>
                                
                                {interview.aiInterviewCompleted && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">AI Score:</span>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                      {interview.aiScore}%
                                    </Badge>
                                  </div>
                                )}
                                
                                <div className="text-xs text-muted-foreground mt-2">
                                  <strong>Notes:</strong> {interview.interviewNotes}
                                </div>
                              </div>
                            </div>
                            
                            {/* Preparation Checklist */}
                            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                              <h4 className="text-sm font-medium mb-2">Preparation Checklist:</h4>
                              <div className="space-y-1">
                                {interview.preparation.map((item, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span className="text-xs">{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <Link href={interview.candidateProfile}>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-1 h-3 w-3" />
                              Profile
                            </Button>
                          </Link>
                          
                          {interview.aiInterviewCompleted && (
                            <Button variant="outline" size="sm">
                              <Video className="mr-1 h-3 w-3" />
                              AI Interview
                            </Button>
                          )}
                          
                          <Button size="sm">
                            <Play className="mr-1 h-3 w-3" />
                            Start Interview
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Reschedule
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="mr-2 h-4 w-4" />
                                Contact Recruiter
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Cancel Interview
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {upcomingInterviews.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No upcoming interviews</h3>
                  <p className="text-muted-foreground">Your schedule is clear for the selected period.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Interviews</CardTitle>
                <CardDescription>Review your past interviews and feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedInterviews.map((interview) => {
                    const { date, time } = formatDateTime(interview.scheduledTime);
                    return (
                      <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={interview.candidateAvatar} />
                            <AvatarFallback>{interview.candidateName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{interview.candidateName}</h4>
                            <p className="text-sm text-muted-foreground">{interview.position}</p>
                            <p className="text-xs text-muted-foreground">{date} at {time}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {getStatusBadge(interview.status)}
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-3 w-3" />
                            View Feedback
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
                <CardDescription>Visual calendar layout of your interview schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Calendar view coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}