
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Users, DollarSign, CalendarDays, Info, CheckSquare, XSquare, ThumbsUp, Brain, FileText, Search } from 'lucide-react';
import { Container } from '@/components/shared/Container';
import Link from 'next/link';
import Image from 'next/image';
import { candidateJobMatcher, CandidateJobMatcherOutput } from '@/ai/flows/candidate-job-matcher';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

// Mock job data - in a real app, this would come from a database or API
const MOCK_JOB_DETAILS = {
  id: '1',
  title: 'Senior Frontend Engineer',
  company: 'Tech Solutions Inc.',
  companyLogo: 'https://placehold.co/100x100.png?b=ts', // Unique placeholder
  companyDescription: 'Tech Solutions Inc. is a leading innovator in cloud-based software, committed to delivering cutting-edge solutions that empower businesses globally. We foster a collaborative and inclusive work environment where creativity and growth are encouraged. Our core values include innovation, customer obsession, and teamwork.',
  location: 'Remote',
  type: 'Full-time',
  salary: '$120,000 - $150,000 per year',
  postedDate: '2024-07-28',
  fullDescriptionForAI: `
    Job Title: Senior Frontend Engineer
    Company: Tech Solutions Inc.
    Location: Remote
    Job Type: Full-time
    Salary: $120,000 - $150,000 per year

    About Tech Solutions Inc.:
    Tech Solutions Inc. is a leading innovator in cloud-based software, committed to delivering cutting-edge solutions that empower businesses globally. We foster a collaborative and inclusive work environment where creativity and growth are encouraged. Our core values include innovation, customer obsession, and teamwork.

    Role Overview:
    We are seeking a talented and passionate Senior Frontend Engineer to join our dynamic team. In this role, you will be a key player in designing, developing, and maintaining the user interfaces for our flagship products. You will work closely with UX designers, product managers, and backend engineers to create seamless and intuitive user experiences.

    Key Responsibilities:
    - Develop and maintain user-facing features using React.js, Next.js, and TypeScript.
    - Build reusable components and front-end libraries for future use, ensuring code quality and maintainability.
    - Translate designs, wireframes, and product specifications into high-quality, responsive code.
    - Optimize components and applications for maximum performance, scalability, and accessibility across a vast array of web-capable devices and browsers.
    - Collaborate effectively with cross-functional teams in an agile environment to deliver high-quality products.
    - Participate actively in code reviews, providing constructive feedback and contributing to a culture of quality and continuous improvement.
    - Mentor junior engineers and contribute to team growth and knowledge sharing.
    - Stay up-to-date with emerging frontend technologies and best practices.

    Qualifications:
    - 5+ years of professional experience in frontend development, with a strong portfolio of projects.
    - Expert proficiency in JavaScript, HTML5, CSS3, and modern JavaScript frameworks/libraries, particularly React.js and Next.js.
    - Solid experience with TypeScript and its application in large-scale projects.
    - Experience with state management libraries (e.g., Redux, Zustand, Context API).
    - Strong understanding of web performance optimization techniques and accessibility (WCAG) best practices.
    - Familiarity with RESTful APIs, GraphQL, and modern authorization mechanisms (e.g., JWT, OAuth).
    - Proficient with version control systems like Git and agile development methodologies.
    - Excellent problem-solving skills, strong attention to detail, and a passion for creating exceptional user experiences.
    - Bachelor’s degree in Computer Science, Software Engineering, or a related field (or equivalent practical experience).

    Benefits:
    - Competitive salary and stock options.
    - Comprehensive health, dental, and vision insurance.
    - Generous paid time off (PTO) and company holidays.
    - 401(k) plan with company match.
    - Remote work flexibility and a supportive virtual team environment.
    - Professional development budget for conferences, courses, and certifications.
    - Opportunity to work on impactful projects with cutting-edge technology.
  `,
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
  ],
  benefits: [
    'Competitive salary and stock options.',
    'Comprehensive health, dental, and vision insurance.',
    'Remote work flexibility.',
  ],
};

const MOCK_CANDIDATE_PROFILE = `
Candidate Name: Alice Wonderland
Current Title: Senior Software Engineer
Contact: alice.w@example.com | (555) 123-4567
LinkedIn: linkedin.com/in/alicewonderland | Portfolio: alicew.dev

Summary:
Highly skilled and innovative Senior Software Engineer with 8+ years of experience in developing and implementing cutting-edge web applications. Proven ability to lead projects, mentor junior developers, and collaborate effectively in agile environments. Passionate about creating intuitive user experiences and leveraging new technologies to solve complex problems. Seeking a challenging remote role where I can contribute to meaningful projects and continue to grow professionally. Prefers companies with strong engineering culture and focus on work-life balance.

Skills:
React, Next.js, TypeScript, JavaScript (ES6+), Node.js, Python, HTML5, CSS3/SASS, Tailwind CSS, Styled Components, GraphQL, REST APIs, WebSockets, Zustand, Redux, Webpack, Babel, Jest, React Testing Library, Cypress, Docker, Kubernetes, AWS (EC2, S3, Lambda, API Gateway), CI/CD (Jenkins, GitLab CI), Agile Methodologies, Scrum, System Design, Microservices, Web Performance Optimization, Accessibility (WCAG).

Experience:
1. Senior Software Engineer | WonderTech Solutions | Jan 2020 - Present
   - Led a team of 5 engineers in developing a new SaaS platform using Next.js, TypeScript, and AWS serverless architecture.
   - Architected and implemented core features, including a real-time collaboration module and a complex data visualization dashboard.
   - Improved application performance by 30% through code optimization and lazy loading strategies.
   - Implemented CI/CD pipelines using GitLab CI, reducing deployment time by 40%.
   - Mentored junior developers, conducted code reviews, and fostered a culture of high-quality engineering.

2. Software Engineer | Innovate LLC | Jun 2016 - Dec 2019
   - Developed and maintained features for a large-scale e-commerce application (React, Redux).
   - Contributed to migrating legacy AngularJS code to a modern React-based architecture.
   - Integrated third-party APIs for payment processing and shipping logistics.
   - Wrote unit and integration tests, improving code coverage by 20%.

Education:
- M.S. in Computer Science | Wonderland University | 2014 - 2016
- B.S. in Software Engineering | Tech State College | 2010 - 2014

Projects:
- Personal Portfolio (Next.js, Sanity CMS): Developed a dynamic personal website to showcase projects.
- Open-Source Contributor to "FeatherUI": Contributed components and bug fixes to a popular React UI library.

Certifications:
- AWS Certified Solutions Architect – Associate (2021)
- Certified Kubernetes Administrator (CKA) (2022)
`;

interface JobDetails extends Omit<typeof MOCK_JOB_DETAILS, 'fullDescriptionForAI'> {
  aiMatch: CandidateJobMatcherOutput | null;
  displayDescription: string;
}

async function getJobDetails(id: string): Promise<JobDetails | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  if (id === MOCK_JOB_DETAILS.id) {
    let aiMatchResult: CandidateJobMatcherOutput | null = null;
    try {
        aiMatchResult = await candidateJobMatcher({ 
            candidateProfile: MOCK_CANDIDATE_PROFILE, 
            jobDescription: MOCK_JOB_DETAILS.fullDescriptionForAI,
            companyInformation: MOCK_JOB_DETAILS.companyDescription // Pass company description here
        });
    } catch (error) {
        console.error("AI Matching Error:", error);
    }
    
    const { fullDescriptionForAI, ...restOfJobDetails } = MOCK_JOB_DETAILS;

    return { 
        ...restOfJobDetails, 
        aiMatch: aiMatchResult,
        displayDescription: fullDescriptionForAI 
    };
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
              <div className="prose prose-sm max-w-none text-foreground/90 dark:prose-invert">
                <h2 className="text-xl font-semibold mb-3 text-foreground">About {job.company}</h2>
                <p className="mb-6">{job.companyDescription}</p>
                
                <h2 className="text-xl font-semibold mb-3 text-foreground">Job Description</h2>
                <p className="mb-6">We are seeking a talented and passionate {job.title} to join our dynamic team. You will be responsible for designing, developing, and maintaining high-quality software solutions.</p>

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

        <div className="space-y-6">
          <Card className="shadow-lg sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl">Ready to Apply?</CardTitle>
            </CardHeader>
            <CardContent>
              <Button size="lg" className="w-full"> <ThumbsUp className="mr-2"/> Apply Now</Button>
              <Button variant="outline" className="w-full mt-3">Save Job</Button>
            </CardContent>
          </Card>

          {job.aiMatch ? (
            <Card className="shadow-lg bg-gradient-to-br from-accent/10 to-primary/10 border-accent">
              <CardHeader>
                <CardTitle className="text-xl flex items-center text-primary">
                  <Brain className="h-6 w-6 mr-2" /> AI Match Analysis
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  For: <span className="font-medium">Mock Candidate (Alice W.)</span>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="matchScore" className="text-sm font-medium text-foreground">Match Score:</Label>
                  <div className="flex items-center mt-1 gap-2">
                    <Progress value={job.aiMatch.matchScore * 100} id="matchScore" className="h-3" />
                    <span className="text-sm font-semibold text-primary">
                        { (job.aiMatch.matchScore * 100).toFixed(0) }%
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground">AI Justification:</Label>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed bg-muted/50 p-3 rounded-md border">
                    {job.aiMatch.justification}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                 <p className="text-xs text-muted-foreground/70 italic">AI assessment for demo. Actual match may vary.</p>
              </CardFooter>
            </Card>
          ) : (
             <Card className="shadow-lg border-dashed">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center text-muted-foreground">
                        <Brain className="h-6 w-6 mr-2" /> AI Match Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">AI matching analysis could not be performed for this job.</p>
                </CardContent>
             </Card>
          )}

          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg">Share this Job</CardTitle>
            </CardHeader>
            <CardContent className="flex space-x-2">
                <Button variant="outline" size="icon" aria-label="Share on Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </Button>
                <Button variant="outline" size="icon" aria-label="Share on Twitter">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                </Button>
                <Button variant="outline" size="icon" aria-label="Share on LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </Button>
                 <Button variant="outline" size="icon" aria-label="Share via Email">
                    <FileText className="h-4 w-4"/>
                </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </Container>
  );
}
