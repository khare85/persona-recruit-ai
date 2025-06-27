
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Award, Briefcase, CalendarCheck2, Gift, LayoutDashboardIcon, Settings, Zap, FolderOpen, CalendarClock, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface CandidateDashboardData {
  applicationsApplied: number;
  upcomingInterviews: number;
  offersReceived: number;
  aiRecommendedJobs: number;
  recentJobs: Array<{
    id: string;
    title: string;
    company: string;
    jobIdForLink: string;
  }>;
}

export default function CandidateDashboardPage() {
  const { getToken } = useAuth();
  const [dashboardData, setDashboardData] = useState<CandidateDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('User not authenticated. Please log in.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/candidates/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const result = await response.json();
      setDashboardData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);
  
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

  if (error || !dashboardData) {
    return (
      <DashboardLayout>
        <Container className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle>Error Loading Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">{error || 'Could not load your dashboard data.'}</p>
              <Button className="w-full mt-4" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
            <LayoutDashboardIcon className="mr-3 h-8 w-8 text-primary" />
            Welcome!
          </h1>
          <p className="text-muted-foreground mt-1">
            This is your personal dashboard. Manage your job search, profile, and interviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications Sent</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.applicationsApplied}</div>
              <Link href="/jobs" className="text-xs text-primary hover:underline">Browse more jobs</Link>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Interviews</CardTitle>
              <CalendarCheck2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.upcomingInterviews}</div>
              <Link href="/candidates/my-interviews" className="text-xs text-primary hover:underline">View schedule</Link>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers Received</CardTitle>
              <Award className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.offersReceived}</div>
               <span className="text-xs text-muted-foreground">Details in 'My Interviews'</span>
            </CardContent>
          </Card>
           <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Recommended Jobs</CardTitle>
              <Zap className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.aiRecommendedJobs}</div>
              <Link href="/jobs" className="text-xs text-primary hover:underline">See recommendations</Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center"><Zap className="mr-2 h-6 w-6 text-primary" /> AI Recommended Jobs For You</CardTitle>
                <CardDescription>Based on your profile and skills, here are some roles you might be interested in.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                  {dashboardData.recentJobs.map(job => (
                      <div key={job.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-md">{job.title}</h4>
                              <Link href={`/jobs/${job.jobIdForLink || job.id}`} passHref>
                                  <Button variant="link" size="sm" className="p-0 h-auto text-xs">View Job</Button>
                              </Link>
                          </div>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                      </div>
                  ))}
              </CardContent>
              <CardFooter>
                  <Link href="/jobs" passHref>
                      <Button variant="outline">Explore All Jobs</Button>
                  </Link>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                  <Link href="/candidates/my-interviews" passHref><Button variant="ghost" className="w-full justify-start"><CalendarClock className="mr-2 h-4 w-4 text-primary" />My Interviews</Button></Link>
                  <Link href="/candidates/my-applications" passHref><Button variant="ghost" className="w-full justify-start"><Briefcase className="mr-2 h-4 w-4 text-primary" />My Applications</Button></Link>
                  <Link href="/candidates/my-documents" passHref><Button variant="ghost" className="w-full justify-start"><FolderOpen className="mr-2 h-4 w-4 text-primary" />My Documents</Button></Link>
                  <Link href="/referrals" passHref><Button variant="ghost" className="w-full justify-start"><Gift className="mr-2 h-4 w-4 text-primary" />My Referrals</Button></Link>
                  <Link href="/candidates/settings" passHref><Button variant="ghost" className="w-full justify-start"><Settings className="mr-2 h-4 w-4 text-primary" />Profile Settings</Button></Link>
                  <Link href="/jobs" passHref><Button variant="default" className="w-full mt-2"><Briefcase className="mr-2 h-4 w-4" />Search for Jobs</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </DashboardLayout>
  );
}
