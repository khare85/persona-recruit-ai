'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Brain, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building, 
  Heart,
  Bookmark,
  Star,
  TrendingUp,
  Filter,
  Zap,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Target
} from 'lucide-react';
import Link from 'next/link';

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  aiMatchScore: number;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  benefits: string[];
  postedAt: string;
  applicationDeadline?: string;
  applicationCount: number;
  isRemote: boolean;
  experienceLevel: string;
  isSaved: boolean;
  hasApplied: boolean;
  matchReasons: string[];
}

interface SearchFilters {
  query: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryMin: number;
  salaryMax: number;
  isRemote: boolean;
  skills: string[];
}

export default function CandidateJobRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    employmentType: 'all',
    experienceLevel: 'all',
    salaryMin: 50000,
    salaryMax: 200000,
    isRemote: false,
    skills: []
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [recommendations, filters]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/candidates/job-recommendations');
      if (response.ok) {
        const result = await response.json();
        setRecommendations(result.data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching job recommendations:', error);
      // Mock data for demonstration
      const mockJobs: JobRecommendation[] = [
        {
          id: '1',
          title: 'Senior Frontend Developer',
          company: 'TechCorp Inc.',
          location: 'San Francisco, CA',
          employmentType: 'Full-time',
          salaryRange: '$120,000 - $160,000',
          aiMatchScore: 95,
          description: 'We are looking for a Senior Frontend Developer to join our growing engineering team...',
          requiredSkills: ['React', 'TypeScript', 'JavaScript'],
          preferredSkills: ['Next.js', 'GraphQL', 'AWS'],
          benefits: ['Health Insurance', 'Remote Work', 'Stock Options', '401k'],
          postedAt: '2024-06-20T10:00:00Z',
          applicationDeadline: '2024-07-20T23:59:59Z',
          applicationCount: 47,
          isRemote: true,
          experienceLevel: 'Senior',
          isSaved: false,
          hasApplied: false,
          matchReasons: ['React expertise', 'TypeScript skills', 'Remote work preference', 'Senior level experience']
        },
        {
          id: '2',
          title: 'Full Stack Engineer',
          company: 'StartupXYZ',
          location: 'Remote',
          employmentType: 'Full-time',
          salaryRange: '$100,000 - $140,000',
          aiMatchScore: 88,
          description: 'Join our fast-growing startup as a Full Stack Engineer...',
          requiredSkills: ['Node.js', 'React', 'PostgreSQL'],
          preferredSkills: ['Docker', 'Kubernetes', 'MongoDB'],
          benefits: ['Equity', 'Flexible Hours', 'Learning Budget'],
          postedAt: '2024-06-19T14:30:00Z',
          applicationCount: 23,
          isRemote: true,
          experienceLevel: 'Mid-level',
          isSaved: true,
          hasApplied: false,
          matchReasons: ['Full stack skills', 'Startup experience', 'Node.js proficiency']
        },
        {
          id: '3',
          title: 'React Developer',
          company: 'Enterprise Ltd.',
          location: 'New York, NY',
          employmentType: 'Contract',
          salaryRange: '$80 - $120/hour',
          aiMatchScore: 82,
          description: 'Looking for an experienced React Developer for a 6-month contract...',
          requiredSkills: ['React', 'Redux', 'JavaScript'],
          preferredSkills: ['Testing Library', 'Jest', 'Webpack'],
          benefits: ['High Rate', 'Flexible Schedule'],
          postedAt: '2024-06-18T09:15:00Z',
          applicationCount: 31,
          isRemote: false,
          experienceLevel: 'Mid-level',
          isSaved: false,
          hasApplied: true,
          matchReasons: ['React specialization', 'Contract preference', 'Testing experience']
        }
      ];
      setRecommendations(mockJobs);
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = recommendations;

    if (filters.query) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(filters.query.toLowerCase()) ||
        job.company.toLowerCase().includes(filters.query.toLowerCase()) ||
        job.description.toLowerCase().includes(filters.query.toLowerCase()) ||
        job.requiredSkills.some(skill => skill.toLowerCase().includes(filters.query.toLowerCase()))
      );
    }

    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.employmentType !== 'all') {
      filtered = filtered.filter(job => job.employmentType === filters.employmentType);
    }

    if (filters.experienceLevel !== 'all') {
      filtered = filtered.filter(job => job.experienceLevel === filters.experienceLevel);
    }

    if (filters.isRemote) {
      filtered = filtered.filter(job => job.isRemote);
    }

    setFilteredJobs(filtered);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      setRecommendations(jobs => 
        jobs.map(job => 
          job.id === jobId ? { ...job, isSaved: !job.isSaved } : job
        )
      );
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleApplyToJob = async (jobId: string) => {
    try {
      setRecommendations(jobs => 
        jobs.map(job => 
          job.id === jobId ? { ...job, hasApplied: true } : job
        )
      );
    } catch (error) {
      console.error('Error applying to job:', error);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      location: '',
      employmentType: 'all',
      experienceLevel: 'all',
      salaryMin: 50000,
      salaryMax: 200000,
      isRemote: false,
      skills: []
    });
  };

  const formatSalary = (salaryRange: string) => {
    return salaryRange.replace(/(\$\d+),(\d+)/g, '$1k').replace(/(\$\d+),(\d+),(\d+)/g, '$1.$2M');
  };

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Brain className="mr-3 h-8 w-8 text-primary" />
            AI Job Recommendations
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover your perfect job match with AI-powered recommendations based on your skills and preferences
          </p>
        </div>

        {/* Search Bar and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs, companies, or skills..."
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Location"
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    className="pl-10 w-full md:w-64"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full md:w-auto"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>

              {showFilters && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Advanced Filters
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear All
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Employment Type</Label>
                        <Select value={filters.employmentType} onValueChange={(value) => updateFilter('employmentType', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Freelance">Freelance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Experience Level</Label>
                        <Select value={filters.experienceLevel} onValueChange={(value) => updateFilter('experienceLevel', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="Entry-level">Entry-level</SelectItem>
                            <SelectItem value="Mid-level">Mid-level</SelectItem>
                            <SelectItem value="Senior">Senior</SelectItem>
                            <SelectItem value="Lead">Lead</SelectItem>
                            <SelectItem value="Executive">Executive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="remote"
                          checked={filters.isRemote}
                          onChange={(e) => updateFilter('isRemote', e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="remote">Remote Only</Label>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Salary Range: ${filters.salaryMin.toLocaleString()} - ${filters.salaryMax.toLocaleString()}</Label>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm">$50k</span>
                        <Slider
                          value={[filters.salaryMin, filters.salaryMax]}
                          onValueChange={(values) => {
                            updateFilter('salaryMin', values[0]);
                            updateFilter('salaryMax', values[1]);
                          }}
                          max={200000}
                          min={50000}
                          step={10000}
                          className="flex-1"
                        />
                        <span className="text-sm">$200k+</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="recommended" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recommended">AI Recommended ({filteredJobs.length})</TabsTrigger>
            <TabsTrigger value="recent">Recently Posted</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          <TabsContent value="recommended">
            <div className="space-y-6">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
                            <div className="flex items-center mt-1 text-muted-foreground">
                              <Building className="h-4 w-4 mr-1" />
                              <span>{job.company}</span>
                              <span className="mx-2">•</span>
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{job.location}</span>
                              {job.isRemote && (
                                <>
                                  <span className="mx-2">•</span>
                                  <Badge variant="secondary">Remote</Badge>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getMatchScoreColor(job.aiMatchScore)} border-0`}>
                              <Sparkles className="h-3 w-3 mr-1" />
                              {job.aiMatchScore}% Match
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveJob(job.id)}
                              className={job.isSaved ? 'text-red-600' : ''}
                            >
                              <Heart className={`h-4 w-4 ${job.isSaved ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center mt-3 text-sm text-muted-foreground space-x-4">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatSalary(job.salaryRange)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {job.employmentType}
                          </div>
                          <div>
                            {job.applicationCount} applicants
                          </div>
                          <div>
                            Posted {new Date(job.postedAt).toLocaleDateString()}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {job.description}
                        </p>

                        {/* AI Match Reasons */}
                        <div className="mt-4">
                          <div className="flex items-center mb-2">
                            <Target className="h-4 w-4 mr-1 text-primary" />
                            <span className="text-sm font-medium">Why this matches you:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {job.matchReasons.map((reason, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-1">
                            {job.requiredSkills.slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {job.requiredSkills.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{job.requiredSkills.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Benefits */}
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1">
                            {job.benefits.slice(0, 4).map((benefit, index) => (
                              <Badge key={index} variant="outline" className="text-xs text-green-700 bg-green-50">
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      
                      <div className="flex gap-2">
                        {job.hasApplied ? (
                          <Badge className="bg-green-100 text-green-800">Applied</Badge>
                        ) : (
                          <Button onClick={() => handleApplyToJob(job.id)}>
                            Apply Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredJobs.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search criteria or filters to find more opportunities.
                    </p>
                    <Button onClick={clearFilters}>Clear Filters</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Recently Posted Jobs</h3>
                <p className="text-muted-foreground">
                  Fresh job opportunities posted in the last 24 hours.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trending">
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trending Jobs</h3>
                <p className="text-muted-foreground">
                  Most popular job opportunities based on candidate interest.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}