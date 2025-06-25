'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Target, 
  Users, 
  Star, 
  MapPin, 
  Clock, 
  Briefcase, 
  Loader2,
  Brain,
  Sparkles,
  TrendingUp,
  CalendarDays,
  Mail,
  ExternalLink,
  Download,
  BookmarkPlus,
  Building2,
  Filter,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Container } from '@/components/shared/Container';
import Link from 'next/link';
import { advancedCandidateJobMatching } from '@/ai/flows/advanced-candidate-job-matching-flow';
import { screenCandidateSkills } from '@/ai/flows/candidate-screener-flow';
import { getMockJobs, getMockCandidates, type MockJob, type MockCandidate } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';

interface AdvancedMatchResult {
  candidateId: string;
  fullName: string;
  currentTitle: string;
  profileSummaryExcerpt?: string;
  topSkills?: string[];
  availability?: string;
  semanticMatchScore?: number;
  llmMatchScore: number;
  llmJustification: string;
}

interface ScreeningResult {
  candidateId: string;
  candidate: MockCandidate;
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  assessment: string;
  summary: string;
}

export default function AdvancedMatchingPage() {
  const [selectedJob, setSelectedJob] = useState<MockJob | null>(null);
  const [customJobDescription, setCustomJobDescription] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string>('');
  const [preferredSkills, setPreferredSkills] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [matchingResults, setMatchingResults] = useState<AdvancedMatchResult[]>([]);
  const [screeningResults, setScreeningResults] = useState<ScreeningResult[]>([]);
  const [searchSummary, setSearchSummary] = useState('');
  const [activeTab, setActiveTab] = useState<'ai-matching' | 'skill-screening'>('ai-matching');
  const [semanticResultCount, setSemanticResultCount] = useState(20);
  const [finalResultCount, setFinalResultCount] = useState(5);
  
  const [jobs, setJobs] = useState<MockJob[]>([]);
  const [candidates, setCandidates] = useState<MockCandidate[]>([]);

  useEffect(() => {
    // Load mock data
    setJobs(getMockJobs());
    setCandidates(getMockCandidates());
  }, []);

  const handleAdvancedMatching = async () => {
    if (!selectedJob && !customJobDescription.trim()) {
      toast({
        title: 'Job Information Required',
        description: 'Please select a job or enter a custom job description',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setMatchingResults([]);
    setSearchSummary('');

    try {
      const jobDesc = selectedJob 
        ? `${selectedJob.title}\n\n${selectedJob.description}\n\nRequirements: ${selectedJob.requirements.join(', ')}\n\nResponsibilities: ${selectedJob.responsibilities.join(', ')}`
        : customJobDescription;

      const companyDetails = selectedJob?.companyName || companyInfo || 'Technology Company';

      const results = await advancedCandidateJobMatching({
        jobDescriptionText: jobDesc,
        companyInformation: companyDetails,
        semanticSearchResultCount: semanticResultCount,
        finalResultCount: finalResultCount
      });

      setMatchingResults(results.rerankedCandidates);
      setSearchSummary(results.searchSummary);
      
      toast({
        title: 'Matching Completed',
        description: `Found ${results.rerankedCandidates.length} top matching candidates`
      });
    } catch (error) {
      console.error('Matching error:', error);
      toast({
        title: 'Matching Failed',
        description: 'An error occurred during advanced matching',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillScreening = async () => {
    if (!requiredSkills.trim()) {
      toast({
        title: 'Required Skills Missing',
        description: 'Please enter required skills for screening',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setScreeningResults([]);

    try {
      const reqSkills = requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      const prefSkills = preferredSkills.split(',').map(s => s.trim()).filter(Boolean);

      const results: ScreeningResult[] = [];

      for (const candidate of candidates.slice(0, 10)) { // Limit to 10 for demo
        const screenResult = await screenCandidateSkills({
          candidateSkills: candidate.skills,
          requiredJobSkills: reqSkills,
          preferredJobSkills: prefSkills
        });

        results.push({
          candidateId: candidate.id,
          candidate,
          ...screenResult
        });
      }

      // Sort by assessment quality
      const assessmentOrder = { 'Strong Match': 4, 'Potential Match': 3, 'Review Recommended': 2, 'Missing Requirements': 1 };
      results.sort((a, b) => (assessmentOrder[b.assessment as keyof typeof assessmentOrder] || 0) - (assessmentOrder[a.assessment as keyof typeof assessmentOrder] || 0));

      setScreeningResults(results);
      
      toast({
        title: 'Screening Completed',
        description: `Screened ${results.length} candidates`
      });
    } catch (error) {
      console.error('Screening error:', error);
      toast({
        title: 'Screening Failed',
        description: 'An error occurred during skill screening',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAssessmentColor = (assessment: string) => {
    switch (assessment) {
      case 'Strong Match': return 'text-green-600 bg-green-50 border-green-200';
      case 'Potential Match': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Review Recommended': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Missing Requirements': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAssessmentIcon = (assessment: string) => {
    switch (assessment) {
      case 'Strong Match': return CheckCircle2;
      case 'Potential Match': return Star;
      case 'Review Recommended': return AlertCircle;
      case 'Missing Requirements': return XCircle;
      default: return AlertCircle;
    }
  };

  return (
    <Container className="max-w-7xl mx-auto py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Advanced Candidate Matching</h1>
            <p className="text-muted-foreground">
              Sophisticated AI-powered matching and skill-based screening for precise candidate selection
            </p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>

        {/* Matching Mode Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ai-matching" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Semantic Matching
                </TabsTrigger>
                <TabsTrigger value="skill-screening" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Skill-Based Screening
                </TabsTrigger>
              </TabsList>

              {/* AI Matching Tab */}
              <TabsContent value="ai-matching" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Configuration Panel */}
                  <div className="lg:col-span-1 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Job Configuration
                        </CardTitle>
                        <CardDescription>
                          Select an existing job or define custom requirements
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Select Existing Job</Label>
                          <Select
                            value={selectedJob?.id || ''}
                            onValueChange={(value) => {
                              const job = jobs.find(j => j.id === value);
                              setSelectedJob(job || null);
                              if (job) {
                                setCustomJobDescription('');
                                setCompanyInfo(job.companyName);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a job..." />
                            </SelectTrigger>
                            <SelectContent>
                              {jobs.map((job) => (
                                <SelectItem key={job.id} value={job.id}>
                                  {job.title} - {job.companyName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                          — OR —
                        </div>

                        <div>
                          <Label htmlFor="customJob">Custom Job Description</Label>
                          <Textarea
                            id="customJob"
                            placeholder="Paste or write a detailed job description..."
                            value={customJobDescription}
                            onChange={(e) => {
                              setCustomJobDescription(e.target.value);
                              if (e.target.value) setSelectedJob(null);
                            }}
                            rows={6}
                          />
                        </div>

                        {!selectedJob && (
                          <div>
                            <Label htmlFor="companyInfo">Company Information</Label>
                            <Textarea
                              id="companyInfo"
                              placeholder="Company culture, values, industry..."
                              value={companyInfo}
                              onChange={(e) => setCompanyInfo(e.target.value)}
                              rows={3}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Matching Parameters</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Semantic Search Results: {semanticResultCount}</Label>
                          <Slider
                            value={[semanticResultCount]}
                            onValueChange={(value) => setSemanticResultCount(value[0])}
                            max={50}
                            min={5}
                            step={5}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Initial candidates to analyze
                          </p>
                        </div>

                        <div>
                          <Label>Final Results: {finalResultCount}</Label>
                          <Slider
                            value={[finalResultCount]}
                            onValueChange={(value) => setFinalResultCount(value[0])}
                            max={10}
                            min={1}
                            step={1}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Top matches to return
                          </p>
                        </div>

                        <Button 
                          onClick={handleAdvancedMatching} 
                          disabled={isLoading}
                          className="w-full"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Target className="h-4 w-4 mr-2" />
                          )}
                          Run Advanced Matching
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Results Panel */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Selected Job Display */}
                    {selectedJob && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">{selectedJob.title}</CardTitle>
                          <CardDescription>{selectedJob.companyName} • {selectedJob.location}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">{selectedJob.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedJob.requirements.slice(0, 5).map((req) => (
                              <Badge key={req} variant="outline" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                            {selectedJob.requirements.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{selectedJob.requirements.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Search Summary */}
                    {searchSummary && (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium mb-1">Matching Analysis</h3>
                              <p className="text-sm text-muted-foreground">{searchSummary}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Advanced Matching Results */}
                    {matchingResults.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Advanced Matching Results ({matchingResults.length})
                        </h2>

                        {matchingResults.map((candidate, index) => (
                          <Card key={candidate.candidateId} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                    {index + 1}
                                  </div>
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.fullName}`} />
                                    <AvatarFallback>
                                      {candidate.fullName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>

                                <div className="flex-1 space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h3 className="text-lg font-semibold">{candidate.fullName}</h3>
                                      <p className="text-muted-foreground">{candidate.currentTitle}</p>
                                    </div>
                                    <div className="text-right space-y-2">
                                      <div>
                                        <div className="text-xs text-muted-foreground">LLM Match</div>
                                        <div className="flex items-center gap-2">
                                          <Progress value={candidate.llmMatchScore * 100} className="w-16 h-2" />
                                          <span className="text-sm font-medium">
                                            {Math.round(candidate.llmMatchScore * 100)}%
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground">Semantic</div>
                                        <div className="flex items-center gap-2">
                                          <Progress value={(candidate.semanticMatchScore || 0) * 100} className="w-16 h-2" />
                                          <span className="text-sm font-medium">
                                            {Math.round((candidate.semanticMatchScore || 0) * 100)}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {candidate.profileSummaryExcerpt || 'No profile summary available'}
                                  </p>

                                  <div className="flex flex-wrap gap-2">
                                    {(candidate.topSkills || []).map((skill) => (
                                      <Badge key={skill} variant="secondary" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>

                                  <div className="bg-muted/50 p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">AI Analysis:</p>
                                    <p className="text-sm">{candidate.llmJustification}</p>
                                  </div>

                                  <div className="flex gap-2">
                                    <Link href={`/candidates/${candidate.candidateId}`}>
                                      <Button size="sm">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Profile
                                      </Button>
                                    </Link>
                                    <Button variant="outline" size="sm">
                                      <CalendarDays className="h-4 w-4 mr-2" />
                                      Schedule Interview
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Skill Screening Tab */}
              <TabsContent value="skill-screening" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Configuration Panel */}
                  <div className="lg:col-span-1 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Filter className="h-5 w-5" />
                          Skill Requirements
                        </CardTitle>
                        <CardDescription>
                          Define required and preferred skills for screening
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="requiredSkills">Required Skills</Label>
                          <Textarea
                            id="requiredSkills"
                            placeholder="React, TypeScript, Node.js, AWS..."
                            value={requiredSkills}
                            onChange={(e) => setRequiredSkills(e.target.value)}
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Comma-separated list of mandatory skills
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="preferredSkills">Preferred Skills (Optional)</Label>
                          <Textarea
                            id="preferredSkills"
                            placeholder="GraphQL, Docker, Kubernetes..."
                            value={preferredSkills}
                            onChange={(e) => setPreferredSkills(e.target.value)}
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Comma-separated list of nice-to-have skills
                          </p>
                        </div>

                        <Button 
                          onClick={handleSkillScreening} 
                          disabled={isLoading}
                          className="w-full"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Filter className="h-4 w-4 mr-2" />
                          )}
                          Run Skill Screening
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Screening Results */}
                  <div className="lg:col-span-2 space-y-6">
                    {screeningResults.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Screening Results ({screeningResults.length})
                        </h2>

                        {screeningResults.map((result) => {
                          const AssessmentIcon = getAssessmentIcon(result.assessment);
                          
                          return (
                            <Card key={result.candidateId} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={result.candidate.profilePictureUrl} />
                                    <AvatarFallback>
                                      {result.candidate.fullName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h3 className="text-lg font-semibold">{result.candidate.fullName}</h3>
                                        <p className="text-muted-foreground">{result.candidate.currentTitle}</p>
                                      </div>
                                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${getAssessmentColor(result.assessment)}`}>
                                        <AssessmentIcon className="h-4 w-4" />
                                        <span className="text-sm font-medium">{result.assessment}</span>
                                      </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground">{result.summary}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {result.matchedRequiredSkills.length > 0 && (
                                        <div>
                                          <p className="text-xs font-medium text-green-600 mb-1">
                                            Required Skills ✓ ({result.matchedRequiredSkills.length})
                                          </p>
                                          <div className="flex flex-wrap gap-1">
                                            {result.matchedRequiredSkills.map((skill) => (
                                              <Badge key={skill} variant="secondary" className="text-xs bg-green-50 text-green-700">
                                                {skill}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {result.missingRequiredSkills.length > 0 && (
                                        <div>
                                          <p className="text-xs font-medium text-red-600 mb-1">
                                            Missing Required ✗ ({result.missingRequiredSkills.length})
                                          </p>
                                          <div className="flex flex-wrap gap-1">
                                            {result.missingRequiredSkills.map((skill) => (
                                              <Badge key={skill} variant="outline" className="text-xs text-red-600 border-red-200">
                                                {skill}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {result.matchedPreferredSkills.length > 0 && (
                                        <div>
                                          <p className="text-xs font-medium text-blue-600 mb-1">
                                            Preferred Skills + ({result.matchedPreferredSkills.length})
                                          </p>
                                          <div className="flex flex-wrap gap-1">
                                            {result.matchedPreferredSkills.map((skill) => (
                                              <Badge key={skill} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                                                {skill}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex gap-2">
                                      <Link href={`/candidates/${result.candidate.id}`}>
                                        <Button size="sm">
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          View Profile
                                        </Button>
                                      </Link>
                                      <Button variant="outline" size="sm">
                                        <Mail className="h-4 w-4 mr-2" />
                                        Contact
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}