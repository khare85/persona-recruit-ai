'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bookmark, 
  Search, 
  MapPin, 
  Building, 
  DollarSign, 
  Clock, 
  Heart,
  ExternalLink,
  Filter,
  Trash2,
  Eye,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react';
import Link from 'next/link';

interface SavedJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  description: string;
  requiredSkills: string[];
  benefits: string[];
  postedAt: string;
  savedAt: string;
  applicationDeadline?: string;
  applicationCount: number;
  isRemote: boolean;
  experienceLevel: string;
  hasApplied: boolean;
  aiMatchScore: number;
  status: 'active' | 'expired' | 'filled';
  notes?: string;
}

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [savedJobs, searchTerm, statusFilter, typeFilter]);

  const fetchSavedJobs = async () => {
    try {
      const response = await fetch('/api/candidates/saved-jobs');
      if (response.ok) {
        const result = await response.json();
        setSavedJobs(result.data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      // Mock data for demonstration
      const mockJobs: SavedJob[] = [
        {
          id: '1',
          title: 'Senior Frontend Developer',
          company: 'TechCorp Inc.',
          location: 'San Francisco, CA',
          employmentType: 'Full-time',
          salaryRange: '$120,000 - $160,000',
          description: 'We are looking for a Senior Frontend Developer to join our growing engineering team...',
          requiredSkills: ['React', 'TypeScript', 'JavaScript', 'Next.js'],
          benefits: ['Health Insurance', 'Remote Work', 'Stock Options', '401k'],
          postedAt: '2024-06-20T10:00:00Z',
          savedAt: '2024-06-21T14:30:00Z',
          applicationDeadline: '2024-07-20T23:59:59Z',
          applicationCount: 47,
          isRemote: true,
          experienceLevel: 'Senior',
          hasApplied: false,
          aiMatchScore: 95,
          status: 'active',
          notes: 'Great company culture, excellent benefits package'
        },
        {
          id: '2',
          title: 'Full Stack Engineer',
          company: 'StartupXYZ',
          location: 'Remote',
          employmentType: 'Full-time',
          salaryRange: '$100,000 - $140,000',
          description: 'Join our fast-growing startup as a Full Stack Engineer...',
          requiredSkills: ['Node.js', 'React', 'PostgreSQL', 'Docker'],
          benefits: ['Equity', 'Flexible Hours', 'Learning Budget'],
          postedAt: '2024-06-19T14:30:00Z',
          savedAt: '2024-06-20T09:15:00Z',
          applicationCount: 23,
          isRemote: true,
          experienceLevel: 'Mid-level',
          hasApplied: true,
          aiMatchScore: 88,
          status: 'active'
        },
        {
          id: '3',
          title: 'React Developer',
          company: 'Enterprise Ltd.',
          location: 'New York, NY',
          employmentType: 'Contract',
          salaryRange: '$80 - $120/hour',
          description: 'Looking for an experienced React Developer for a 6-month contract...',
          requiredSkills: ['React', 'Redux', 'JavaScript'],
          benefits: ['High Rate', 'Flexible Schedule'],
          postedAt: '2024-06-15T09:15:00Z',
          savedAt: '2024-06-16T11:00:00Z',
          applicationDeadline: '2024-06-25T23:59:59Z',
          applicationCount: 31,
          isRemote: false,
          experienceLevel: 'Mid-level',
          hasApplied: false,
          aiMatchScore: 82,
          status: 'expired'
        }
      ];
      setSavedJobs(mockJobs);
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = savedJobs;

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.requiredSkills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(job => job.employmentType === typeFilter);
    }

    setFilteredJobs(filtered);
  };

  const removeSavedJob = async (jobId: string) => {
    try {
      setSavedJobs(jobs => jobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error removing saved job:', error);
    }
  };

  const applyToJob = async (jobId: string) => {
    try {
      setSavedJobs(jobs => 
        jobs.map(job => 
          job.id === jobId ? { ...job, hasApplied: true } : job
        )
      );
    } catch (error) {
      console.error('Error applying to job:', error);
    }
  };

  const getStatusBadge = (status: string, hasDeadline: boolean, deadline?: string) => {
    if (status === 'expired' || (hasDeadline && deadline && new Date(deadline) < new Date())) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (status === 'filled') {
      return <Badge className="bg-gray-100 text-gray-800">Position Filled</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const isExpired = (job: SavedJob) => {
    return job.status === 'expired' || 
           (job.applicationDeadline && new Date(job.applicationDeadline) < new Date());
  };

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Bookmark className="mr-3 h-8 w-8 text-primary" />
            Saved Jobs
          </h1>
          <p className="text-muted-foreground mt-1">
            Keep track of interesting opportunities and apply when you're ready
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savedJobs.length}</div>
              <p className="text-xs text-muted-foreground">Jobs in your list</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {savedJobs.filter(job => job.status === 'active' && !isExpired(job)).length}
              </div>
              <p className="text-xs text-muted-foreground">Still accepting applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applied</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {savedJobs.filter(job => job.hasApplied).length}
              </div>
              <p className="text-xs text-muted-foreground">Applications submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {savedJobs.filter(job => 
                  job.applicationDeadline && 
                  new Date(job.applicationDeadline) > new Date() &&
                  new Date(job.applicationDeadline).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
                ).length}
              </div>
              <p className="text-xs text-muted-foreground">Deadlines within 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search saved jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="filled">Position Filled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
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
          </CardContent>
        </Card>

        {/* Job List */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className={`hover:shadow-lg transition-shadow ${isExpired(job) ? 'opacity-75' : ''}`}>
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
                          {job.aiMatchScore}% Match
                        </Badge>
                        {getStatusBadge(job.status, !!job.applicationDeadline, job.applicationDeadline)}
                      </div>
                    </div>

                    <div className="flex items-center mt-3 text-sm text-muted-foreground space-x-4">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {job.salaryRange}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.employmentType}
                      </div>
                      <div>
                        {job.applicationCount} applicants
                      </div>
                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-1" />
                        Saved {new Date(job.savedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {job.applicationDeadline && (
                      <div className="mt-2 flex items-center text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Application deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {job.description}
                    </p>

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

                    {job.notes && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {job.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSavedJob(job.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    {job.hasApplied ? (
                      <Badge className="bg-green-100 text-green-800">Applied</Badge>
                    ) : !isExpired(job) ? (
                      <Button onClick={() => applyToJob(job.id)}>
                        Apply Now
                      </Button>
                    ) : (
                      <Button disabled variant="outline">
                        Expired
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
                <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No saved jobs found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Try adjusting your search criteria or filters.'
                    : 'Start saving jobs that interest you to keep track of opportunities.'
                  }
                </p>
                <Link href="/candidates/job-recommendations">
                  <Button>Discover Jobs</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>
    </DashboardLayout>
  );
}