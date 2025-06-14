
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Users, DollarSign, CalendarDays, Info, CheckSquare, XSquare } from 'lucide-react';
import { Container } from '@/components/shared/Container';
import Link from 'next/link';
import Image from 'next/image';
import { candidateJobMatcher } from '@/ai/flows/candidate-job-matcher';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

// Mock job data - in a real app, this would come from a database or API
const MOCK_JOB = {
  id: '1',
  title: 'Senior Frontend Engineer',
  company: 'Tech Solutions Inc.',
  companyLogo: 'https://placehold.co/100x100.png',
  companyDescription: 'Tech Solutions Inc. is a leading innovator in cloud-based software, committed to delivering cutting-edge solutions that empower businesses globally. We foster a collaborative and inclusive work environment where creativity and growth are encouraged.',
  location: 'Remote',
  type: 'Full-time',
  salary: '$120,000 - $150,000 per year',
  postedDate: '2024-07-28',
  responsibilities: [
    'Develop and maintain user-facing features using React.js and Next.js.',
    'Build reusable components and front-end libraries for future use.',
    'Translate designs and wireframes into high-quality code.',
    'Optimize components for maximum performance across a vast array of web-capable devices and browsers.',
    'Collaborate with product managers, designers, and backend engineers to deliver high-quality products.',
    'Participate in code reviews and contribute to a culture of quality and continuous improvement.',
  ],
  qualifications: [
    '5+ years of experience in frontend development.',
    'Proficient in React, Next.js, TypeScript, and Tailwind CSS.',
    'Strong understanding of web performance optimization and accessibility best practices.',
    'Experience with state management libraries (e.g., Redux, Zustand).',
    'Familiarity with RESTful APIs and modern authorization mechanisms.',
    'Excellent problem-solving skills and attention to detail.',
    'Bachelor\'s degree in Computer Science or related field (or equivalent experience).',
  ],
  benefits: [
    'Competitive salary and stock options.',
    'Comprehensive health, dental, and vision insurance.',
    'Generous paid time off and holidays.',
    '401(k) plan with company match.',
    'Remote work flexibility.',
    'Professional development budget.',
  ],
};

// Mock candidate profile for AI matching demo
const MOCK_CANDIDATE_PROFILE = `
Name: Jane Doe
Experience: 6 years as a Frontend Developer. Proficient in React, Angular, Vue.js, Next.js, TypeScript, JavaScript, HTML, CSS.
Previous Roles:
- Senior Frontend Developer at WebWorks LLC (3 years): Led development of a large-scale e-commerce platform using React and Redux.
- Frontend Developer at Appify Inc. (3 years): Developed and maintained UI components for various client projects.
Skills: React, Next.js, TypeScript, Redux, Zustand, GraphQL, REST APIs, Web Performance, Accessibility, Agile, Git.
Education: M.S. in Computer Science from Stanford University.
Projects: Contributed to open-source UI library "FeatherUI". Built a personal portfolio website with Next.js and Sanity CMS.
Preferences: Seeking a challenging remote role in a fast-paced environment with opportunities for growth.
`;

async function getJobDetails(id: string) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 50));
  if (id === MOCK_JOB.id) {
    // Simulate AI matching
    try {
        const jobDescriptionForMatcher = `
            Title: ${MOCK_JOB.title}
            Location: ${MOCK_JOB.location}
            Type: ${MOCK_JOB.type}
            Responsibilities: ${MOCK_JOB.responsibilities.join(', ')}
            Qualifications: ${MOCK_JOB.qualifications.join(', ')}
        `;
        const matchResult = await candidateJobMatcher({ candidateProfile: MOCK_CANDIDATE_PROFILE, jobDescription: jobDescriptionForMatcher });
        return { ...MOCK_JOB, aiMatch: matchResult };
    } catch (error) {
        console.error("AI Matching Error:", error);
        return { ...MOCK_JOB, aiMatch: null };
    }
  }
  return null;
}


export default async function JobDetailsPage({ params }: { params: { id: string } }) {
  const job = await getJobDetails(params.id);

  if (!job) {
    return (
      <Container className="text-center py-20">
        <XSquare className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive">Job Not Found</h1>
        <p className="text-muted-foreground mt-2">The job you are looking for does not exist or may have been removed.</p>
        <Link href="/jobs" passHref>
          <Button variant="outline" className="mt-6">
            Back to Jobs
          </Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Job Details Column */}
        <div className="md:col-span-2 space-y-8">
          <Card className="shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-headline font-bold text-primary">{job.title}</h1>
                  <Link href="#" className="text-lg text-foreground hover:underline">{job.company}</Link>
                </div>
                <Image src={job.companyLogo} alt={`${job.company} logo`} width={80} height={80} className="rounded-md border" data-ai-hint="company logo" />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground pt-2">
                <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-primary/80" /> {job.location}</span>
                <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1 text-primary/80" /> {job.type}</span>
                <span className="flex items-center"><DollarSign className="h-4 w-4 mr-1 text-primary/80" /> {job.salary}</span>
                <span className="flex items-center"><CalendarDays className="h-4 w-4 mr-1 text-primary/80" /> Posted: {new Date(job.postedDate).toLocaleDateString()}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none text-foreground/90">
                <h2 className="text-xl font-semibold mb-3 text-foreground">About {job.company}</h2>
                <p className="mb-6">{job.companyDescription}</p>
                
                <h2 className="text-xl font-semibold mb-3 text-foreground">Job Description</h2>
                <p className="mb-6">We are seeking a talented and passionate {job.title} to join our dynamic team. In this role, you will be responsible for...</p>

                <h3 className="text-lg font-semibold mt-6 mb-2 text-foreground">Key Responsibilities:</h3>
                <ul className="list-disc pl-5 space-y-1 mb-6">
                  {job.responsibilities.map((item, index) => <li key={index}>{item}</li>)}
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-2 text-foreground">Qualifications:</h3>
                <ul className="list-disc pl-5 space-y-1 mb-6">
                  {job.qualifications.map((item, index) => <li key={index}>{item}</li>)}
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
            <CardContent>
              <Button size="lg" className="w-full">Apply Now</Button>
              <Button variant="outline" className="w-full mt-3">Save Job</Button>
            </CardContent>
          </Card>

          {job.aiMatch && (
            <Card className="shadow-lg bg-accent/10 border-accent">
              <CardHeader>
                <CardTitle className="text-xl flex items-center text-accent-foreground">
                  <Info className="h-6 w-6 mr-2 text-accent" /> AI Match Analysis
                </CardTitle>
                <CardDescription className="text-accent-foreground/80">
                  Based on a sample candidate profile. Your actual match may vary.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-accent-foreground/90">Match Score:</Label>
                  <div className="flex items-center mt-1">
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="bg-accent h-2.5 rounded-full" 
                        style={{ width: `${job.aiMatch.matchScore * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm font-semibold text-accent">{ (job.aiMatch.matchScore * 100).toFixed(0) }%</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-accent-foreground/90">Justification:</Label>
                  <p className="text-xs text-accent-foreground/80 mt-1 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">
                    {job.aiMatch.justification}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                 <p className="text-xs text-accent-foreground/70">This is an AI-generated assessment for demonstration purposes.</p>
              </CardFooter>
            </Card>
          )}

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
