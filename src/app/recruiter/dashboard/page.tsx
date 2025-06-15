
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Briefcase, PlusCircle, Users, BarChart3, MailQuestion } from 'lucide-react';
import Link from 'next/link';

export default function RecruiterDashboardPage() {
  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground">
          Recruiter Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your job postings, applicants, and AI-powered recruitment tools.
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
              Browse and manage all active and archived job listings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/jobs" passHref>
              <Button variant="outline" className="w-full">Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Users className="mr-3 h-6 w-6 text-primary" />
              Manage Applicants (Coming Soon)
            </CardTitle>
            <CardDescription>
              View candidate applications, AI match scores, and interview reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled className="w-full">View Applicants</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="mr-3 h-6 w-6 text-accent" />
              Analytics & Reports (Coming Soon)
            </CardTitle>
            <CardDescription>
              Track recruitment KPIs, time-to-hire, and source effectiveness.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">View Analytics</Button>
          </CardContent>
        </Card>

         <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <MailQuestion className="mr-3 h-6 w-6 text-accent" />
              Interview Insights (Coming Soon)
            </CardTitle>
            <CardDescription>
              Access AI-generated reports from candidate video interviews.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Link href="/interviews" passHref>
                <Button variant="outline" className="w-full">Go to Interview Analysis</Button>
             </Link>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
