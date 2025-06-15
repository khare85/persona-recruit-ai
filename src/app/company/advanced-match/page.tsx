
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Container } from '@/components/shared/Container';
import { useToast } from '@/hooks/use-toast';
import { advancedCandidateJobMatching, AdvancedCandidateJobMatchingInput, AdvancedCandidateJobMatchingOutput } from '@/ai/flows/advanced-candidate-job-matching-flow';
import { Loader2, SearchCheck, Users, Brain, Sparkles, CheckCircle, Info, ChevronRight, ListChecks, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

// Mock Job IDs for selection - these correspond to keys in MOCK_JOB_DETAILS_FOR_FLOW in advanced-candidate-job-matching-flow.ts
const MOCK_JOB_IDS = [
  { id: 'job1', title: 'Senior Software Engineer (Example Job)' },
  // Add more mock job IDs here if defined in the flow
];

const advancedMatchSchema = z.object({
  jobId: z.string().optional(),
  jobDescriptionText: z.string().optional(),
  companyInformation: z.string().optional(),
  semanticSearchResultCount: z.coerce.number().min(5).max(50).default(20),
  finalResultCount: z.coerce.number().min(1).max(10).default(5),
}).superRefine((data, ctx) => {
  if (!data.jobId && (!data.jobDescriptionText || !data.companyInformation)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either select a Job ID or provide both Job Description and Company Information.",
      path: ["jobDescriptionText"], 
    });
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either select a Job ID or provide both Job Description and Company Information.",
      path: ["companyInformation"],
    });
  }
  if (data.jobId && (data.jobDescriptionText || data.companyInformation)) {
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "If Job ID is selected, Job Description and Company Information should be left blank (they will be fetched or mocked).",
      path: ["jobId"],
    });
  }
});

type AdvancedMatchFormValues = z.infer<typeof advancedMatchSchema>;

export default function AdvancedCandidateMatchingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<AdvancedCandidateJobMatchingOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<AdvancedMatchFormValues>({
    resolver: zodResolver(advancedMatchSchema),
    defaultValues: {
      jobId: '',
      jobDescriptionText: '',
      companyInformation: '',
      semanticSearchResultCount: 20,
      finalResultCount: 5,
    },
  });

  async function onSubmit(data: AdvancedMatchFormValues) {
    setIsLoading(true);
    setSearchResult(null);

    try {
      const input: AdvancedCandidateJobMatchingInput = {
        jobId: data.jobId || undefined, // Ensure undefined if empty string
        jobDescriptionText: data.jobDescriptionText || undefined,
        companyInformation: data.companyInformation || undefined,
        semanticSearchResultCount: data.semanticSearchResultCount,
        finalResultCount: data.finalResultCount,
      };
      
      const result = await advancedCandidateJobMatching(input);
      setSearchResult(result);
      toast({
        title: "Advanced Match Complete!",
        description: result.searchSummary || "AI has found and re-ranked potential candidates.",
        action: <CheckCircle className="text-green-500" />,
      });

    } catch (error) {
      console.error("Error performing advanced candidate match:", error);
      toast({
        variant: "destructive",
        title: "Matching Failed",
        description: error instanceof Error ? error.message : "Could not perform the advanced match. Please check your input or try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Container>
      <Card className="max-w-5xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <SearchCheck className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-headline">Advanced Candidate Matching</CardTitle>
          <CardDescription>
            Leverage multi-stage AI: Semantic search followed by LLM re-ranking to find top talent for your job.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8">
              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>How it Works</AlertTitle>
                <AlertDescription>
                  1. Provide job details (select a Job ID or enter description/company info). <br />
                  2. AI performs a broad semantic search for initial candidates. <br />
                  3. Top semantic matches are then re-ranked by a detailed LLM analysis for deeper fit.
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="jobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option 1: Select Existing Job (Uses Mock Data)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={!!form.watch("jobDescriptionText") || !!form.watch("companyInformation")}>
                          <SelectValue placeholder="Select a Job ID (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None (Enter details below)</SelectItem>
                        {MOCK_JOB_IDS.map(job => (
                          <SelectItem key={job.id} value={job.id}>{job.title} (ID: {job.id})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>If selected, Job Description and Company Info below will be ignored.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />
              <p className="text-sm text-center text-muted-foreground font-semibold">OR</p>
              
              <FormField
                control={form.control}
                name="jobDescriptionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option 2: Enter Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full job description text here..."
                        className="min-h-[150px] text-sm"
                        {...field}
                        disabled={!!form.watch("jobId")}
                      />
                    </FormControl>
                     <FormDescription>Required if Job ID is not selected.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyInformation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option 2: Enter Company Information</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide details about the company culture, values, team, etc."
                        className="min-h-[100px] text-sm"
                        {...field}
                        disabled={!!form.watch("jobId")}
                      />
                    </FormControl>
                    <FormDescription>Required if Job ID is not selected. Helps with cultural fit assessment.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="semanticSearchResultCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Semantic Matches</FormLabel>
                      <FormControl><Input type="number" min="5" max="50" {...field} /></FormControl>
                      <FormDescription>Number of candidates for initial semantic search (5-50).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="finalResultCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Final Re-ranked Results</FormLabel>
                      <FormControl><Input type="number" min="1" max="10" {...field} /></FormControl>
                      <FormDescription>Number of top candidates to display after LLM re-ranking (1-10).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4 pt-6">
              <Button type="submit" disabled={isLoading} size="lg" className="w-full md:w-1/2">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                Find & Re-rank Candidates
              </Button>
            </CardFooter>
          </form>
        </Form>

        {searchResult && (
          <div className="px-6 py-8 border-t mt-8">
            <h2 className="text-2xl font-headline font-semibold mb-2 flex items-center">
                <ListChecks className="mr-3 h-7 w-7 text-primary" /> AI Re-ranked Candidate Matches
            </h2>
            {searchResult.jobTitleUsed && (
                <p className="text-md text-muted-foreground mb-1">For Job: <span className="font-semibold text-foreground">{searchResult.jobTitleUsed}</span></p>
            )}
            <p className="text-sm text-muted-foreground mb-6">{searchResult.searchSummary}</p>
            
            {searchResult.rerankedCandidates.length > 0 ? (
                <div className="space-y-6">
                {searchResult.rerankedCandidates.map((candidate) => (
                    <Card key={candidate.candidateId} className="shadow-md hover:shadow-lg transition-shadow bg-card">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-xl">{candidate.fullName}</CardTitle>
                        <Badge variant="secondary" className="text-sm whitespace-nowrap flex items-center">
                            <ThumbsUp className="h-4 w-4 mr-1.5 text-green-500"/> {(candidate.llmMatchScore * 100).toFixed(0)}% LLM Match
                        </Badge>
                        </div>
                        <CardDescription>{candidate.currentTitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {typeof candidate.semanticMatchScore === 'number' && (
                           <div className="text-xs text-muted-foreground">
                             Initial Semantic Score: <Badge variant="outline" className="text-xs">{(candidate.semanticMatchScore * 100).toFixed(0)}%</Badge>
                           </div>
                        )}
                        <Progress value={candidate.llmMatchScore * 100} className="h-2" />
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-0.5 flex items-center">
                                <Brain className="h-3.5 w-3.5 mr-1 text-primary/80"/> LLM Justification:
                            </h4>
                            <p className="text-xs text-foreground/80 bg-muted/30 p-2 rounded-md border italic leading-relaxed">
                                {candidate.llmJustification}
                            </p>
                        </div>
                        {candidate.profileSummaryExcerpt && (
                             <div>
                                <h4 className="text-xs font-semibold text-muted-foreground mb-0.5">Profile Summary Used:</h4>
                                <p className="text-xs text-foreground/70 line-clamp-2">{candidate.profileSummaryExcerpt}</p>
                            </div>
                        )}
                        {candidate.topSkills && candidate.topSkills.length > 0 && (
                            <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1">Top Skills:</h4>
                            <div className="flex flex-wrap gap-1">
                                {candidate.topSkills.map(skill => <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>)}
                            </div>
                            </div>
                        )}
                        {candidate.availability && (
                             <p className="text-xs text-muted-foreground">Availability: <span className="font-medium text-foreground">{candidate.availability}</span></p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Link href={`/candidates/${candidate.candidateId}`} passHref>
                            <Button variant="link" className="text-xs p-0 h-auto">
                                View Full Profile <ChevronRight className="h-3 w-3 ml-1"/>
                            </Button>
                        </Link>
                    </CardFooter>
                    </Card>
                ))}
                </div>
            ) : (
                 <div className="text-center py-8">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold">No Candidates Found</h3>
                    <p className="text-muted-foreground text-sm">
                        No candidates were found or re-ranked based on your criteria. Try adjusting the job description or search parameters.
                    </p>
                </div>
            )}
            </div>
        )}
      </Card>
    </Container>
  );
}
