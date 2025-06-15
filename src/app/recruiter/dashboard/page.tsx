
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Briefcase, PlusCircle, Users, BarChart3, MailQuestion, DollarSign, Activity } from 'lucide-react';
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
          Manage your job postings, applicants, earnings, and AI-powered recruitment tools.
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
              View All Jobs
            </CardTitle>
            <CardDescription>
              Browse and manage all active and archived job listings you are working on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/jobs" passHref>
              <Button variant="outline" className="w-full">Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Users className="mr-3 h-6 w-6 text-primary" />
              Manage Applicants
            </CardTitle>
            <CardDescription>
              View candidate applications for jobs you've posted, AI match scores, and interview reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* This would ideally link to a page listing jobs they manage, then to applicants for each job */}
            <Button disabled className="w-full">View Your Applicants</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <DollarSign className="mr-3 h-6 w-6 text-accent" />
              My Earnings & Payouts
            </CardTitle>
            <CardDescription>
              Track your commissions from successful placements and referral bonuses.
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
              Interview Insights
            </CardTitle>
            <CardDescription>
              Access AI-generated reports from candidate video interviews you've initiated.
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
              Track your placement success rates, time-to-fill, and candidate pipeline effectiveness.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">View Your Analytics</Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

