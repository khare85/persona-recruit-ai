
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { CalendarClock, Video, Zap, Users, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Mock data for interviews
const mockInterviews = [
  { 
    id: 'interview1', 
    jobTitle: 'Senior Frontend Engineer', 
    company: 'Tech Solutions Inc.', 
    type: 'AI-Assisted Video Interview', 
    date: '2024-08-15', 
    time: '10:00 AM PST', 
    status: 'Pending',
    platformLink: '/live-interview/1/1' // Mock link to AI interview page for job 1, candidate 1
  },
  { 
    id: 'interview2', 
    jobTitle: 'Product Manager', 
    company: 'FutureAI Corp.', 
    type: 'Hiring Manager Interview', 
    date: '2024-08-18', 
    time: '02:30 PM EST', 
    status: 'Scheduled',
    platform: 'Google Meet',
    platformLink: 'https://meet.google.com/sample-link'
  },
  { 
    id: 'interview3', 
    jobTitle: 'UX Designer', 
    company: 'Creative Designs Co.', 
    type: 'Portfolio Review', 
    date: '2024-08-10', 
    time: '11:00 AM CET', 
    status: 'Completed',
    platform: 'Zoom',
    platformLink: '#'
  },
   { 
    id: 'interview4', 
    jobTitle: 'Data Scientist', 
    company: 'Innovatech', 
    type: 'Technical Assessment', 
    date: '2024-08-20', 
    time: 'Flexible (Complete by EOD)', 
    status: 'Pending Assignment',
    platform: 'Online Platform',
    platformLink: '#'
  },
];

export default function CandidateInterviewsPage() {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pending assignment':
        return 'outline';
      case 'scheduled':
        return 'default';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };
   const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pending assignment':
        return <AlertTriangle className="mr-1 h-3 w-3 text-amber-500" />;
      case 'scheduled':
        return <CalendarClock className="mr-1 h-3 w-3 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="mr-1 h-3 w-3 text-green-500" />;
      default:
        return null;
    }
  };


  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
          <CalendarClock className="mr-3 h-8 w-8 text-primary" />
          My Interviews
        </h1>
        <p className="text-muted-foreground mt-1">
          Keep track of your upcoming and past interview sessions.
        </p>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">Interview Schedule & History</CardTitle>
          <CardDescription>View details and links for your scheduled interviews. Completed interviews are also listed.</CardDescription>
        </CardHeader>
        <CardContent>
          {mockInterviews.length > 0 ? (
            <div className="space-y-6">
              {mockInterviews.map((interview) => (
                <Card key={interview.id} className="p-4 sm:p-6 bg-muted/30 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-primary">{interview.jobTitle}</h3>
                      <p className="text-md text-foreground">{interview.company}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Type: {interview.type}
                      </p>
                       <p className="text-sm text-muted-foreground">
                        Date & Time: {interview.date} at {interview.time}
                      </p>
                       {interview.platform && interview.type !== 'AI-Assisted Video Interview' && (
                         <p className="text-sm text-muted-foreground">Platform: {interview.platform}</p>
                       )}
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                       <Badge variant={getStatusVariant(interview.status)} className="flex items-center self-start sm:self-end">
                        {getStatusIcon(interview.status)}
                        {interview.status}
                      </Badge>
                      {interview.status === 'Pending' && interview.type === 'AI-Assisted Video Interview' && (
                        <Link href={interview.platformLink || '#'} passHref>
                          <Button size="sm" className="w-full sm:w-auto">
                            <Video className="mr-2 h-4 w-4" /> Start AI Interview
                          </Button>
                        </Link>
                      )}
                       {interview.status === 'Scheduled' && interview.platformLink && interview.type !== 'AI-Assisted Video Interview' && (
                        <a href={interview.platformLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                            <Button size="sm" variant="outline" className="w-full">
                                <ExternalLink className="mr-2 h-4 w-4" /> Join Interview
                            </Button>
                        </a>
                      )}
                       {interview.status === 'Completed' && (
                        <Button size="sm" variant="ghost" disabled className="text-muted-foreground w-full sm:w-auto justify-start sm:justify-center">
                            Interview Completed
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
               <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">You have no interviews scheduled or completed yet.</p>
               <Link href="/jobs" passHref>
                    <Button variant="default" className="mt-4">Find Jobs to Apply</Button>
               </Link>
            </div>
          )}
        </CardContent>
         <CardFooter className="text-xs text-muted-foreground">
            For AI interviews, ensure you are in a quiet, well-lit environment. For other interviews, test your link and setup beforehand.
        </CardFooter>
      </Card>
       <div className="mt-8 text-center">
        <Link href="/candidates/dashboard" passHref>
            <Button variant="outline">&larr; Back to Dashboard</Button>
        </Link>
      </div>
    </Container>
  );
}
