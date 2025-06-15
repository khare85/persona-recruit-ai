
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CalendarDays, GraduationCap, Linkedin, Link as LinkIcon, Mail, MapPin, Phone, Star, Video, FileText, Edit3, Download, Brain, Lightbulb, Search, Gift, Edit } from 'lucide-react';
import { Container } from '@/components/shared/Container';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { jobRecommendationSemantic, JobRecommendationSemanticOutput } from '@/ai/flows/job-recommendation-semantic-flow';

// Mock candidate data - in a real app, this would come from a database or API
const MOCK_CANDIDATE = {
  id: '1',
  fullName: 'Alice Wonderland',
  profilePictureUrl: 'https://placehold.co/150x150.png?a=1', // Updated from avatarUrl
  currentTitle: 'Senior Software Engineer',
  location: 'Remote (Wonderland, CA)',
  email: 'alice.w@example.com',
  phone: '(555) 123-4567',
  linkedinProfile: 'https://linkedin.com/in/alicewonderland',
  portfolioUrl: 'https://alicew.dev',
  experienceSummary: "Highly skilled and innovative Senior Software Engineer with 8+ years of experience...",
  aiGeneratedSummary: "Alice Wonderland is a seasoned Senior Software Engineer with over eight years of expertise...",
  skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'System Design', 'Agile Methodologies'],
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'Tech Solutions Inc.',
      period: 'Jan 2020 - Present',
      description: 'Led a team of 5 engineers...',
      logo: 'https://placehold.co/50x50.png?c=tech'
    },
    {
      title: 'Software Engineer',
      company: 'Innovate LLC',
      period: 'Jun 2016 - Dec 2019',
      description: 'Developed and maintained features...',
      logo: 'https://placehold.co/50x50.png?c=innovate'
    },
  ],
  education: [
    { degree: 'M.S. in Computer Science', institution: 'Wonderland University', period: '2014 - 2016' },
    { degree: 'B.S. in Software Engineering', institution: 'Tech State College', period: '2010 - 2014' },
  ],
  certifications: [
    { name: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services', date: '2021' },
    { name: 'Certified Kubernetes Administrator (CKA)', issuer: 'Cloud Native Computing Foundation', date: '2022' },
  ],
  videoIntroductionUrl: 'https://placehold.co/320x180.mp4', // Updated from videoIntroUrl
  resumeFileUrl: '#mock-resume-link', // New field for resume download
  referredBy: 'Bob The Builder (Employee ID: EMP456)',
};

interface EnrichedCandidate extends Omit<typeof MOCK_CANDIDATE, 'skills' | 'profilePictureUrl' | 'videoIntroductionUrl' | 'resumeFileUrl' | 'aiGeneratedSummary' | 'referredBy'> {
  skills: string[];
  profilePictureUrl?: string | null;
  videoIntroductionUrl?: string | null;
  resumeFileUrl?: string | null;
  aiGeneratedSummary?: string | null;
  jobRecommendations: JobRecommendationSemanticOutput | null;
  referredBy?: string | null;
}


async function getCandidateDetails(id: string): Promise<EnrichedCandidate | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  if (id === MOCK_CANDIDATE.id) {
    let recommendations: JobRecommendationSemanticOutput | null = null;
    try {
      const candidateProfileForAI = `${MOCK_CANDIDATE.currentTitle}. ${MOCK_CANDIDATE.aiGeneratedSummary || MOCK_CANDIDATE.experienceSummary}. Skills: ${MOCK_CANDIDATE.skills.join(', ')}`;
      recommendations = await jobRecommendationSemantic({ candidateProfileText: candidateProfileForAI, resultCount: 5 });
    } catch (error) {
      console.error("Error fetching job recommendations:", error);
    }

    return { 
      ...MOCK_CANDIDATE,
      skills: MOCK_CANDIDATE.skills || [],
      profilePictureUrl: MOCK_CANDIDATE.profilePictureUrl,
      videoIntroductionUrl: MOCK_CANDIDATE.videoIntroductionUrl,
      resumeFileUrl: MOCK_CANDIDATE.resumeFileUrl,
      aiGeneratedSummary: MOCK_CANDIDATE.aiGeneratedSummary || null,
      jobRecommendations: recommendations,
      referredBy: MOCK_CANDIDATE.referredBy || null,
    };
  }
  return null;
}

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
  const candidate = await getCandidateDetails(params.id);

  if (!candidate) {
    return (
      <Container className="text-center py-20">
        <h1 className="text-3xl font-bold text-destructive">Candidate Not Found</h1>
        <Link href="/candidates"><Button variant="outline" className="mt-6">Back to Candidates</Button></Link>
      </Container>
    );
  }
  
  const displaySummary = candidate.aiGeneratedSummary || candidate.experienceSummary;

  return (
    <Container className="max-w-5xl mx-auto">
      <Card className="shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/80 to-accent/80 p-8 relative">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-lg">
              <AvatarImage src={candidate.profilePictureUrl || undefined} alt={candidate.fullName} data-ai-hint="profile person" />
              <AvatarFallback className="text-5xl bg-background text-primary">{candidate.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left pt-2 text-primary-foreground">
              <h1 className="text-3xl md:text-4xl font-headline font-bold">{candidate.fullName}</h1>
              <p className="text-xl md:text-2xl font-medium opacity-90">{candidate.currentTitle}</p>
              <div className="flex items-center justify-center md:justify-start text-sm opacity-80 mt-1"><MapPin className="h-4 w-4 mr-1.5" /> {candidate.location}</div>
               {candidate.referredBy && (<div className="flex items-center justify-center md:justify-start text-xs opacity-80 mt-2 bg-black/20 p-1.5 rounded-md max-w-xs mx-auto md:mx-0"><Gift className="h-3.5 w-3.5 mr-1.5 text-amber-300" /> Referred by: {candidate.referredBy}</div>)}
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                {candidate.linkedinProfile && (<Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-white/20"><a href={candidate.linkedinProfile} target="_blank" rel="noopener noreferrer"><Linkedin className="h-4 w-4 mr-1.5" /> LinkedIn</a></Button>)}
                {candidate.portfolioUrl && (<Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-white/20"><a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer"><LinkIcon className="h-4 w-4 mr-1.5" /> Portfolio</a></Button>)}
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <Link href={`/candidates/${candidate.id}/edit`} passHref><Button variant="secondary" size="sm"><Edit3 className="h-4 w-4 mr-2" /> Edit Profile</Button></Link>
          </div>
        </div>

        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <Card><CardHeader><CardTitle className="text-lg">Contact Info</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
                  <div className="flex items-center"><Mail className="h-4 w-4 mr-2 text-primary" /> {candidate.email}</div>
                  {candidate.phone && <div className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary" /> {candidate.phone}</div>}
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-lg flex items-center"><Brain className="h-5 w-5 mr-2 text-primary" />AI Skills</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{candidate.skills.map(skill => <Badge key={skill} variant="default">{skill}</Badge>)}</CardContent><CardFooter className="text-xs text-muted-foreground pt-2">Skills from resume.</CardFooter></Card>
              <Card><CardHeader><CardTitle className="text-lg">Resume</CardTitle></CardHeader><CardContent>
                  {candidate.resumeFileUrl && candidate.resumeFileUrl !== "#mock-resume-link" ? (
                    <Button asChild variant="outline" className="w-full"><a href={candidate.resumeFileUrl} target="_blank" rel="noopener noreferrer" download={`${candidate.fullName}_Resume`}><Download className="h-4 w-4 mr-2" /> Download Resume</a></Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled><Download className="h-4 w-4 mr-2" /> Resume N/A</Button>
                  )}
              </CardContent></Card>
            </div>

            <div className="md:col-span-2 space-y-8">
              <Card><CardHeader>
                  <CardTitle className="text-xl flex items-center">{candidate.aiGeneratedSummary ? <Edit className="h-5 w-5 mr-2 text-blue-500" /> : null}Professional Summary</CardTitle>
                  {candidate.aiGeneratedSummary && (<CardDescription className="text-xs italic text-blue-600">AI-generated based on resume.</CardDescription>)}
              </CardHeader><CardContent><p className="text-foreground/80 leading-relaxed prose prose-sm max-w-none dark:prose-invert">{displaySummary}</p></CardContent></Card>

              {candidate.jobRecommendations && candidate.jobRecommendations.recommendedJobs.length > 0 && (
                <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-primary/30"><CardHeader>
                    <CardTitle className="text-xl flex items-center"><Lightbulb className="h-6 w-6 mr-2 text-primary" />AI Job Recommendations</CardTitle>
                    <CardDescription>Based on semantic similarity to your profile.</CardDescription>
                </CardHeader><CardContent className="space-y-3">
                    <div className="space-y-3">{candidate.jobRecommendations.recommendedJobs.map((job, index) => (
                        <div key={job.jobId || index} className="border rounded-lg p-3 bg-background/50">
                          <div className="flex justify-between items-start mb-1"><h4 className="font-semibold text-foreground">{job.title}</h4>{job.matchScore && (<Badge variant="secondary" className="text-xs">{(job.matchScore * 100).toFixed(0)}% Match</Badge>)}</div>
                          <p className="text-sm text-primary font-medium">{job.companyName}</p>
                          {job.location && (<p className="text-xs text-muted-foreground mt-1">📍 {job.location}</p>)}
                        </div>))}
                    </div>
                    {candidate.jobRecommendations.reasoning && (<div><h4 className="font-semibold text-sm mt-3 mb-1">Why these roles?</h4><p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md border">{candidate.jobRecommendations.reasoning}</p></div>)}
                </CardContent><CardFooter className="text-xs text-muted-foreground italic">Explore <Link href="/jobs" className="text-primary hover:underline">all jobs</Link>.</CardFooter></Card>
              )}

              <Card><CardHeader><CardTitle className="text-xl">Video Introduction (10s)</CardTitle></CardHeader><CardContent>
                  {candidate.videoIntroductionUrl && candidate.videoIntroductionUrl !== "https://placehold.co/320x180.mp4" ? (
                     <div className="aspect-video bg-muted rounded-md overflow-hidden">
                        <video controls src={candidate.videoIntroductionUrl} className="w-full h-full object-cover" poster={`https://placehold.co/320x180.png?text=${encodeURIComponent(candidate.fullName)}`} data-ai-hint="interview video">Your browser does not support videos.</video>
                     </div>
                  ) : ( <p className="text-muted-foreground">No video introduction uploaded or placeholder used.</p> )}
              </CardContent></Card>

              <Card><CardHeader><CardTitle className="text-xl">Experience</CardTitle></CardHeader><CardContent className="space-y-6">{candidate.experience.map((exp, index) => (
                    <div key={index} className="flex gap-4"><Avatar className="mt-1 h-10 w-10 border"><AvatarImage src={exp.logo} alt={`${exp.company} logo`} data-ai-hint="company logo" /><AvatarFallback>{exp.company.substring(0,1)}</AvatarFallback></Avatar>
                      <div><h3 className="font-semibold text-md">{exp.title}</h3><p className="text-sm text-primary">{exp.company}</p><p className="text-xs text-muted-foreground">{exp.period}</p><p className="mt-1 text-sm text-foreground/80">{exp.description}</p></div>
                    </div>))}
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-xl">Education</CardTitle></CardHeader><CardContent className="space-y-4">{candidate.education.map((edu, index) => (
                    <div key={index}><h3 className="font-semibold text-md">{edu.degree}</h3><p className="text-sm text-muted-foreground">{edu.institution}</p><p className="text-xs text-muted-foreground">{edu.period}</p></div>))}
              </CardContent></Card>
              {candidate.certifications.length > 0 && (
                <Card><CardHeader><CardTitle className="text-xl">Certifications</CardTitle></CardHeader><CardContent className="space-y-3">{candidate.certifications.map((cert, index) => (
                      <div key={index}><h3 className="font-semibold text-md">{cert.name}</h3><p className="text-sm text-muted-foreground">{cert.issuer} - {cert.date}</p></div>))}
                </CardContent></Card>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 md:p-8 border-t flex justify-end">
            <Link href="/jobs"><Button variant="default" size="lg"><Search className="h-4 w-4 mr-2" /> Find Matching Jobs</Button></Link>
        </CardFooter>
      </Card>
    </Container>
  );
}
