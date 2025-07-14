
"use client";

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  CalendarDays, 
  Clock, 
  Star, 
  CheckCircle,
  Play,
  Eye,
  Video,
  FileText,
  BarChart3,
  TrendingUp,
  Award,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface InterviewerDashboardData {
  totalInterviews: number;
  thisMonth: {
    scheduled: number;
    completed: number;
  };
  upcomingInterviews: Array<{
    id: string;
    candidateName: string;
    candidateAvatar: string;
    position: string;
    scheduledTime: string;
    duration: number;
    type: string;
    location: string;
    status: string;
    jobId: string;
    candidateProfile: string;
    aiInterviewCompleted: boolean;
    aiScore: number | null;
  }>;
  recentInterviews: Array<{
    id: string;
    candidateName: string;
    position: string;
    completedTime: string;
    rating: number;
    recommendation: string;
    aiScore: number | null;
  }>;
  performance: {
    averageRating: number;
    onTimeRate: number;
  };
}

export default function InterviewerDashboardPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const [data, setData] = useState<InterviewerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (authLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      
      const token = await getToken();
      const response = await fetch('/api/interviewer/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, getToken]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <Container className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </Container>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <Container>
          <AlertCircle className="h-4 w-4" />
          <p>{error || "Could not load dashboard data."}</p>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <MessageSquare className="mr-3 h-8 w-8 text-primary" />
            Welcome back!
          </h1>
          <p className="text-muted-foreground mt-1">
            Interview Hub - Manage your interview schedule and candidate evaluations
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.thisMonth.completed}</div>
              <p className="text-xs text-muted-foreground">
                {data.thisMonth.scheduled} scheduled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalInterviews}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.performance.averageRating}/5</div>
              <p className="text-xs text-muted-foreground">From candidates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.performance.onTimeRate}%</div>
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
                    <CalendarDays className="mr-2 h-5 w-5 text-primary" />
                    Today's Schedule
                  </span>
                  <Link href="/interviewer/schedule">
                    <Button variant="outline" size="sm">View Full Schedule</Button>
                  </Link>
                </CardTitle>
                <CardDescription>Your upcoming interviews and candidate information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.upcomingInterviews.map((interview) => {
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
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          {getStatusBadge(interview.status)}
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
                {data.recentInterviews.map((interview) => {
                  const { date, time } = formatDateTime(interview.completedTime);
                  return (
                    <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{interview.candidateName}</h3>
                        <p className="text-sm text-muted-foreground">{interview.position}</p>
                        <p className="text-xs text-muted-foreground mt-1">{date} at {time}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileText className="mr-1 h-3 w-3" />
                        View Details
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Your interviewing performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{data.performance.averageRating}/5</div>
                    <div className="text-sm text-muted-foreground">Average Rating</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{data.performance.onTimeRate}%</div>
                    <div className="text-sm text-muted-foreground">On-Time Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}
