
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Container } from '@/components/shared/Container';
import { useToast } from '@/hooks/use-toast';
import { aiTalentSearch, AiTalentSearchInput, AiTalentSearchOutput } from '@/ai/flows/ai-talent-search-flow';
import { Loader2, SearchCode, Users, Brain, Sparkles, CheckCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const talentSearchSchema = z.object({
  searchQuery: z.string().min(20, "Search query or job description snippet must be at least 20 characters."),
  filters: z.object({
    availabilityInDays: z.coerce.number().optional(),
    isOpenToRemote: z.boolean().optional(),
    minExperienceYears: z.coerce.number().optional(),
  }).optional(),
  resultCount: z.coerce.number().min(3).max(10).default(5),
});

type TalentSearchFormValues = z.infer<typeof talentSearchSchema>;

export default function AiTalentSearchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<AiTalentSearchOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<TalentSearchFormValues>({
    resolver: zodResolver(talentSearchSchema),
    defaultValues: {
      searchQuery: '',
      filters: {
        isOpenToRemote: false,
      },
      resultCount: 5,
    },
  });

  async function onSubmit(data: TalentSearchFormValues) {
    setIsLoading(true);
    setSearchResult(null);

    try {
      const input: AiTalentSearchInput = {
        searchQuery: data.searchQuery,
        filters: data.filters,
        resultCount: data.resultCount,
      };
      
      const result = await aiTalentSearch(input);
      setSearchResult(result);
      toast({
        title: "Talent Search Complete!",
        description: result.searchSummary || "AI has found potential candidates based on your query.",
        action: <CheckCircle className="text-green-500" />,
      });

    } catch (error) {
      console.error("Error performing AI talent search:", error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Could not perform the talent search. Please check your input or try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Container>
      <Card className="max-w-5xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <SearchCode className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-headline">AI Talent Search (Premium)</CardTitle>
          <CardDescription>
            Describe your ideal candidate or paste a job description snippet. Our AI will search our talent pool.
            For demo purposes, this uses mock candidate generation.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8">
              <FormField
                control={form.control}
                name="searchQuery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Search Query or Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Seeking a senior Python developer with experience in financial services and cloud platforms, available within 2 weeks.' OR paste a job description here..."
                        className="min-h-[150px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>The more detailed your query, the better the AI can match candidates.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card className="bg-muted/50 p-6">
                <CardTitle className="text-xl mb-4">Optional Filters</CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="filters.availabilityInDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Within (Days)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 7 for 1 week" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="filters.minExperienceYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Experience (Years)</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 5" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="filters.isOpenToRemote"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 h-full justify-center">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Open to Remote Work
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                    control={form.control}
                    name="resultCount"
                    render={({ field }) => (
                      <FormItem className="mt-6">
                        <FormLabel>Number of Results to Show (3-10)</FormLabel>
                        <FormControl><Input type="number" min="3" max="10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </Card>

            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4 pt-6">
              <Button type="submit" disabled={isLoading} size="lg" className="w-full md:w-1/2">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                Find Talent with AI
              </Button>
              <Alert variant="default" className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Premium Feature Simulation</AlertTitle>
                <AlertDescription>
                  In a live version, this search would query a vast candidate database. For this demo, AI generates mock profiles matching your query.
                  The top profiles are shown; further access could be part of a subscription or pay-per-profile model.
                </AlertDescription>
              </Alert>
            </CardFooter>
          </form>
        </Form>

        {searchResult && searchResult.matchedCandidates.length > 0 && (
          <div className="px-6 py-8 border-t mt-8">
            <h2 className="text-2xl font-headline font-semibold mb-2 flex items-center">
                <Users className="mr-3 h-7 w-7 text-primary" /> AI Matched Candidate Profiles
            </h2>
            <p className="text-muted-foreground mb-6">{searchResult.searchSummary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {searchResult.matchedCandidates.map((candidate) => (
                <Card key={candidate.candidateId} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{candidate.fullName}</CardTitle>
                        <Badge variant="secondary" className="text-sm">
                            {(candidate.matchScore * 100).toFixed(0)}% Match
                        </Badge>
                    </div>
                    <CardDescription>{candidate.currentTitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     <Progress value={candidate.matchScore * 100} className="h-2" />
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1">AI Justification:</h4>
                        <p className="text-xs text-foreground/80 bg-muted/30 p-2 rounded-md border italic">
                            {candidate.matchJustification}
                        </p>
                    </div>
                     <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1">Profile Excerpt:</h4>
                        <p className="text-xs text-foreground/80">{candidate.profileSummaryExcerpt}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1">Top Skills:</h4>
                      <div className="flex flex-wrap gap-1">
                        {candidate.topSkills.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}
                      </div>
                    </div>
                     <p className="text-xs text-muted-foreground">Availability: <span className="font-medium text-foreground">{candidate.availability}</span></p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="link" className="text-xs p-0 h-auto">View Full Profile (Premium)</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
                Showing top {searchResult.matchedCandidates.length} results. Upgrade for more profiles and full access.
            </p>
          </div>
        )}
         {searchResult && searchResult.matchedCandidates.length === 0 && !isLoading && (
            <div className="px-6 py-8 border-t mt-8 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-xl font-semibold">No Candidates Found</h3>
                <p className="text-muted-foreground">
                    The AI couldn't find mock candidates matching your specific query and filters. Try broadening your search.
                </p>
            </div>
        )}
      </Card>
    </Container>
  );
}
