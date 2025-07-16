'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Brain, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Calendar, 
  Clock, 
  Star,
  Eye,
  MessageCircle,
  BarChart3,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SemanticSearch, SearchResult, SearchFilters } from '@/components/search/SemanticSearch';
import { useJobStatus } from '@/hooks/useJobStatus';
import { JobStatusBadge } from '@/components/job-status/JobStatusBadge';
import { ApplicationStatusBadge } from '@/components/job-status/ApplicationStatusBadge';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { AIProcessingStatus } from '@/components/ai/AIProcessingStatus';

interface DashboardStats {
  totalCandidates: number;
  activeJobs: number;
  pendingApplications: number;
  interviewsScheduled: number;
  hiredThisMonth: number;
  averageTimeToHire: number;
}

interface RecentActivity {
  id: string;
  type: 'application' | 'interview' | 'hire' | 'job_posted' | 'candidate_matched';
  title: string;
  description: string;
  timestamp: Date;
  status: string;
  metadata: any;
}

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  status: 'draft' | 'active' | 'paused' | 'closed';
  applicants: number;
  views: number;
  daysActive: number;
  urgency: 'low' | 'medium' | 'high';
  aiGenerated: boolean;
}

interface CandidateMatch {
  id: string;
  name: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  matchScore: number;
  avatar?: string;
  lastActive: string;
  status: 'new' | 'contacted' | 'interviewing' | 'hired' | 'rejected';
}

export default function RecruiterDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { jobStatuses, recentUpdates } = useJobStatus();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 1247,
    activeJobs: 8,
    pendingApplications: 34,
    interviewsScheduled: 12,
    hiredThisMonth: 5,
    averageTimeToHire: 18
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'application',
      title: 'New Application',
      description: 'Sarah Chen applied for Senior React Developer',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      status: 'pending',
      metadata: { candidateId: '1', jobId: '1' }
    },
    {
      id: '2',
      type: 'interview',
      title: 'Interview Completed',
      description: 'Michael Rodriguez completed AI interview for Full Stack Developer',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'completed',
      metadata: { candidateId: '2', jobId: '2', score: 85 }
    },
    {
      id: '3',
      type: 'candidate_matched',
      title: 'High Match Found',
      description: 'AI found 95% match for DevOps Engineer position',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'new',
      metadata: { candidateId: '3', jobId: '3', matchScore: 95 }
    }
  ]);
  
  const [jobs, setJobs] = useState<JobPosting[]>([
    {
      id: '1',
      title: 'Senior React Developer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      status: 'active',
      applicants: 23,
      views: 145,
      daysActive: 5,
      urgency: 'high',
      aiGenerated: true
    },
    {
      id: '2',
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote',
      status: 'active',
      applicants: 41,
      views: 298,
      daysActive: 12,
      urgency: 'medium',
      aiGenerated: false
    },
    {
      id: '3',
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'New York, NY',
      status: 'paused',
      applicants: 15,
      views: 87,
      daysActive: 8,
      urgency: 'low',
      aiGenerated: true
    }
  ]);
  
  const [topCandidates, setTopCandidates] = useState<CandidateMatch[]>([
    {
      id: '1',
      name: 'Sarah Chen',
      title: 'Senior Frontend Developer',
      location: 'San Francisco, CA',
      experience: '6 years',
      skills: ['React', 'TypeScript', 'GraphQL', 'Node.js'],
      matchScore: 95,
      lastActive: '2 hours ago',
      status: 'new'
    },
    {
      id: '2',
      name: 'Michael Rodriguez',
      title: 'Full Stack Engineer',
      location: 'Austin, TX',
      experience: '4 years',
      skills: ['Python', 'Django', 'React', 'PostgreSQL'],
      matchScore: 92,
      lastActive: '1 day ago',
      status: 'contacted'
    },
    {
      id: '3',
      name: 'Emily Johnson',
      title: 'DevOps Engineer',
      location: 'Remote',
      experience: '5 years',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
      matchScore: 88,
      lastActive: '3 hours ago',
      status: 'interviewing'
    }
  ]);

  // Handle semantic search
  const handleSearch = async (query: string, filters: SearchFilters): Promise<SearchResult[]> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResults: SearchResult[] = [
          {
            id: '1',
            type: 'candidate',
            title: 'Sarah Chen',
            subtitle: 'Senior Frontend Developer',
            description: 'Experienced React developer with 6+ years building scalable web applications. Strong in TypeScript, GraphQL, and modern frontend frameworks.',
            tags: ['React', 'TypeScript', 'GraphQL', 'Node.js'],
            metadata: {
              location: 'San Francisco, CA',
              experience: '6 years',
              skills: ['React', 'TypeScript', 'GraphQL', 'Node.js'],
              matchScore: 95,
              lastActive: '2 hours ago'
            },
            featured: true
          },
          {
            id: '2',
            type: 'candidate',
            title: 'Michael Rodriguez',
            subtitle: 'Full Stack Engineer',
            description: 'Full-stack developer with expertise in Python, Django, and modern web technologies. Passionate about building robust backend systems.',
            tags: ['Python', 'Django', 'React', 'PostgreSQL'],
            metadata: {
              location: 'Austin, TX',
              experience: '4 years',
              skills: ['Python', 'Django', 'React', 'PostgreSQL'],
              matchScore: 92,
              lastActive: '1 day ago'
            }
          }
        ];
        resolve(mockResults);
      }, 1000);
    });
  };

  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'candidate') {
      router.push(`/recruiter/candidates/${result.id}`);
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application': return <Users className="w-4 h-4" />;
      case 'interview': return <Calendar className="w-4 h-4" />;
      case 'hire': return <CheckCircle className="w-4 h-4" />;
      case 'job_posted': return <Briefcase className="w-4 h-4" />;
      case 'candidate_matched': return <Target className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-orange-100 text-orange-800';
      case 'interviewing': return 'bg-purple-100 text-purple-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'recruiter') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.firstName}!</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <Button 
                onClick={() => router.push('/recruiter/jobs/new')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post New Job
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI-Powered Search */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Candidate Search</h2>
          <SemanticSearch
            type="candidate"
            placeholder="Search for candidates with natural language... (e.g., 'React developer with 5+ years in fintech')"
            onSearch={handleSearch}
            onResultClick={handleResultClick}
            showFilters={true}
            showSuggestions={true}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Candidates</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCandidates.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Interviews Scheduled</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.interviewsScheduled}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hired This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.hiredThisMonth}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Time to Hire</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageTimeToHire}d</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Processing Status */}
            <AIProcessingStatus showHistory={false} />
            
            {/* Job Postings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Active Job Postings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <JobStatusBadge status={job.status} />
                          {job.urgency === 'high' && (
                            <Badge variant="destructive" className="text-xs">
                              <Zap className="w-3 h-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                          {job.aiGenerated && (
                            <Badge variant="outline" className="text-xs">
                              <Brain className="w-3 h-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {job.department} • {job.location} • {job.daysActive} days active
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {job.applicants} applicants
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {job.views} views
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/recruiter/jobs/${job.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{activity.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {activity.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                        <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Top Candidates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Top AI Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCandidates.map(candidate => (
                    <div key={candidate.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={candidate.avatar} />
                          <AvatarFallback>
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {candidate.matchScore}% match
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{candidate.title}</p>
                          <p className="text-xs text-gray-500 mb-2">
                            {candidate.location} • {candidate.experience} • {candidate.lastActive}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {candidate.skills.slice(0, 3).map(skill => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getStatusColor(candidate.status)}`}>
                              {candidate.status}
                            </Badge>
                            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/recruiter/jobs/new')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Job
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/recruiter/candidates')}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Candidates
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/recruiter/interviews')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Interview
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/recruiter/analytics')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}