
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Briefcase, Users, Calendar, Award, Search, Activity, PlusCircle, Eye, LayoutDashboard, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface RecruiterDashboardData {
  activeJobs: number;
  candidatesViewed: number;
  interviewsScheduled: number;
  hires: number;
  recentJobs: Array<{ id: string; title: string; applicants: number; views: number; }>;
}

export default function RecruiterDashboardPage() {
  const [data, setData] = useState<RecruiterDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/recruiter/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

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
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.activeJobs}</div>
              <Link href="/jobs" className="text-xs text-primary hover:underline">Manage all jobs</Link>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Candidates Viewed</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.candidatesViewed}</div>
              <Link href="/candidates" className="text-xs text-primary hover:underline">Browse candidates</Link>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews Scheduled</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.interviewsScheduled}</div>
              <Link href="/interviews" className="text-xs text-primary hover:underline">View schedule</Link>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Hires</CardTitle>
              <Award className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.hires}</div>
              <span className="text-xs text-muted-foreground">This month</span>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-6 w-6 text-primary" /> Recent Job Postings
                </CardTitle>
                <CardDescription>Track the performance of your latest job postings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recentJobs.map(job => (
                  <div key={job.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <h4 className="font-semibold">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {job.applicants} applicants • {job.views} views
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Link href="/jobs/new">
                  <Button className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Post New Job
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/jobs/new">
                  <Button variant="ghost" className="w-full justify-start">
                    <PlusCircle className="mr-2 h-4 w-4 text-primary" />Post New Job
                  </Button>
                </Link>
                <Link href="/candidates">
                  <Button variant="ghost" className="w-full justify-start">
                    <Search className="mr-2 h-4 w-4 text-primary" />Browse Candidates
                  </Button>
                </Link>
                <Link href="/interviews">
                  <Button variant="ghost" className="w-full justify-start">
                    <Activity className="mr-2 h-4 w-4 text-primary" />AI Interview Analysis
                  </Button>
                </Link>
                <Link href="/jobs">
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
