
'use server';

import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Users, DollarSign, CalendarDays, Info, CheckSquare, XSquare, Bookmark, ArrowLeft } from 'lucide-react';
import { Container } from '@/components/shared/Container';
import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { QuickApplyButton } from '@/components/jobs/QuickApplyButton';
import { databaseService } from '@/services/database.service';

async function getJobDetails(id: string) {
  try {
    const job = await databaseService.getJobById(id);
    if (!job) return null;
    
    // Simulate fetching company details
    const company = await databaseService.getCompanyById(job.companyId);
    
    return { 
      ...job, 
      companyName: company?.name || 'A Company',
      companyLogo: company?.logo || 'https://placehold.co/100x100.png',
      companyDescription: company?.description || 'A leading company in its industry.',
    };
  } catch (error) {
    console.error(`Error fetching job ${id}:`, error);
    return null;
  }
}

export default async function JobDetailsPage({ params }: { params: { id: string } }) {
  const job = await getJobDetails(params.id);

  if (!job) {
    notFound();
  }

  return (
    <Container className="max-w-5xl mx-auto">
      <div className="mb-4">
        <Link href="/jobs" passHref>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Jobs
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Job Details Column */}
        <div className="md:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-headline font-bold text-primary">{job.title}</h1>
                  <Link href="#" className="text-lg text-foreground hover:underline">{job.companyName}</Link>
                </div>
                <Image src={job.companyLogo} alt={`${job.companyName} logo`} width={80} height={80} className="rounded-md border" data-ai-hint="company logo" />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground pt-2">
                <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-primary/80" /> {job.location}</span>
                <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1 text-primary/80" /> {job.type}</span>
                {job.salaryRange && <span className="flex items-center"><DollarSign className="h-4 w-4 mr-1 text-primary/80" /> {job.salaryRange}</span>}
                <span className="flex items-center"><CalendarDays className="h-4 w-4 mr-1 text-primary/80" /> Posted: {new Date(job.postedDate).toLocaleDateString()}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none text-foreground/90">
                <h2 className="text-xl font-semibold mb-3 text-foreground">About {job.companyName}</h2>
                <p className="mb-6">{job.companyDescription}</p>
                
                <h2 className="text-xl font-semibold mb-3 text-foreground">Job Description</h2>
                <p className="mb-6">{job.description}</p>

                <h3 className="text-lg font-semibold mt-6 mb-2 text-foreground">Key Responsibilities:</h3>
                <ul className="list-disc pl-5 space-y-1 mb-6">
                  {job.responsibilities.map((item, index) => <li key={index}>{item}</li>)}
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-2 text-foreground">Qualifications:</h3>
                <ul className="list-disc pl-5 space-y-1 mb-6">
                  {job.requirements.map((item, index) => <li key={index}>{item}</li>)}
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-2 text-foreground">Benefits:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {job.benefits.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Apply Button and AI Match */}
        <div className="space-y-6">
          <Card className="shadow-lg sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl">Ready to Apply?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickApplyButton 
                jobId={job.id}
                jobTitle={job.title}
                companyName={job.companyName}
                className="w-full"
              />
              <Button size="lg" variant="secondary" className="w-full">
                Apply with Resume
              </Button>
              <Button variant="outline" className="w-full">
                <Bookmark className="mr-2 h-4 w-4" />
                Save Job
              </Button>
              <Separator className="my-3" />
              <Link href={`/jobs/${job.id}/applicants`} passHref>
                <Button variant="ghost" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  View Applicants
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg">Share this Job</CardTitle>
            </CardHeader>
            <CardContent className="flex space-x-2">
                <Button variant="outline" size="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </Button>
                <Button variant="outline" size="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                </Button>
                <Button variant="outline" size="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
