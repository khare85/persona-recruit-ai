
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Briefcase, Users, CalendarDays, Award, Search, PlusCircle, Eye, LayoutDashboard, Loader2, AlertCircle, FileText, Star, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoOrAuthFetch } from '@/hooks/useDemoOrAuthFetch';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface RecruiterDashboardData {
  activeJobs: number;
  newApplications: number;
  upcomingInterviews: number;
  hiresThisMonth: number;
  upcomingInterviewList: {
    id: string;
    candidateName: string;
    jobTitle: string;
    scheduledFor: string;
    duration: number;
  }[];
  recentApplicationList: {
    id: string;
    candidateName: string;
    jobTitle: string;
    appliedAt: string;
    status: string;
    aiMatchScore: number;
  }[];
}

export default function RecruiterDashboardPage() {
  const { loading: authLoading } = useAuth();
  const [data, setData] = useState<RecruiterDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const demoOrAuthFetch = useDemoOrAuthFetch();

  const fetchData = useCallback(async () => {
    if (authLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await demoOrAuthFetch('/api/recruiter/dashboard');
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [demoOrAuthFetch, authLoading]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
            <LayoutDashboard className="mr-3 h-8 w-8 text-primary" />
            Welcome back!
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your recruitment pipeline and discover top talent with AI-powered insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.activeJobs}</div>
              <Link href="/recruiter/jobs" className="text-xs text-primary hover:underline">Manage jobs</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Applications</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.newApplications}</div>
              <p className="text-xs text-muted-foreground">In the last 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Interviews</CardTitle>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.upcomingInterviews}</div>
              <Link href="/recruiter/interviews" className="text-xs text-primary hover:underline">View schedule</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hires This Month</CardTitle>
              <Award className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.hiresThisMonth}</div>
              <p className="text-xs text-muted-foreground">Successful placements</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" /> Recent Applications
                </CardTitle>
                <CardDescription>Latest candidates who applied to your jobs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recentApplicationList.length > 0 ? data.recentApplicationList.map(app => (
                  <div key={app.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <div className="font-semibold">{app.candidateName}</div>
                      <p className="text-sm text-muted-foreground">{app.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">Applied {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">{app.aiMatchScore}%</span>
                      </div>
                      <Badge variant="secondary" className="mt-1">{app.status}</Badge>
                    </div>
                  </div>
                )) : <p className="text-muted-foreground text-center">No recent applications.</p>}
              </CardContent>
              <CardFooter>
                <Link href="/recruiter/applications" className="w-full">
                  <Button variant="outline" className="w-full">View All Applications</Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="mr-2 h-5 w-5 text-primary" /> Upcoming Interviews
                </CardTitle>
                <CardDescription>Your next scheduled interviews</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.upcomingInterviewList.length > 0 ? data.upcomingInterviewList.map(interview => (
                  <div key={interview.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <div className="font-semibold">{interview.candidateName}</div>
                      <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm">{format(new Date(interview.scheduledFor), 'MMM d, h:mm a')}</div>
                      <p className="text-xs text-muted-foreground">{interview.duration} min</p>
                    </div>
                  </div>
                )) : <p className="text-muted-foreground text-center">No upcoming interviews.</p>}
              </CardContent>
              <CardFooter>
                <Link href="/recruiter/interviews" className="w-full">
                  <Button variant="outline" className="w-full">Manage Interviews</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/jobs/new">
                  <Button variant="ghost" className="w-full justify-start">
                    <PlusCircle className="mr-2 h-4 w-4 text-primary" />Post New Job
                  </Button>
                </Link>
                <Link href="/company/talent-search">
                  <Button variant="ghost" className="w-full justify-start">
                    <Search className="mr-2 h-4 w-4 text-primary" />AI Talent Search
                  </Button>
                </Link>
                <Link href="/recruiter/analytics">
                  <Button variant="ghost" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4 text-primary" />View Analytics
                  </Button>
                </Link>
                <Link href="/recruiter/jobs">
                  <Button variant="default" className="w-full mt-2">
                    <Briefcase className="mr-2 h-4 w-4" />Manage All Jobs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </DashboardLayout>
  );
}
