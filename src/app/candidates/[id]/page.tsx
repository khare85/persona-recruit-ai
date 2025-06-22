'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CalendarDays, GraduationCap, Linkedin, Link as LinkIcon, Mail, MapPin, Phone, Star, Video, FileText, Edit3, Download, Clock, History } from 'lucide-react';
import { Container } from '@/components/shared/Container';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InterviewTimeline, type InterviewTimelineItem } from '@/components/interviews/InterviewTimeline';
import { getMockCandidate, getMockInterviewsForCandidate, type MockCandidate, type MockInterview } from '@/services/mockDataService';
import { Loader2 } from 'lucide-react';

export default function CandidateProfilePage({ params }: { params: { id: string } }) {
  const [candidate, setCandidate] = useState<MockCandidate | null>(null);
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCandidateData = async () => {
      setIsLoading(true);
      
      // Get the candidate data
      const candidateData = getMockCandidate(params.id);
      if (candidateData) {
        setCandidate(candidateData);
        
        // Get the candidate's interview history
        const candidateInterviews = getMockInterviewsForCandidate(params.id);
        setInterviews(candidateInterviews);
      }
      
      setIsLoading(false);
    };

    loadCandidateData();
  }, [params.id]);

  if (isLoading) {
    return (
      <Container className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </Container>
    );
  }

  if (!candidate) {
    return (
      <Container className="text-center py-20">
        <h1 className="text-3xl font-bold">Candidate Not Found</h1>
        <p className="text-muted-foreground mt-2">The candidate you are looking for does not exist.</p>
        <Link href="/candidates" passHref>
          <Button variant="outline" className="mt-6">
            Back to Candidates
          </Button>
        </Link>
      </Container>
    );
  }

  // Transform interviews to timeline items
  const timelineItems: InterviewTimelineItem[] = interviews.map(interview => ({
    id: interview.id,
    date: interview.date,
    jobTitle: interview.jobTitle,
    companyName: interview.companyName,
    status: interview.status,
    analysisId: interview.analysisId,
    type: interview.type,
    duration: interview.duration
  }));

  return (
    <Container className="max-w-5xl mx-auto">
      <Card className="shadow-xl overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary/80 to-accent/80 p-8 relative">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-lg">
              <AvatarImage src={candidate.profilePictureUrl || undefined} alt={candidate.fullName} />
              <AvatarFallback className="text-5xl bg-background text-primary">
                {candidate.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left pt-2 text-primary-foreground">
              <h1 className="text-3xl md:text-4xl font-headline font-bold">{candidate.fullName}</h1>
              <p className="text-xl md:text-2xl font-medium opacity-90">{candidate.currentTitle}</p>
              <div className="flex items-center justify-center md:justify-start text-sm opacity-80 mt-1">
                <MapPin className="h-4 w-4 mr-1.5" /> {candidate.location}
              </div>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                {candidate.linkedinProfile && (
                  <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-white/20">
                    <a href={candidate.linkedinProfile} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4 mr-1.5" /> LinkedIn
                    </a>
                  </Button>
                )}
                {candidate.portfolioUrl && (
                  <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-white/20">
                    <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="h-4 w-4 mr-1.5" /> Portfolio
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <Button variant="secondary" size="sm"><Edit3 className="h-4 w-4 mr-2" /> Edit Profile</Button>
          </div>
        </div>

        <CardContent className="p-6 md:p-8">
          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{candidate.phone}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="my-8">
            <h2 className="text-xl font-semibold mb-4">Professional Summary</h2>
            <p className="text-muted-foreground leading-relaxed">{candidate.summary}</p>
          </div>

          <Separator />

          {/* Interview Timeline */}
          <div className="my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Interview History
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {interviews.length} interview{interviews.length !== 1 ? 's' : ''} on record
                </p>
              </div>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {interviews.filter(i => i.status === 'Scheduled').length} upcoming
              </Badge>
            </div>
            <InterviewTimeline interviews={timelineItems} />
          </div>

          <Separator />

          {/* Skills */}
          <div className="my-8">
            <h2 className="text-xl font-semibold mb-4">Skills & Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Experience */}
          <div className="my-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Work Experience
            </h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{candidate.currentTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {candidate.previousCompanies[0] || 'Current Company'} • {candidate.experience} years total experience
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Previous Companies:</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.previousCompanies.map((company, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {company}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Education & Certifications */}
          <div className="my-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education & Certifications
            </h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium">{candidate.education}</p>
              </div>
              {candidate.certifications.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Certifications:</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="my-8">
            <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected Salary</p>
                <p className="font-medium">{candidate.expectedSalary}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Availability</p>
                <p className="font-medium">{candidate.availability}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Languages</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {candidate.languages.map((lang, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Match Score</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(candidate.aiMatchScore || 0) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round((candidate.aiMatchScore || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-6 md:p-8 border-t flex justify-end gap-3">
          <Button variant="outline" size="lg">
            <Download className="h-4 w-4 mr-2" /> Download Resume
          </Button>
          <Button variant="default" size="lg">
            <Star className="h-4 w-4 mr-2" /> Consider for Job
          </Button>
        </CardFooter>
      </Card>
    </Container>
  );
}