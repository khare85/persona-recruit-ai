
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Users, 
  Filter, 
  Search, 
  Download,
  Eye,
  MessageSquare,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Briefcase,
  MoreHorizontal,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';

interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobId: string;
  department: string;
  appliedAt: string;
  status: string;
  aiScore: number;
  experience: string;
  location: string;
  resumeUrl?: string;
  notes?: string;
  lastActivity: string;
}

interface ApplicationStats {
  total: number;
  pending: number;
  reviewed: number;
  interviewed: number;
  hired: number;
  rejected: number;
}

export default function RecruiterApplicationsPage() {
  const { loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchApplications = useCallback(async () => {
    if (authLoading) return;
    setIsLoading(true);
    try {
      const result = await authenticatedFetch('/api/recruiter/applications');
      setApplications(result.data.applications || []);
      setStats(result.data.stats || null);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedFetch, authLoading]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (jobFilter !== 'all') {
      filtered = filtered.filter(app => app.jobId === jobFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter, jobFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'reviewed': return <Badge variant="outline"><Eye className="h-3 w-3 mr-1" />Reviewed</Badge>;
      case 'interviewed': return <Badge className="bg-blue-100 text-blue-800"><CalendarDays className="h-3 w-3 mr-1" />Interviewed</Badge>;
      case 'hired': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Hired</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAIScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">{score}%</Badge>;
    if (score >= 80) return <Badge className="bg-yellow-100 text-yellow-800">{score}%</Badge>;
    if (score >= 70) return <Badge className="bg-orange-100 text-orange-800">{score}%</Badge>;
    return <Badge variant="destructive">{score}%</Badge>;
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      // In real implementation, would call API
      setApplications(apps => 
        apps.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus, lastActivity: new Date().toISOString() }
            : app
        )
      );
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const toggleApplicationSelection = (applicationId: string) => {
    const newSelection = new Set(selectedApplications);
    if (newSelection.has(applicationId)) {
      newSelection.delete(applicationId);
    } else {
      newSelection.add(applicationId);
    }
    setSelectedApplications(newSelection);
  };

  const selectAllApplications = () => {
    if (selectedApplications.size === filteredApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredApplications.map(app => app.id)));
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      console.log(`Bulk action: ${action} on applications:`, Array.from(selectedApplications));
      // In real implementation, would call API
      if (action === 'reject') {
        setApplications(apps => 
          apps.map(app => 
            selectedApplications.has(app.id) 
              ? { ...app, status: 'rejected', lastActivity: new Date().toISOString() }
              : app
          )
        );
      }
      setSelectedApplications(new Set());
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const uniqueJobs = Array.from(new Set(applications.map(app => ({ id: app.jobId, title: app.jobTitle }))));

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Application Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage applications for your job postings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.reviewed || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviewed</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.interviewed || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hired</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.hired || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.rejected || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Application Pipeline</CardTitle>
                <CardDescription>Manage candidates for your job postings</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchApplications}>
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
                  placeholder="Search candidates or jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="interviewed">Interviewed</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {uniqueJobs.map(job => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedApplications.size > 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-md">
                <span className="text-sm font-medium">
                  {selectedApplications.size} application(s) selected
                </span>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('review')}>
                  Mark as Reviewed
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('reject')}>
                  Reject Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedApplications(new Set())}>
                  Clear Selection
                </Button>
              </div>
            )}

            {/* Applications Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                      onChange={selectAllApplications}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>AI Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedApplications.has(application.id)}
                        onChange={() => toggleApplicationSelection(application.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{application.candidateName}</div>
                        <div className="text-sm text-muted-foreground">{application.candidateEmail}</div>
                        <div className="text-xs text-muted-foreground">
                          {application.experience} • {application.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{application.jobTitle}</div>
                        <div className="text-sm text-muted-foreground">{application.department}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAIScoreBadge(application.aiScore)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(application.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {application.resumeUrl && (
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Select onValueChange={(value) => handleStatusChange(application.id, value)}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="interviewed">Interviewed</SelectItem>
                            <SelectItem value="hired">Hired</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
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
      </Container>
    </DashboardLayout>
  );
}
