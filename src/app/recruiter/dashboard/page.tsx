
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Briefcase, Users, BarChart3, DollarSign, Activity, Search, SettingsIcon, UserPlus, CheckCircle, Bell, PlusCircle, UsersRound, FileSearch, CalendarCheck, Award } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Mock data for Recruiter Dashboard
const recruiterStats = {
  activeJobs: 7,
  totalApplicants: 124,
  newApplicantsToday: 8,
  interviewsScheduledThisWeek: 5,
  successfulPlacementsMonth: 2,
};

const recentActivities = [
  { id: 1, type: 'new_applicant' as const, text: 'John Doe applied for Senior Frontend Engineer.', time: '2h ago', jobId: '1', applicantId: 'cand1' },
  { id: 2, type: 'interview_update' as const, text: 'Interview scheduled: Alice W. for Cloud Solutions Architect - Tomorrow 10 AM.', time: '5h ago', jobId: 'ts2' },
  { id: 3, type: 'job_update' as const, text: 'Your "UX/UI Designer" job post received 3 new views.', time: 'Yesterday', jobId: '3' },
  { id: 4, type: 'candidate_note' as const, text: 'Hiring Manager left feedback for Bob B. (Job ID: 1).', time: 'Yesterday', jobId: '1', applicantId: 'cand2'},
];

const mockRecruiterEarnings = {
    last30Days: "2,750.00",
    nextPayout: "1,500.00",
    pendingReferralBonuses: 3,
};

export default function RecruiterDashboardPage() {
  const getActivityIcon = (type: typeof recentActivities[number]['type']) => {
    switch (type) {
      case 'new_applicant': return <UserPlus className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />;
      case 'interview_update': return <CalendarCheck className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />;
      case 'job_update': return <Briefcase className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />;
      case 'candidate_note': return <FileSearch className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />;
    }
  };

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground">Recruiter Hub</h1>
        <p className="text-muted-foreground mt-1">Your central command for managing talent acquisition.</p>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Job Postings</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recruiterStats.activeJobs}</div>
            <Link href="/jobs" className="text-xs text-primary hover:underline">Manage Jobs</Link>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Applicants Today</CardTitle>
            <UsersRound className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recruiterStats.newApplicantsToday}</div>
             <Link href="/jobs" className="text-xs text-primary hover:underline">View Applicants</Link>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews This Week</CardTitle>
            <CalendarCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recruiterStats.interviewsScheduledThisWeek}</div>
            <Link href="#" className="text-xs text-primary hover:underline">View Calendar</Link> {/* Conceptual link */}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful Placements</CardTitle>
            <Award className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recruiterStats.successfulPlacementsMonth}</div>
            <p className="text-xs text-muted-foreground">This month (mock)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Bell className="mr-2 h-6 w-6 text-primary" /> Recent Activity & Updates</CardTitle>
              <CardDescription>Latest notifications about your jobs and candidates.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <ul className="space-y-1">
                  {recentActivities.map(activity => (
                    <li key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-muted/50 rounded-md transition-colors">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="text-sm text-foreground">{activity.text}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
              )}
            </CardContent>
            <CardFooter>
                <Button variant="link" className="text-xs p-0 h-auto mx-auto text-primary">View All Activities</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Quick Actions & Earnings */}
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              <Link href="/jobs/new" passHref className="block">
                <Button variant="default" className="w-full"><PlusCircle className="mr-2 h-4 w-4" />Post New Job</Button>
              </Link>
              <Link href="/candidates" passHref className="block">
                <Button variant="outline" className="w-full"><Search className="mr-2 h-4 w-4" />Source Candidates</Button>
              </Link>
              <Link href="/interviews" passHref className="block">
                <Button variant="outline" className="w-full"><Activity className="mr-2 h-4 w-4" />AI Interview Analysis</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center text-lg"><DollarSign className="mr-2 h-5 w-5 text-primary" />Earnings Overview</CardTitle>
              <CardDescription className="text-xs italic">For independent recruiters or specific incentive programs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Earned (Last 30 Days)</p>
                  <p className="text-xl font-bold text-primary">${mockRecruiterEarnings.last30Days}</p>
              </div>
              <div className="p-3 border rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Next Payout</p>
                  <p className="text-lg font-semibold text-foreground">${mockRecruiterEarnings.nextPayout} <Badge variant="secondary" className="ml-1 text-xs">Pending</Badge></p>
              </div>
               <div className="p-3 border rounded-md bg-muted/40">
                  <p className="text-xs text-muted-foreground">Pending Referral Bonuses</p>
                  <p className="text-lg font-semibold text-foreground">{mockRecruiterEarnings.pendingReferralBonuses} <span className="text-xs">referrals</span></p>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-1" disabled>View Detailed Payouts</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
