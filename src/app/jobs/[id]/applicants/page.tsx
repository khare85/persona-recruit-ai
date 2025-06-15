
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Container } from '@/components/shared/Container';
import { Brain, Briefcase, CalendarDays, FileText, Loader2, Mail, MapPin, User, UsersRound, XSquare, CheckCircle, AlertTriangle } from 'lucide-react';
import { candidateJobMatcher, CandidateJobMatcherInput, CandidateJobMatcherOutput } from '@/ai/flows/candidate-job-matcher';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- Mock Data ---
// This would typically come from a database

const MOCK_JOB_LISTINGS_DATA = {
  '1': {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'Tech Solutions Inc.',
    companyDescription: 'Tech Solutions Inc. is a leading innovator in cloud-based software...',
    fullDescriptionForAI: `
      Job Title: Senior Frontend Engineer
      Company: Tech Solutions Inc.
      Location: Remote
      // ... (rest of the job description from job details page)
      Qualifications:
      - 5+ years of professional experience in frontend development...
      - Expert proficiency in JavaScript, HTML5, CSS3, React.js, Next.js.
      - Solid experience with TypeScript.
    `,
    // Add more fields if needed by the AI matcher or UI
  },
  '2': {
    id: '2',
    title: 'AI/ML Product Manager',
    company: 'FutureAI Corp.',
    companyDescription: 'FutureAI Corp. is at the forefront of AI innovation...',
    fullDescriptionForAI: `
        Job Title: AI/ML Product Manager
        // ... (full job description)
    `,
  }
};

const MOCK_APPLICANTS_DATA = [
  {
    id: 'cand1',
    jobId: '1',
    fullName: 'Bob The Builder',
    avatarUrl: 'https://placehold.co/100x100.png?a=2',
    currentTitle: 'Software Engineer',
    applicationDate: '2024-08-01',
    status: 'New',
    profileSummaryForAI: `Bob The Builder - Software Engineer. 3 years experience with React, Vue.js, and some Node.js. Interested in frontend roles. Good team player. Basic understanding of TypeScript. Completed several freelance projects.`,
    skills: ['React', 'Vue.js', 'JavaScript', 'HTML', 'CSS'],
  },
  {
    id: 'cand2',
    jobId: '1',
    fullName: 'Charlie Chaplin',
    avatarUrl: 'https://placehold.co/100x100.png?a=3',
    currentTitle: 'Senior Developer',
    applicationDate: '2024-08-02',
    status: 'Under Review',
    profileSummaryForAI: `Charlie Chaplin - Senior Developer. 7 years of full-stack experience with strong expertise in Next.js, TypeScript, GraphQL, and Python. Led small teams on several projects. AWS certified. Excellent problem-solver.`,
    skills: ['Next.js', 'TypeScript', 'GraphQL', 'Python', 'AWS', 'Team Lead'],
  },
  {
    id: 'cand3',
    jobId: '1',
    fullName: 'Diana Prince',
    avatarUrl: 'https://placehold.co/100x100.png?a=4',
    currentTitle: 'Frontend Developer',
    applicationDate: '2024-07-30',
    status: 'Interview Scheduled',
    profileSummaryForAI: `Diana Prince - Frontend Developer. 4 years experience focused on UI/UX driven development. Proficient in React, Next.js, and Figma. Strong eye for detail and user experience. Some experience with TypeScript.`,
    skills: ['React', 'Next.js', 'UI/UX', 'Figma', 'JavaScript'],
  },
];

// --- End Mock Data ---

interface Applicant extends Omit<typeof MOCK_APPLICANTS_DATA[0], 'jobId' | 'profileSummaryForAI'> {
  aiMatch?: CandidateJobMatcherOutput;
  isMatching?: boolean; // To show loader for individual AI match
  profileSummaryForAI: string; // Ensure this is always present
}

interface JobInfo {
  id: string;
  title: string;
  company: string;
  companyDescription: string;
  fullDescriptionForAI: string;
}

async function getJobAndApplicants(jobId: string): Promise<{ job: JobInfo | null; applicants: Applicant[] }> {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  
  const job = MOCK_JOB_LISTINGS_DATA[jobId as keyof typeof MOCK_JOB_LISTINGS_DATA] || null;
  if (!job) {
    return { job: null, applicants: [] };
  }

  const jobApplicants = MOCK_APPLICANTS_DATA
    .filter(app => app.jobId === jobId)
    .map(({ jobId, ...rest }) => ({ ...rest, isMatching: true } as Applicant)); // Set initial isMatching to true

  return { job, applicants: jobApplicants };
}


export default function JobApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobInfo | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      getJobAndApplicants(jobId)
        .then(async ({ job: fetchedJob, applicants: fetchedApplicants }) => {
          if (!fetchedJob) {
            setError("Job not found or no applicants for this job.");
            setJob(null);
            setApplicants([]);
            setIsLoading(false);
            return;
          }
          setJob(fetchedJob);
          setApplicants(fetchedApplicants); // Set applicants with isMatching: true
          setIsLoading(false);

          // Now, perform AI matching for each applicant
          const applicantsWithMatches: Applicant[] = await Promise.all(
            fetchedApplicants.map(async (applicant) => {
              try {
                const aiMatch = await candidateJobMatcher({
                  candidateProfile: applicant.profileSummaryForAI, // Use the AI-specific summary
                  jobDescription: fetchedJob.fullDescriptionForAI,
                  companyInformation: fetchedJob.companyDescription,
                });
                return { ...applicant, aiMatch, isMatching: false };
              } catch (e) {
                console.error(`Error matching candidate ${applicant.id}:`, e);
                return { ...applicant, aiMatch: undefined, isMatching: false }; // Handle individual errors
              }
            })
          );
          setApplicants(applicantsWithMatches);
        })
        .catch(err => {
          console.error("Failed to fetch job and applicants:", err);
          setError("Failed to load applicant data. Please try again.");
          setIsLoading(false);
        });
    }
  }, [jobId]);

  if (isLoading) {
    return (
      <Container className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading applicants and AI insights...</p>
      </Container>
    );
  }

  if (error && !job) {
     return (
      <Container className="text-center py-20">
        <XSquare className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive">{error}</h1>
        <Link href="/jobs" passHref>
          <Button variant="outline" className="mt-6">
            Back to Jobs
          </Button>
        </Link>
      </Container>
    );
  }
  
  if (!job) { // Should be caught by error state, but as a fallback
     return (
      <Container className="text-center py-20">
        <XSquare className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive">Job Not Found</h1>
        <Link href="/jobs" passHref>
          <Button variant="outline" className="mt-6">
            Back to Jobs
          </Button>
        </Link>
      </Container>
    );
  }


  return (
    <Container>
      <div className="mb-8">
        <Link href={`/jobs/${job.id}`} className="text-sm text-primary hover:underline flex items-center mb-2">
            &larr; Back to Job Details
        </Link>
        <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
          <UsersRound className="mr-3 h-8 w-8 text-primary" />
          Applicants for: {job.title}
        </h1>
        <p className="text-muted-foreground mt-1">
          Review candidates who have applied for the <span className="font-medium text-primary">{job.title}</span> role at <span className="font-medium">{job.company}</span>.
        </p>
      </div>

      {applicants.length === 0 && !isLoading && (
         <Card className="py-12">
            <CardContent className="text-center">
                <UsersRound className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground">No Applicants Yet</h3>
                <p className="text-muted-foreground mt-1">There are currently no applicants for this job posting.</p>
            </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {applicants.map((applicant) => (
          <Card key={applicant.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border">
                    <AvatarImage src={applicant.avatarUrl} alt={applicant.fullName} data-ai-hint="applicant profile" />
                    <AvatarFallback>{applicant.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl hover:text-primary transition-colors">
                      <Link href={`/candidates/${applicant.id}`}>{applicant.fullName}</Link>
                    </CardTitle>
                    <CardDescription className="text-sm">{applicant.currentTitle}</CardDescription>
                     <div className="mt-1 text-xs text-muted-foreground">
                        Applied: {new Date(applicant.applicationDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Badge variant={applicant.status === 'New' ? 'default' : applicant.status === 'Interview Scheduled' ? 'outline' : 'secondary'} className="whitespace-nowrap self-start sm:self-center">
                  {applicant.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <Separator />
              <div className="pt-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-primary" /> AI Match Analysis
                </h4>
                {applicant.isMatching ? (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating AI insights...
                  </div>
                ) : applicant.aiMatch ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Progress value={applicant.aiMatch.matchScore * 100} className="h-2.5 flex-1" />
                      <span className="text-sm font-bold text-primary">
                        {(applicant.aiMatch.matchScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-md border italic leading-relaxed">
                      {applicant.aiMatch.justification}
                    </p>
                  </div>
                ) : (
                  <Alert variant="default" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>AI Analysis Not Available</AlertTitle>
                    <AlertDescription className="text-xs">
                      Could not generate AI matching insights for this candidate at the moment.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              {applicant.skills && applicant.skills.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Top Skills:</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {applicant.skills.slice(0,5).map(skill => <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>)}
                        {applicant.skills.length > 5 && <Badge variant="outline" className="text-xs">+{applicant.skills.length - 5} more</Badge>}
                    </div>
                </div>
              )}

            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Link href={`/candidates/${applicant.id}`} passHref>
                <Button variant="outline" size="sm">
                  <User className="mr-2 h-4 w-4" /> View Full Profile
                </Button>
              </Link>
              <Button size="sm">
                 <Mail className="mr-2 h-4 w-4" /> Contact Candidate
              </Button>
              {/* Placeholder for actions like 'Schedule Interview', 'Reject', etc. */}
            </CardFooter>
          </Card>
        ))}
      </div>
    </Container>
  );
}
