'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, Clock, MapPin, Building2, Video, CheckCircle, XCircle, AlertCircle, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
// Mock data removed - implement real interview fetching
import { format } from 'date-fns';

export default function MyInterviewsPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInterviews() {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`/api/interviews?candidateId=${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch interviews');
        }
        const result = await response.json();
        setInterviews(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchInterviews();
  }, [user?.id]);
  
  // Group interviews by status
  const upcomingInterviews = interviews.filter(i => 
    i.status === 'scheduled' || i.status === 'pending' || i.status === 'confirmed'
  );
  const completedInterviews = interviews.filter(i => i.status === 'completed');
  const cancelledInterviews = interviews.filter(i => i.status === 'cancelled');

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch(normalizedStatus) {
      case 'scheduled':
      case 'confirmed':
        return <CalendarDays className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch(normalizedStatus) {
      case 'scheduled':
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Container className="max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your interviews...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="max-w-6xl">
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Error Loading Interviews</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-6xl">
      <div className="mb-8">
        <Link href="/candidates/dashboard" passHref>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-headline font-bold text-foreground">My Interviews</h1>
        <p className="text-muted-foreground">Track and manage all your interview schedules and results</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{upcomingInterviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedInterviews.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">With Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {completedInterviews.filter(i => i.analysisId).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <CalendarDays className="mr-2 h-5 w-5 text-primary" />
              Upcoming Interviews
            </CardTitle>
            <CardDescription>Your scheduled interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company & Position</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingInterviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{interview.jobTitle}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {interview.companyName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center">
                          <CalendarDays className="h-3 w-3 mr-1 text-muted-foreground" />
                          {format(new Date(interview.date), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(interview.date), 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(interview.status) as any} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(interview.status)}
                        {interview.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link 
                          href={`/interview/consent?id=${interview.id}&candidate=${encodeURIComponent('Sarah Johnson')}&position=${encodeURIComponent(interview.jobTitle)}&company=${encodeURIComponent(interview.companyName)}&duration=30`}
                          target="_blank"
                        >
                          <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                            <Video className="h-4 w-4 mr-1" />
                            Join AI Interview
                          </Button>
                        </Link>
                        <Link href={`/jobs/${interview.jobId}`} passHref>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Completed Interviews */}
      {completedInterviews.length > 0 && (
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              Completed Interviews
            </CardTitle>
            <CardDescription>View your interview history and analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company & Position</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Analysis</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedInterviews.map((interview) => {
                  const analysis = undefined; // TODO: Implement real interview analysis fetching
                  return (
                    <TableRow key={interview.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{interview.jobTitle}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {interview.companyName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CalendarDays className="h-3 w-3 mr-1 text-muted-foreground" />
                          {format(new Date(interview.date), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {analysis ? (
                          <div>
                            <Badge className="bg-green-100 text-green-800">
                              Score: {analysis.overallScore}/100
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {analysis.recommendation}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No analysis</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {analysis ? (
                          <Link href={`/interviews/analysis/${interview.analysisId}`} passHref>
                            <Button variant="outline" size="sm">
                              View Analysis
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="ghost" size="sm" disabled>
                            No Analysis
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Interviews */}
      {cancelledInterviews.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <XCircle className="mr-2 h-5 w-5 text-destructive" />
              Cancelled Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company & Position</TableHead>
                  <TableHead>Original Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancelledInterviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{interview.jobTitle}</div>
                        <div className="text-sm text-muted-foreground">{interview.companyName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(interview.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <XCircle className="h-3 w-3" />
                        Cancelled
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {interviews.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No interviews scheduled yet.</p>
            <Link href="/jobs" passHref>
              <Button className="mt-4">Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}