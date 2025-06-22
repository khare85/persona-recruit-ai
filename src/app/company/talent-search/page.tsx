'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Filter, 
  Users, 
  Star, 
  MapPin, 
  Clock, 
  Briefcase, 
  Loader2,
  Brain,
  Sparkles,
  Target,
  Calendar,
  Mail,
  ExternalLink,
  Download,
  BookmarkPlus
} from 'lucide-react';
import { Container } from '@/components/shared/Container';
import Link from 'next/link';
import { aiTalentSearch } from '@/ai/flows/ai-talent-search-flow';
import { aiTalentSemanticSearch } from '@/ai/flows/ai-talent-semantic-search-flow';
import { advancedCandidateJobMatching } from '@/ai/flows/advanced-candidate-job-matching-flow';
import { toast } from '@/hooks/use-toast';

interface SearchResult {
  candidateId: string;
  fullName: string;
  currentTitle: string;
  profileSummaryExcerpt?: string;
  topSkills?: string[];
  availability?: string;
  matchScore?: number;
  matchJustification?: string;
  llmMatchScore?: number;
  llmJustification?: string;
  semanticMatchScore?: number;
}

interface SearchFilters {
  minExperienceYears: number;
  availabilityInDays: number;
  isOpenToRemote: boolean;
  resultCount: number;
}

export default function TalentSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'ai' | 'semantic' | 'advanced'>('ai');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchSummary, setSearchSummary] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  
  const [filters, setFilters] = useState<SearchFilters>({
    minExperienceYears: 2,
    availabilityInDays: 30,
    isOpenToRemote: true,
    resultCount: 5
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Search Query Required',
        description: 'Please enter a search query to find candidates',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setResults([]);
    setSearchSummary('');

    try {
      let searchResults;
      
      switch (searchMode) {
        case 'ai':
          searchResults = await aiTalentSearch({
            searchQuery,
            filters: {
              minExperienceYears: filters.minExperienceYears,
              availabilityInDays: filters.availabilityInDays,
              isOpenToRemote: filters.isOpenToRemote
            },
            resultCount: filters.resultCount
          });
          setResults(searchResults.matchedCandidates);
          setSearchSummary(searchResults.searchSummary);
          break;
          
        case 'semantic':
          searchResults = await aiTalentSemanticSearch({
            searchQuery,
            resultCount: filters.resultCount
          });
          setResults(searchResults.matchedCandidates);
          setSearchSummary(searchResults.searchSummary);
          break;
          
        case 'advanced':
          if (!jobDescription.trim()) {
            toast({
              title: 'Job Description Required',
              description: 'Please enter a job description for advanced matching',
              variant: 'destructive'
            });
            return;
          }
          
          searchResults = await advancedCandidateJobMatching({
            jobDescriptionText: jobDescription,
            companyInformation: companyInfo || 'Leading technology company',
            semanticSearchResultCount: 20,
            finalResultCount: filters.resultCount
          });
          setResults(searchResults.rerankedCandidates.map(candidate => ({
            ...candidate,
            matchScore: candidate.llmMatchScore,
            matchJustification: candidate.llmJustification
          })));
          setSearchSummary(searchResults.searchSummary);
          break;
      }
      
      toast({
        title: 'Search Completed',
        description: `Found ${results.length} matching candidates`
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: 'An error occurred while searching for candidates',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSearchModeInfo = () => {
    switch (searchMode) {
      case 'ai':
        return {
          title: 'AI Talent Search',
          description: 'Generate candidate profiles using AI based on your search criteria',
          icon: Brain
        };
      case 'semantic':
        return {
          title: 'Semantic Search',
          description: 'Search real candidate database using semantic similarity',
          icon: Sparkles
        };
      case 'advanced':
        return {
          title: 'Advanced Matching',
          description: 'Two-stage matching with semantic search and detailed AI analysis',
          icon: Target
        };
    }
  };

  const searchModeInfo = getSearchModeInfo();
  const SearchModeIcon = searchModeInfo.icon;

  return (
    <Container className="max-w-7xl mx-auto py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Talent Search</h1>
            <p className="text-muted-foreground">
              Find and match candidates using advanced AI-powered search capabilities
            </p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <SearchModeIcon className="h-5 w-5" />
                  Search Mode
                </CardTitle>
                <CardDescription>{searchModeInfo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={searchMode} onValueChange={(value) => setSearchMode(value as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ai" className="text-xs">AI Search</TabsTrigger>
                    <TabsTrigger value="semantic" className="text-xs">Semantic</TabsTrigger>
                    <TabsTrigger value="advanced" className="text-xs">Advanced</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Search Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Query</CardTitle>
                <CardDescription>
                  Describe the ideal candidate or paste a job description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="search">Search Query</Label>
                  <Textarea
                    id="search"
                    placeholder="e.g., Senior React developer with 5+ years experience in fintech..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    rows={3}
                  />
                </div>

                {searchMode === 'advanced' && (
                  <>
                    <div>
                      <Label htmlFor="jobDescription">Job Description</Label>
                      <Textarea
                        id="jobDescription"
                        placeholder="Detailed job description including responsibilities, requirements, and qualifications..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyInfo">Company Information (Optional)</Label>
                      <Textarea
                        id="companyInfo"
                        placeholder="Company culture, values, industry focus..."
                        value={companyInfo}
                        onChange={(e) => setCompanyInfo(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </>
                )}

                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search Candidates
                </Button>
              </CardContent>
            </Card>

            {/* Filters */}
            {searchMode === 'ai' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Search Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Minimum Experience: {filters.minExperienceYears} years</Label>
                    <Slider
                      value={[filters.minExperienceYears]}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, minExperienceYears: value[0] }))}
                      max={15}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Availability: {filters.availabilityInDays} days</Label>
                    <Slider
                      value={[filters.availabilityInDays]}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, availabilityInDays: value[0] }))}
                      max={180}
                      min={0}
                      step={15}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="remote">Open to Remote Work</Label>
                    <Switch
                      id="remote"
                      checked={filters.isOpenToRemote}
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isOpenToRemote: checked }))}
                    />
                  </div>

                  <div>
                    <Label>Number of Results</Label>
                    <Select
                      value={filters.resultCount.toString()}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, resultCount: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 results</SelectItem>
                        <SelectItem value="5">5 results</SelectItem>
                        <SelectItem value="10">10 results</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Summary */}
            {searchSummary && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Search Analysis</h3>
                      <p className="text-sm text-muted-foreground">{searchSummary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Searching for candidates...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Search Results ({results.length})
                  </h2>
                  <Button variant="outline" size="sm">
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    Save Search
                  </Button>
                </div>

                {results.map((candidate) => (
                  <Card key={candidate.candidateId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.fullName}`} />
                          <AvatarFallback>
                            {candidate.fullName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{candidate.fullName}</h3>
                              <p className="text-muted-foreground">{candidate.currentTitle}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="font-medium">
                                  {Math.round((candidate.llmMatchScore || candidate.matchScore) * 100)}%
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {searchMode === 'advanced' ? 'Advanced Match' : 
                                 searchMode === 'semantic' ? 'Semantic Match' : 'AI Generated'}
                              </Badge>
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

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{candidate.availability || 'Not specified'}</span>
                            </div>
                          </div>

                          {(candidate.matchJustification || candidate.llmJustification) && (
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">Match Analysis:</p>
                              <p className="text-sm">
                                {candidate.llmJustification || candidate.matchJustification}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Link href={`/candidates/${candidate.candidateId}`}>
                              <Button size="sm">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Profile
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4 mr-2" />
                              Contact
                            </Button>
                            <Button variant="outline" size="sm">
                              <Calendar className="h-4 w-4 mr-2" />
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

            {/* Empty State */}
            {!isLoading && results.length === 0 && searchQuery && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Candidates Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search query or filters to find more candidates.
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Initial State */}
            {!searchQuery && results.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Start Your Talent Search</h3>
                    <p className="text-muted-foreground">
                      Enter a search query to find candidates using our AI-powered search engine.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}