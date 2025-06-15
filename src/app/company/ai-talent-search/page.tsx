
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
import { aiTalentSemanticSearch, AiTalentSemanticSearchInput, AiTalentSemanticSearchOutput } from '@/ai/flows/ai-talent-semantic-search-flow';
import { Loader2, SearchCode, Users, Brain, Sparkles, CheckCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const talentSearchSchema = z.object({
  searchQuery: z.string().min(10, "Search query must be at least 10 characters."),
  resultCount: z.coerce.number().min(1).max(20).default(5),
});

type TalentSearchFormValues = z.infer<typeof talentSearchSchema>;

export default function AiTalentSearchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<AiTalentSemanticSearchOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<TalentSearchFormValues>({
    resolver: zodResolver(talentSearchSchema),
    defaultValues: {
      searchQuery: '',
      resultCount: 5,
    },
  });

  async function onSubmit(data: TalentSearchFormValues) {
    setIsLoading(true);
    setSearchResult(null);

    try {
      const input: AiTalentSemanticSearchInput = {
        searchQuery: data.searchQuery,
        resultCount: data.resultCount,
      };
      
      const result = await aiTalentSemanticSearch(input);
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
          <CardTitle className="text-3xl font-headline">AI Talent Search (Semantic)</CardTitle>
          <CardDescription>
            Describe your ideal candidate or paste a job description snippet. Our AI will search our talent pool using semantic similarity.
            This searches real candidate profiles stored in our database.
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

              <FormField
                control={form.control}
                name="resultCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Results to Show (1-20)</FormLabel>
                    <FormControl><Input type="number" min="1" max="20" {...field} /></FormControl>
                    <FormDescription>How many candidate profiles to return from the semantic search.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4 pt-6">
              <Button type="submit" disabled={isLoading} size="lg" className="w-full md:w-1/2">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                Find Talent with AI
              </Button>
              <Alert variant="default" className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Semantic Search</AlertTitle>
                <AlertDescription>
                  This search uses AI embeddings to find candidates whose profiles are semantically similar to your query.
                  Results are based on actual candidate data stored in your Firestore database.
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
                            {candidate.matchScore ? `${(candidate.matchScore * 100).toFixed(0)}% Match` : 'Match'}
                        </Badge>
                    </div>
                    <CardDescription>{candidate.currentTitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     <Progress value={candidate.matchScore ? candidate.matchScore * 100 : 0} className="h-2" />
                     <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1">Profile Excerpt:</h4>
                        <p className="text-xs text-foreground/80">{candidate.profileSummaryExcerpt || 'No summary available'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-1">Top Skills:</h4>
                      <div className="flex flex-wrap gap-1">
                        {candidate.topSkills?.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>) || <span className="text-xs text-muted-foreground">No skills listed</span>}
                      </div>
                    </div>
                     <p className="text-xs text-muted-foreground">Availability: <span className="font-medium text-foreground">{candidate.availability || 'Not specified'}</span></p>
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
                    No candidates found matching your query. This could mean no candidates are in the database yet, or the semantic search didn't find close matches. Try different keywords.
                </p>
            </div>
        )}
      </Card>
    </Container>
  );
}
