
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Briefcase, PlusCircle, Users, BarChart3, MailQuestion, DollarSign, Activity, Search, SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function RecruiterDashboardPage() {
  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground">
          Recruiter Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your job postings, source candidates, track applicants, and oversee your earnings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <PlusCircle className="mr-3 h-6 w-6 text-primary" />
              Post a New Job
            </CardTitle>
            <CardDescription>
              Create and publish new job openings. Use AI to help craft compelling descriptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/jobs/new" passHref>
              <Button className="w-full">Create Job Posting</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Briefcase className="mr-3 h-6 w-6 text-primary" />
              Manage Jobs
            </CardTitle>
            <CardDescription>
              View active job listings, edit details, and see applicant counts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/jobs" passHref> 
              <Button variant="outline" className="w-full">View Your Job Postings</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Search className="mr-3 h-6 w-6 text-primary" />
              Source Candidates
            </CardTitle>
            <CardDescription>
              Browse the Persona Recruit AI candidate database to find potential fits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/candidates" passHref>
              <Button variant="outline" className="w-full">Browse Candidate Profiles</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <DollarSign className="mr-3 h-6 w-6 text-accent" />
              My Earnings & Payouts
            </CardTitle>
            <CardDescription>
              Track commissions from successful placements and referral bonuses.
              <span className="block text-xs mt-1 italic"> (Primarily for independent recruiters or specific programs)</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground">Total Earned (Last 30 Days)</p>
                <p className="text-2xl font-bold text-accent-foreground">$1,250.00</p>
            </div>
             <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground">Next Payout Amount</p>
                <p className="text-xl font-semibold text-accent-foreground">$800.00 <Badge variant="outline" className="ml-1 text-xs">Scheduled</Badge></p>
            </div>
            <Button variant="outline" className="w-full" disabled>View Detailed Earnings Report</Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <MailQuestion className="mr-3 h-6 w-6 text-accent" />
              Interview AI Reports
            </CardTitle>
            <CardDescription>
              Access AI-generated reports from candidate video interviews you manage or have access to.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Link href="/interviews" passHref>
                <Button variant="outline" className="w-full">Go to Interview Analysis</Button>
             </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="mr-3 h-6 w-6 text-accent" />
              Performance Analytics (Coming Soon)
            </CardTitle>
            <CardDescription>
              Track placement success, time-to-fill, and candidate pipeline effectiveness.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">View Your Analytics</Button>
          </CardContent>
        </Card>
      </div>

      {/* Conceptual area for managing applicants - directs to job list first */}
       <Card className="mt-10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center">
                <Users className="mr-3 h-7 w-7 text-primary" />
                Applicant Tracking
            </CardTitle>
            <CardDescription>
                Review candidates who have applied to your job postings. Select a job from "Manage Jobs" to view its applicants and their AI match scores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/jobs" passHref>
                <Button className="w-full md:w-auto">View Jobs to Select Applicants</Button>
            </Link>
          </CardContent>
        </Card>

    </Container>
  );
}
