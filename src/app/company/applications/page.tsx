'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Filter, 
  Search, 
  Eye, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Download,
  Mail,
  Play,
  Star,
  MapPin,
  Briefcase,
  GraduationCap,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface JobApplication {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateLocation?: string;
  jobId: string;
  jobTitle: string;
  department: string;
  appliedAt: string;
  status: 'pending' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'hired' | 'rejected';
  aiMatchScore: number;
  resumeUrl?: string;
  videoIntroUrl?: string;
  coverLetter?: string;
  experience: string;
  skills: string[];
  currentTitle: string;
  lastUpdated: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  interview_scheduled: 'bg-purple-100 text-purple-800',
  interviewed: 'bg-indigo-100 text-indigo-800',
  hired: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const statusLabels = {
  pending: 'Pending Review',
  under_review: 'Under Review',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  hired: 'Hired',
  rejected: 'Rejected'
};

export default function ApplicationManagementPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    job: 'all',
    department: 'all',
    minScore: 0,
    search: ''
  });
  const [jobs, setJobs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchApplications();
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, filters, currentTab]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/company/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
        
        // Extract unique departments
        const uniqueDepartments = [...new Set(data.applications.map((app: JobApplication) => app.department))];
        setDepartments(uniqueDepartments);
      } else {
        setError('Failed to load applications');
      }
    } catch (error) {
      setError('An error occurred while loading applications');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const applyFilters = () => {
    let filtered = applications;

    // Tab filtering
    if (currentTab !== 'all') {
      filtered = filtered.filter(app => app.status === currentTab);
    }

    // Status filtering
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // Job filtering
    if (filters.job !== 'all') {
      filtered = filtered.filter(app => app.jobId === filters.job);
    }

    // Department filtering
    if (filters.department !== 'all') {
      filtered = filtered.filter(app => app.department === filters.department);
    }

    // Score filtering
    if (filters.minScore > 0) {
      filtered = filtered.filter(app => app.aiMatchScore >= filters.minScore);
    }

    // Search filtering
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.candidateName.toLowerCase().includes(searchLower) ||
        app.candidateEmail.toLowerCase().includes(searchLower) ||
        app.jobTitle.toLowerCase().includes(searchLower) ||
        app.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    // Sort by application date (newest first)
    filtered.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

    setFilteredApplications(filtered);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedApplications.length === 0) return;

    try {
      const response = await fetch('/api/company/applications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: selectedApplications,
          action
        })
      });

      if (response.ok) {
        await fetchApplications();
        setSelectedApplications([]);
      } else {
        setError('Failed to perform bulk action');
      }
    } catch (error) {
      setError('An error occurred during bulk action');
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/company/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, status: newStatus as any, lastUpdated: new Date().toISOString() }
              : app
          )
        );
      } else {
        setError('Failed to update application status');
      }
    } catch (error) {
      setError('An error occurred while updating status');
    }
  };

  const scheduleInterview = (applicationId: string, candidateId: string, jobId: string) => {
    router.push(`/company/interviews/schedule?applicationId=${applicationId}&candidateId=${candidateId}&jobId=${jobId}`);
  };

  const getTabCounts = () => {
    const counts = {
      all: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      under_review: applications.filter(app => app.status === 'under_review').length,
      interview_scheduled: applications.filter(app => app.status === 'interview_scheduled').length,
      interviewed: applications.filter(app => app.status === 'interviewed').length
    };
    return counts;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  const tabCounts = getTabCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6" />
                Application Management
              </h1>
              <p className="text-gray-600">Review and manage candidate applications</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh
              </Button>
              {selectedApplications.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleBulkAction('approve')}
                    className="text-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve ({selectedApplications.length})
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleBulkAction('reject')}
                    className="text-red-600"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject ({selectedApplications.length})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search candidates, jobs, skills..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filters.job} onValueChange={(value) => setFilters({ ...filters, job: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.department} onValueChange={(value) => setFilters({ ...filters, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="interviewed">Interviewed</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <Input
                  type="number"
                  placeholder="Min AI Score"
                  value={filters.minScore || ''}
                  onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({tabCounts.pending})</TabsTrigger>
            <TabsTrigger value="under_review">Under Review ({tabCounts.under_review})</TabsTrigger>
            <TabsTrigger value="interview_scheduled">Scheduled ({tabCounts.interview_scheduled})</TabsTrigger>
            <TabsTrigger value="interviewed">Interviewed ({tabCounts.interviewed})</TabsTrigger>
          </TabsList>

          <TabsContent value={currentTab}>
            {filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
                  <p className="text-gray-600">
                    {applications.length === 0 
                      ? "No applications have been submitted yet."
                      : "No applications match your current filters."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Checkbox
                            checked={selectedApplications.includes(application.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedApplications([...selectedApplications, application.id]);
                              } else {
                                setSelectedApplications(selectedApplications.filter(id => id !== application.id));
                              }
                            }}
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {application.candidateName}
                                </h3>
                                <p className="text-gray-600">{application.candidateEmail}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-4 w-4" />
                                    {application.currentTitle}
                                  </span>
                                  {application.candidateLocation && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {application.candidateLocation}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={statusColors[application.status]}>
                                    {statusLabels[application.status]}
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <span className="font-semibold">{application.aiMatchScore}%</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500">
                                  Applied {new Date(application.appliedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Briefcase className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{application.jobTitle}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">{application.department}</span>
                              </div>
                              
                              {application.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {application.skills.slice(0, 5).map((skill, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {application.skills.length > 5 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{application.skills.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                {application.resumeUrl && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(application.resumeUrl, '_blank')}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Resume
                                  </Button>
                                )}
                                
                                {application.videoIntroUrl && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(application.videoIntroUrl, '_blank')}
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    Video Intro
                                  </Button>
                                )}
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/company/applications/${application.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                              </div>

                              <div className="flex gap-2">
                                {application.status === 'under_review' && (
                                  <Button 
                                    size="sm"
                                    onClick={() => scheduleInterview(application.id, application.candidateId, application.jobId)}
                                  >
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Schedule Interview
                                  </Button>
                                )}

                                <Select 
                                  value={application.status} 
                                  onValueChange={(value) => handleStatusChange(application.id, value)}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="under_review">Under Review</SelectItem>
                                    <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                                    <SelectItem value="interviewed">Interviewed</SelectItem>
                                    <SelectItem value="hired">Hired</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}