
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Copy,
  MoreHorizontal,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  DollarSign,
  RefreshCw,
  Download,
  Share
} from 'lucide-react';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  status: 'active' | 'paused' | 'closed' | 'draft';
  applications: number;
  views: number;
  hires: number;
  postedAt: string;
  deadline?: string;
  description: string;
  requirements: string[];
  benefits: string[];
}

interface JobStats {
  total: number;
  active: number;
  paused: number;
  closed: number;
  draft: number;
  totalApplications: number;
  totalViews: number;
  totalHires: number;
}

export default function RecruiterJobsPage() {
  const { getToken, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const fetchJobs = useCallback(async () => {
    if (authLoading) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        console.error('No auth token found');
        setIsLoading(false);
        return;
      }
      const response = await fetch('/api/recruiter/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setJobs(result.data.jobs || []);
        setStats(result.data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, authLoading]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(job => job.department === departmentFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, departmentFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused': return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'closed': return <Badge variant="destructive">Closed</Badge>;
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch('/api/recruiter/jobs', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId, status: newStatus })
      });

      if (response.ok) {
        // Update local state after successful API call
        setJobs(jobs => 
          jobs.map(job => 
            job.id === jobId 
              ? { ...job, status: newStatus as Job['status'] }
              : job
          )
        );
      } else {
        console.error('Failed to update job status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const duplicateJob = async (jobId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch('/api/recruiter/jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId })
      });

      if (response.ok) {
        const result = await response.json();
        const duplicatedJob = result.data;
        
        // Map the API response to match our local Job interface
        const mappedJob: Job = {
          id: duplicatedJob.id,
          title: duplicatedJob.title,
          department: duplicatedJob.department,
          location: duplicatedJob.location,
          employmentType: duplicatedJob.type,
          salaryRange: duplicatedJob.salary || 'Not specified',
          status: duplicatedJob.status,
          applications: duplicatedJob.stats.applications || 0,
          views: duplicatedJob.stats.views || 0,
          hires: duplicatedJob.stats.offers || 0,
          postedAt: duplicatedJob.createdAt,
          deadline: duplicatedJob.applicationDeadline,
          description: duplicatedJob.description,
          requirements: duplicatedJob.qualifications || [],
          benefits: duplicatedJob.benefits || []
        };

        // Add the new job to the local state
        setJobs([mappedJob, ...jobs]);
        
        // Refresh the job list to get updated stats
        fetchJobs();
      } else {
        console.error('Failed to duplicate job');
      }
    } catch (error) {
      console.error('Error duplicating job:', error);
    }
  };

  const uniqueDepartments = Array.from(new Set(jobs.map(job => job.department)));

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Briefcase className="mr-3 h-8 w-8 text-primary" />
            Job Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your job postings and track their performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.active || 0} active, {stats?.paused || 0} paused
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
              <p className="text-xs text-muted-foreground">Across all jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
              <p className="text-xs text-muted-foreground">Job page views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hires</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.totalHires || 0}</div>
              <p className="text-xs text-muted-foreground">Successful placements</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all-jobs" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all-jobs">All Jobs ({stats?.total || 0})</TabsTrigger>
              <TabsTrigger value="active">Active ({stats?.active || 0})</TabsTrigger>
              <TabsTrigger value="drafts">Drafts ({stats?.draft || 0})</TabsTrigger>
            </TabsList>
            <Link href="/jobs/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Post New Job
              </Button>
            </Link>
          </div>

          <TabsContent value="all-jobs">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Job Listings</CardTitle>
                    <CardDescription>Manage and track your job postings</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchJobs}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {uniqueDepartments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Jobs Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <Link href={`/jobs/${job.id}`} className="font-medium hover:text-primary transition-colors">
                              {job.title}
                            </Link>
                            <div className="text-sm text-muted-foreground">{job.employmentType}</div>
                          </div>
                        </TableCell>
                        <TableCell>{job.department}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                            {job.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(job.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                            {job.applications}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Eye className="h-3 w-3 mr-1 text-muted-foreground" />
                            {job.views}
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/jobs/${job.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/jobs/${job.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => duplicateJob(job.id)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Select onValueChange={(value) => handleStatusChange(job.id, value)}>
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Jobs</CardTitle>
                <CardDescription>Currently published and accepting applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredJobs.filter(job => job.status === 'active').map((job) => (
                    <div key={job.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-semibold">{job.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {job.department} • {job.location} • {job.employmentType}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {job.applications} applications • {job.views} views
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/recruiter/applications?job=${job.id}`}>
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-1" />
                            View Applications
                          </Button>
                        </Link>
                        <Link href={`/jobs/${job.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Share className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drafts">
            <Card>
              <CardHeader>
                <CardTitle>Draft Jobs</CardTitle>
                <CardDescription>Jobs that haven't been published yet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Draft Jobs</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any draft jobs at the moment.
                  </p>
                  <Link href="/jobs/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Job
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}
