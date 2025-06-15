
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Building, Briefcase, Settings, Users, ExternalLink, MessageSquarePlus } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const mockRecruiters = [
  { id: 'rec1', name: 'TechRecruit Pro', specialty: 'Software Engineering, AI/ML', successRate: 92, avatar: 'https://placehold.co/50x50.png?text=TR' },
  { id: 'rec2', name: 'SalesGurus Inc.', specialty: 'Sales, Business Development', successRate: 88, avatar: 'https://placehold.co/50x50.png?text=SG' },
  { id: 'rec3', name: 'DesignFinders', specialty: 'UX/UI Design, Creative Roles', successRate: 95, avatar: 'https://placehold.co/50x50.png?text=DF' },
];

export default function CompanyDashboardPage() {
  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
          <Building className="mr-3 h-8 w-8 text-primary" />
          Company Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your company's recruitment activities, branding, and talent pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Briefcase className="mr-3 h-6 w-6 text-primary" />
              Manage Job Postings
            </CardTitle>
            <CardDescription>
              View, edit, or create new job postings for your company. Track applicants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/jobs" passHref>
              <Button className="w-full">View All Company Jobs</Button>
            </Link>
            <Link href="/jobs/new" passHref>
              <Button variant="outline" className="w-full">Post a New Job</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <ExternalLink className="mr-3 h-6 w-6 text-primary" />
              Your Company Job Board
            </CardTitle>
            <CardDescription>
              Access and share your dedicated job board featuring only your company's vacancies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/company/portal" passHref>
              <Button className="w-full">View Your Job Board</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Settings className="mr-3 h-6 w-6 text-primary" />
              Branding & Settings
            </CardTitle>
            <CardDescription>
              Customize the look and feel, integrate with your systems, and manage company users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/company/settings" passHref>
              <Button variant="outline" className="w-full">Go to Company Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-headline flex items-center">
                    <Users className="mr-3 h-7 w-7 text-accent" />
                    Connect with Top Independent Recruiters
                </CardTitle>
                <CardDescription>
                    AI Talent Stream can suggest high-performing independent recruiters who specialize in roles you're hiring for. Invite them to help fill your vacancies and expand your reach.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {mockRecruiters.map(recruiter => (
                        <Card key={recruiter.id} className="flex items-center justify-between p-4 bg-muted/30">
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={recruiter.avatar} alt={recruiter.name} data-ai-hint="recruiter avatar" />
                                    <AvatarFallback>{recruiter.name.substring(0,1)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold text-md">{recruiter.name}</h4>
                                    <p className="text-xs text-muted-foreground">Specialty: {recruiter.specialty}</p>
                                     <Badge variant="secondary" className="text-xs mt-1">Success: {recruiter.successRate}%</Badge>
                                </div>
                            </div>
                            <Button variant="default" size="sm">
                                <MessageSquarePlus className="mr-2 h-4 w-4" />
                                Invite to Job
                            </Button>
                        </Card>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground italic">
                    This feature helps you tap into a wider network of specialized recruiters. AI will help identify the best matches for your specific needs.
                </p>
            </CardFooter>
        </Card>
      </div>
    </Container>
  );
}
