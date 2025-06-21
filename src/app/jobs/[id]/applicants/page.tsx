import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Container } from '@/components/shared/Container';
import { ArrowLeft, Star, Mail, Phone, MapPin, Briefcase, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { getMockJob, getMockApplicantsForJob, type MockCandidate, type MockJob } from '@/services/mockDataService';
import { candidateJobMatcher } from '@/ai/flows/candidate-job-matcher';

interface ApplicantWithScore extends MockCandidate {
  matchScore: number;
  matchJustification: string;
}

async function getJobWithApplicants(jobId: string): Promise<{ job: MockJob | null; applicants: ApplicantWithScore[] }> {
  const job = getMockJob(jobId);
  if (!job) {
    return { job: null, applicants: [] };
  }

  const candidates = getMockApplicantsForJob(jobId);
  const jobDescription = `
    Title: ${job.title}
    Location: ${job.location}
    Type: ${job.jobType}
    Department: ${job.department}
    Experience Level: ${job.experienceLevel}
    Requirements: ${job.requirements.join(', ')}
    Responsibilities: ${job.responsibilities.join(', ')}
    Description: ${job.description}
  `;

  // Calculate AI match scores for each candidate
  const applicantsWithScores: ApplicantWithScore[] = [];
  
  for (const candidate of candidates) {
    try {
      const candidateProfile = `
        Name: ${candidate.fullName}
        Current Title: ${candidate.currentTitle}
        Experience: ${candidate.experience} years
        Location: ${candidate.location}
        Skills: ${candidate.skills.join(', ')}
        Education: ${candidate.education}
        Previous Companies: ${candidate.previousCompanies.join(', ')}
        Summary: ${candidate.summary}
        Expected Salary: ${candidate.expectedSalary}
        Availability: ${candidate.availability}
        Languages: ${candidate.languages.join(', ')}
        Certifications: ${candidate.certifications.join(', ')}
      `;

      const matchResult = await candidateJobMatcher({
        candidateProfile,
        jobDescription
      });

      applicantsWithScores.push({
        ...candidate,
        matchScore: matchResult.matchScore,
        matchJustification: matchResult.justification
      });
    } catch (error) {
      console.error(`Error calculating match for candidate ${candidate.id}:`, error);
      // Fallback to pre-calculated score or default
      applicantsWithScores.push({
        ...candidate,
        matchScore: candidate.aiMatchScore || 0.75,
        matchJustification: "AI matching temporarily unavailable - showing estimated score based on skills and experience."
      });
    }
  }

  // Sort by match score descending
  applicantsWithScores.sort((a, b) => b.matchScore - a.matchScore);

  return { job, applicants: applicantsWithScores };
}

export default async function JobApplicantsPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const { job, applicants } = await getJobWithApplicants(id);

  if (!job) {
    return (
      <Container className="text-center py-20">
        <h1 className="text-3xl font-bold text-destructive">Job Not Found</h1>
        <p className="text-muted-foreground mt-2">The job you are looking for does not exist.</p>
        <Link href="/jobs" passHref>
          <Button variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href={`/jobs/${job.id}`} passHref>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Job Details
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-headline font-bold text-foreground">
            Applicants for {job.title}
          </h1>
          <p className="text-muted-foreground">
            {job.companyName} • {applicants.length} applicants
          </p>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="mb-2">
            {job.status === 'active' ? 'Active' : 'Closed'}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Posted: {new Date(job.postedDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Applicants Table */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Candidate Applications</CardTitle>
          <CardDescription>
            AI-powered matching scores help you identify the best candidates quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Candidate</TableHead>
                <TableHead className="w-[120px]">Match Score</TableHead>
                <TableHead className="w-[150px]">Experience</TableHead>
                <TableHead className="w-[150px]">Location</TableHead>
                <TableHead className="w-[150px]">Availability</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicants.map((applicant) => (
                <TableRow key={applicant.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={applicant.profilePictureUrl} alt={applicant.fullName} />
                        <AvatarFallback>
                          {applicant.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{applicant.fullName}</div>
                        <div className="text-sm text-muted-foreground">{applicant.currentTitle}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {applicant.skills.slice(0, 3).map(skill => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {applicant.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{applicant.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={applicant.matchScore * 100} 
                          className="flex-1 h-2"
                        />
                        <span className="text-sm font-medium">
                          {Math.round(applicant.matchScore * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center">
                        {applicant.matchScore >= 0.9 && (
                          <Badge variant="default" className="text-xs">Excellent Match</Badge>
                        )}
                        {applicant.matchScore >= 0.8 && applicant.matchScore < 0.9 && (
                          <Badge variant="secondary" className="text-xs">Good Match</Badge>
                        )}
                        {applicant.matchScore >= 0.7 && applicant.matchScore < 0.8 && (
                          <Badge variant="outline" className="text-xs">Fair Match</Badge>
                        )}
                        {applicant.matchScore < 0.7 && (
                          <Badge variant="destructive" className="text-xs">Poor Match</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{applicant.experience} years</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {applicant.previousCompanies.slice(0, 2).join(', ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{applicant.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {applicant.availability}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {applicant.expectedSalary}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/candidates/${applicant.id}`} passHref>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {applicants.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No applicants found for this job.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Matching Insights */}
      {applicants.length > 0 && (
        <Card className="mt-8 shadow-lg bg-accent/5 border-accent">
          <CardHeader>
            <CardTitle className="text-xl flex items-center text-accent-foreground">
              <Star className="mr-2 h-5 w-5 text-accent" />
              AI Matching Insights
            </CardTitle>
            <CardDescription>
              Top candidate recommendation based on AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applicants[0] && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={applicants[0].profilePictureUrl} alt={applicants[0].fullName} />
                    <AvatarFallback>
                      {applicants[0].fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{applicants[0].fullName}</h3>
                    <p className="text-muted-foreground">{applicants[0].currentTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={applicants[0].matchScore * 100} className="w-32 h-2" />
                      <span className="text-sm font-medium">
                        {Math.round(applicants[0].matchScore * 100)}% match
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-background/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">AI Analysis:</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {applicants[0].matchJustification}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/candidates/${applicants[0].id}`} passHref>
                    <Button>
                      View Full Profile
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline">
                    Schedule Interview
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
}