'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Users, 
  Star, 
  CheckCircle,
  AlertCircle,
  Play,
  Eye,
  Edit,
  Video,
  FileText,
  Timer,
  Briefcase,
  Building,
  MapPin,
  Phone,
  Mail,
  BarChart3,
  TrendingUp,
  Award
} from 'lucide-react';
import Link from 'next/link';

// Mock interviewer data
const interviewerData = {
  id: 'INT-001',
  name: 'Alex Rodriguez',
  email: 'alex.rodriguez@techcorp.com',
  avatar: '/avatars/alex.jpg',
  company: 'TechCorp Inc.',
  department: 'Engineering',
  experience: '5 years',
  specializations: ['Frontend Development', 'System Design', 'Team Leadership'],
  rating: 4.8,
  totalInterviews: 156,
  thisMonth: {
    scheduled: 8,
    completed: 12,
    pending: 3,
    cancelled: 1
  },
  performance: {
    averageRating: 4.7,
    onTimeRate: 96,
    completionRate: 98,
    feedbackScore: 4.8
  }
};

// Mock upcoming interviews
const upcomingInterviews = [
  {
    id: 'IV-001',
    candidateName: 'Sarah Johnson',
    candidateAvatar: '/avatars/sarah.jpg',
    position: 'Senior Frontend Developer',
    scheduledTime: '2024-06-22T10:00:00Z',
    duration: 60,
    type: 'Technical',
    location: 'Conference Room A',
    status: 'confirmed',
    jobId: 'JOB-001',
    candidateProfile: '/candidates/1',
    aiInterviewCompleted: true,
    aiScore: 87
  },
  {
    id: 'IV-002',
    candidateName: 'Marcus Chen',
    candidateAvatar: '/avatars/marcus.jpg',
    position: 'DevOps Engineer',
    scheduledTime: '2024-06-22T14:30:00Z',
    duration: 45,
    type: 'Behavioral',
    location: 'Virtual Meeting',
    status: 'confirmed',
    jobId: 'JOB-002',
    candidateProfile: '/candidates/2',
    aiInterviewCompleted: true,
    aiScore: 92
  },
  {
    id: 'IV-003',
    candidateName: 'Emily Rodriguez',
    candidateAvatar: '/avatars/emily.jpg',
    position: 'UX Designer',
    scheduledTime: '2024-06-23T11:00:00Z',
    duration: 50,
    type: 'Portfolio Review',
    location: 'Design Studio',
    status: 'pending',
    jobId: 'JOB-003',
    candidateProfile: '/candidates/3',
    aiInterviewCompleted: false,
    aiScore: null
  }
];

// Mock recent interviews
const recentInterviews = [
  {
    id: 'IV-004',
    candidateName: 'David Kim',
    position: 'Data Scientist',
    completedTime: '2024-06-21T15:00:00Z',
    rating: 5,
    feedback: 'Excellent technical skills and problem-solving approach',
    recommendation: 'Strong Hire',
    aiScore: 94
  },
  {
    id: 'IV-005',
    candidateName: 'Jennifer Walsh',
    position: 'Product Manager',
    completedTime: '2024-06-21T09:30:00Z',
    rating: 4,
    feedback: 'Good strategic thinking, needs improvement in technical depth',
    recommendation: 'Hire',
    aiScore: 78
  }
];

export default function InterviewerDashboardPage() {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <MessageSquare className="mr-3 h-8 w-8 text-primary" />
                Welcome back, {interviewerData.name}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Interview Hub - Manage your interview schedule and candidate evaluations
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Building className="mr-1 h-3 w-3" />
                {interviewerData.company}
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <Star className="mr-1 h-3 w-3" />
                {interviewerData.rating} Rating
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviewerData.thisMonth.completed}</div>
              <p className="text-xs text-muted-foreground">
                {interviewerData.thisMonth.scheduled} scheduled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviewerData.totalInterviews}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviewerData.performance.averageRating}</div>
              <p className="text-xs text-muted-foreground">From candidates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interviewerData.performance.onTimeRate}%</div>
              <p className="text-xs text-muted-foreground">Punctuality score</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Interviews</TabsTrigger>
            <TabsTrigger value="recent">Recent Interviews</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-primary" />
                    Today's Schedule
                  </span>
                  <Link href="/interviewer/schedule">
                    <Button variant="outline" size="sm">View Full Schedule</Button>
                  </Link>
                </CardTitle>
                <CardDescription>Your upcoming interviews and candidate information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingInterviews.map((interview) => {
                  const { date, time } = formatDateTime(interview.scheduledTime);
                  return (
                    <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={interview.candidateAvatar} />
                          <AvatarFallback>{interview.candidateName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{interview.candidateName}</h3>
                          <p className="text-sm text-muted-foreground">{interview.position}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{time} • {interview.duration}min</span>
                            <MapPin className="h-3 w-3 text-muted-foreground ml-2" />
                            <span className="text-xs text-muted-foreground">{interview.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          {getStatusBadge(interview.status)}
                          <div className="text-xs text-muted-foreground mt-1">
                            {interview.aiInterviewCompleted ? (
                              <span className="text-green-600">✓ AI Score: {interview.aiScore}</span>
                            ) : (
                              <span className="text-orange-600">⚠ No AI Interview</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-1">
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
                        </div>
                        
                        <Button>
                          <Play className="mr-1 h-3 w-3" />
                          Start
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users className="mr-2 h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/interviewer/candidates">
                    <Button variant="ghost" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      View All Candidates
                    </Button>
                  </Link>
                  <Link href="/interviewer/feedback">
                    <Button variant="ghost" className="w-full justify-start">
                      <Edit className="mr-2 h-4 w-4" />
                      Submit Feedback
                    </Button>
                  </Link>
                  <Link href="/interviewer/schedule">
                    <Button variant="ghost" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      Manage Schedule
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                    This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Completed</span>
                      <span className="font-semibold">5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Scheduled</span>
                      <span className="font-semibold">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Rating</span>
                      <span className="font-semibold">4.6</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Award className="mr-2 h-5 w-5 text-primary" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="outline" className="w-full justify-center bg-gold-50 text-yellow-700">
                      🏆 Top Interviewer
                    </Badge>
                    <Badge variant="outline" className="w-full justify-center bg-blue-50 text-blue-700">
                      ⭐ 100+ Interviews
                    </Badge>
                    <Badge variant="outline" className="w-full justify-center bg-green-50 text-green-700">
                      ✅ 95%+ On-Time
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                  Recently Completed Interviews
                </CardTitle>
                <CardDescription>Your recent interview feedback and ratings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentInterviews.map((interview) => {
                  const { date, time } = formatDateTime(interview.completedTime);
                  return (
                    <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{interview.candidateName}</h3>
                        <p className="text-sm text-muted-foreground">{interview.position}</p>
                        <p className="text-xs text-muted-foreground mt-1">{date} at {time}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-semibold">Your Rating</div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < interview.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm font-semibold">AI Score</div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {interview.aiScore}%
                          </Badge>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm font-semibold">Recommendation</div>
                          <Badge className={interview.recommendation === 'Strong Hire' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                            {interview.recommendation}
                          </Badge>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          <FileText className="mr-1 h-3 w-3" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>Your interviewing performance overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Rating</span>
                      <span className="text-2xl font-bold">{interviewerData.performance.averageRating}/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">On-Time Rate</span>
                      <span className="text-2xl font-bold">{interviewerData.performance.onTimeRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <span className="text-2xl font-bold">{interviewerData.performance.completionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Feedback Score</span>
                      <span className="text-2xl font-bold">{interviewerData.performance.feedbackScore}/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="mr-2 h-5 w-5 text-primary" />
                    Specializations
                  </CardTitle>
                  <CardDescription>Your areas of expertise</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {interviewerData.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="mr-2 mb-2">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    {interviewerData.experience} of interviewing experience
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}