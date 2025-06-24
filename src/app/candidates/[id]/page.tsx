
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  GraduationCap, 
  Linkedin, 
  Link as LinkIcon, 
  Mail, 
  MapPin, 
  Phone, 
  Star, 
  Video, 
  Download, 
  Edit3, 
  Calendar,
  DollarSign,
  Globe,
  Award,
  Play,
  FileText,
  Building2,
  Clock
} from 'lucide-react';
import { Container } from '@/components/shared/Container';
import Link from 'next/link';
import { InterviewTimeline, type InterviewTimelineItem } from '@/components/interviews/InterviewTimeline';
import { Loader2 } from 'lucide-react';

export default function CandidateProfilePage({ params }: { params: { id: string } }) {
  const [candidate, setCandidate] = useState<any>(null);
  const [timelineItems, setTimelineItems] = useState<InterviewTimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCandidateData() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/candidates/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setCandidate(data.data);
          
          const interviews = data.data.interviews || [];
          const timeline: InterviewTimelineItem[] = interviews.map((interview: any) => ({
            id: interview.id,
            date: interview.scheduledDate,
            jobTitle: interview.jobTitle,
            companyName: 'TechCorp Inc.', // Placeholder, would need to fetch
            status: interview.status,
            analysisId: interview.analysisId,
            type: interview.type,
            duration: interview.duration
          }));
          setTimelineItems(timeline);
        } else {
          setCandidate(null);
        }
      } catch (error) {
        console.error('Failed to fetch candidate data', error);
        setCandidate(null);
      } finally {
        setIsLoading(false);
      }
    }

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

  return (
    <Container className="max-w-7xl mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Header Card */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary/80 to-accent/80 p-6 relative">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-lg">
                  <AvatarImage src={candidate.profilePictureUrl || undefined} alt={candidate.fullName} />
                  <AvatarFallback className="text-3xl bg-background text-primary">
                    {candidate.fullName.split(' ').map((n:string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left text-primary-foreground">
                  <h1 className="text-2xl md:text-3xl font-bold">{candidate.fullName}</h1>
                  <p className="text-lg md:text-xl opacity-90">{candidate.currentTitle}</p>
                  <div className="flex items-center justify-center md:justify-start text-sm opacity-80 mt-1">
                    <MapPin className="h-4 w-4 mr-1.5" /> {candidate.location}
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
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
                <Button variant="secondary" size="sm">
                  <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              </div>
            </div>
          </Card>

          {/* Contact & Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{candidate.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{candidate.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{candidate.location}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Experience</span>
                  <span className="text-sm font-medium">{candidate.experience} years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">AI Match Score</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary rounded-full h-1.5 w-16 overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${candidate.aiMatchScore || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {candidate.aiMatchScore || 0}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Availability</span>
                  <Badge variant="outline" className="text-xs">
                    {candidate.availability}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Introduction Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Introduction
              </CardTitle>
              <CardDescription>
                {candidate.videoIntroductionUrl ? 'Watch the candidate\'s video introduction' : 'No video introduction available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {candidate.videoIntroductionUrl ? (
                <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                  <video 
                    controls 
                    className="w-full h-full object-cover"
                    poster="https://placehold.co/640x360/e2e8f0/64748b?text=Video+Introduction"
                  >
                    <source src={candidate.videoIntroductionUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No video introduction available</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Video className="h-4 w-4 mr-2" />
                      Request Video Introduction
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Professional Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{candidate.summary}</p>
            </CardContent>
          </Card>

          {/* Skills & Expertise */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                Skills & Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Work Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{candidate.currentTitle}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {candidate.previousCompanies[0] || 'Current Company'}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4" />
                        {candidate.experience} years total experience
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Previous Companies:</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.previousCompanies.map((company: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {company}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education & Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education & Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Education</h4>
                <p className="text-sm text-muted-foreground">{candidate.education}</p>
              </div>
              {candidate.certifications.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.certifications.map((cert: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Expected Salary</span>
                </div>
                <p className="text-sm">{candidate.expectedSalary}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Availability</span>
                </div>
                <p className="text-sm">{candidate.availability}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Languages</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {candidate.languages.map((lang: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="flex-1 md:flex-initial">
                  <Star className="h-4 w-4 mr-2" /> Consider for Job
                </Button>
                <Button variant="outline" size="lg" className="flex-1 md:flex-initial">
                  <Download className="h-4 w-4 mr-2" /> Download Resume
                </Button>
                <Button variant="outline" size="lg" className="flex-1 md:flex-initial">
                  <Mail className="h-4 w-4 mr-2" /> Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Side */}
        <div className="lg:col-span-1 space-y-6">
          {/* Interview Timeline Sidebar */}
          <InterviewTimelineSidebar interviews={timelineItems} />

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Interview
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View Documents
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Star className="h-4 w-4 mr-2" />
                Add to Favorites
              </Button>
            </CardContent>
          </Card>

          {/* Match Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Match Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3">
                <div className="relative inline-flex items-center justify-center w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-muted stroke-current"
                      strokeDasharray="100, 100"
                      strokeWidth="2"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-primary stroke-current"
                      strokeDasharray={`${candidate.aiMatchScore || 0}, 100`}
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-lg font-bold">
                    {candidate.aiMatchScore || 0}%
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">Overall Match Score</p>
                  <p className="text-xs text-muted-foreground">
                    Based on skills, experience, and requirements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
