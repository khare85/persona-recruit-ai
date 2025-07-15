"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Briefcase, 
  Building, 
  MapPin, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Video,
  Eye,
  MessageSquare,
  DollarSign,
  Loader2
} from 'lucide-react';

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo: string;
  location: string;
  salary: string;
  appliedAt: string;
  status: 'submitted' | 'under_review' | 'interview_scheduled' | 'rejected' | 'offer';
  applicationMethod: 'quick_apply' | 'full_application';
  lastActivity: string;
  interviews?: {
    type: string;
    date: string;
    status: 'scheduled' | 'completed' | 'cancelled';
  }[];
  coverNote?: string;
}

// Mock data
const mockApplications: Application[] = [
  {
    id: '1',
    jobId: '1',
    jobTitle: 'Senior Frontend Engineer',
    company: 'TechCorp Inc.',
    companyLogo: 'https://placehold.co/100x100.png',
    location: 'Remote',
    salary: '$120,000 - $150,000',
    appliedAt: '2024-06-20T10:00:00Z',
    status: 'under_review',
    applicationMethod: 'quick_apply',
    lastActivity: '2024-06-21T14:30:00Z',
    coverNote: 'Excited to contribute to your innovative team with my React expertise.'
  },
  {
    id: '2',
    jobId: '2',
    jobTitle: 'Full Stack Developer',
    company: 'InnovateLabs',
    companyLogo: 'https://placehold.co/100x100.png',
    location: 'San Francisco, CA',
    salary: '$100,000 - $130,000',
    appliedAt: '2024-06-18T09:00:00Z',
    status: 'interview_scheduled',
    applicationMethod: 'quick_apply',
    lastActivity: '2024-06-19T16:00:00Z',
    interviews: [
      {
        type: 'Technical Interview',
        date: '2024-06-25T14:00:00Z',
        status: 'scheduled'
      }
    ]
  },
  {
    id: '3',
    jobId: '3',
    jobTitle: 'Software Engineer',
    company: 'StartupXYZ',
    companyLogo: 'https://placehold.co/100x100.png',
    location: 'Austin, TX',
    salary: '$90,000 - $120,000',
    appliedAt: '2024-06-15T11:30:00Z',
    status: 'rejected',
    applicationMethod: 'full_application',
    lastActivity: '2024-06-17T10:00:00Z'
  }
];

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplications() {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`/api/applications?candidateId=${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        const result = await response.json();
        
        // Map the API response to match our Application interface
        const mappedApplications = result.data.map((app: any) => ({
          id: app.id,
          jobId: app.jobId,
          jobTitle: app.jobTitle || 'Unknown Position',
          company: app.companyName || 'Unknown Company',
          companyLogo: '/company-placeholder.png',
          location: app.location || 'Not specified',
          salary: app.salary || 'Not disclosed',
          appliedAt: app.appliedAt || app.createdAt,
          status: app.status || 'submitted',
          applicationMethod: app.coverLetter ? 'full_application' : 'quick_apply',
          lastActivity: app.updatedAt || app.appliedAt || app.createdAt,
          interviews: app.interviews || [],
          coverNote: app.coverLetter
        }));
        
        setApplications(mappedApplications);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchApplications();
  }, [user?.id]);

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && ['submitted', 'under_review', 'interview_scheduled'].includes(app.status);
    if (activeTab === 'archived') return matchesSearch && ['rejected', 'offer'].includes(app.status);
    return matchesSearch;
  });

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'under_review': return <Eye className="h-4 w-4" />;
      case 'interview_scheduled': return <MessageSquare className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'offer': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: Application['status']) => {
    switch (status) {
      case 'submitted': return 'secondary';
      case 'under_review': return 'default';
      case 'interview_scheduled': return 'outline';
      case 'rejected': return 'destructive';
      case 'offer': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: Application['status']) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const activeCount = applications.filter(app => 
    ['submitted', 'under_review', 'interview_scheduled'].includes(app.status)
  ).length;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Error Loading Applications</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" />
          My Applications
        </h1>
        <p className="text-muted-foreground">
          Track and manage all your job applications in one place
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Interviews Scheduled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {applications.filter(app => app.status === 'interview_scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Response Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((applications.filter(app => app.status !== 'submitted').length / applications.length) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by job title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Applications Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({applications.length - activeCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No applications found</p>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <img
                        src={application.companyLogo}
                        alt={application.company}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">{application.jobTitle}</h3>
                            <p className="text-muted-foreground">{application.company}</p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(application.status)} className="flex items-center gap-1">
                            {getStatusIcon(application.status)}
                            {getStatusText(application.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {application.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {application.salary}
                          </span>
                          {application.applicationMethod === 'quick_apply' && (
                            <Badge variant="secondary" className="text-xs">
                              <Video className="h-3 w-3 mr-1" />
                              Quick Apply
                            </Badge>
                          )}
                        </div>

                        {application.coverNote && (
                          <p className="text-sm text-muted-foreground italic mb-3">
                            "{application.coverNote}"
                          </p>
                        )}

                        {application.interviews && application.interviews.length > 0 && (
                          <div className="bg-muted/50 rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium mb-1">Upcoming Interview:</p>
                            <p className="text-sm text-muted-foreground">
                              {application.interviews[0].type} - {new Date(application.interviews[0].date).toLocaleString()}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            Applied {new Date(application.appliedAt).toLocaleDateString()} • 
                            Last activity {new Date(application.lastActivity).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            {application.status === 'interview_scheduled' && (
                              <Button size="sm">
                                Prepare for Interview
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}