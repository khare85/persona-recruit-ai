'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building, 
  Briefcase, 
  DollarSign,
  Activity,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  CalendarDays,
  Globe,
  Zap,
  MessageSquare,
  Loader2,
  AlertCircle,
  Building2,
  UserCheck,
  Award
} from 'lucide-react';

interface SystemAnalytics {
  overview: {
    totalCompanies: number;
    activeCompanies: number;
    totalUsers: number;
    candidateCount: number;
    recruiterCount: number;
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    totalInterviews: number;
    totalHires: number;
  };
  monthlyRegistrations: Array<{ month: string; count: number }>;
  topCompanies: Array<{
    id: string;
    name: string;
    jobs: number;
    applications: number;
    activity: number;
  }>;
  platformGrowth: {
    companiesGrowthRate: number;
    usersGrowthRate: number;
    applicationsGrowthRate: number;
  };
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        setError('Failed to load system analytics');
      }
    } catch (error) {
      setError('An error occurred while loading analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    if (!analytics) return;
    
    const exportData = {
      ...analytics,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    } else if (growth < 0) {
      return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    } else {
      return <div className="h-4 w-4" />;
    }
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Container className="py-8">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading system analytics...</p>
            </div>
          </div>
        </Container>
      </AdminLayout>
    );
  }

  if (!analytics) {
    return (
      <AdminLayout>
        <Container className="py-8">
          <div className="min-h-screen flex items-center justify-center">
            <Alert className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'No analytics data available'}
              </AlertDescription>
            </Alert>
          </div>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container className="py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <BarChart3 className="mr-3 h-8 w-8 text-primary" />
                System Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Platform-wide metrics and insights
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalCompanies}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{analytics.platformGrowth.companiesGrowthRate}%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{analytics.platformGrowth.usersGrowthRate}%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Job Postings</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.overview.activeJobs} currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{analytics.platformGrowth.applicationsGrowthRate}%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful Hires</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalHires}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.overview.totalApplications > 0 
                  ? Math.round((analytics.overview.totalHires / analytics.overview.totalApplications) * 100)
                  : 0}% success rate
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Registration Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>User Registration Trends</CardTitle>
                  <CardDescription>Monthly user registration over the last 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.monthlyRegistrations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>Breakdown of users by role</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Candidates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{analytics.overview.candidateCount}</span>
                        <span className="text-sm text-gray-500">
                          ({Math.round((analytics.overview.candidateCount / analytics.overview.totalUsers) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(analytics.overview.candidateCount / analytics.overview.totalUsers) * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Recruiters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{analytics.overview.recruiterCount}</span>
                        <span className="text-sm text-gray-500">
                          ({Math.round((analytics.overview.recruiterCount / analytics.overview.totalUsers) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(analytics.overview.recruiterCount / analytics.overview.totalUsers) * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>Others</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {analytics.overview.totalUsers - analytics.overview.candidateCount - analytics.overview.recruiterCount}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({Math.round(((analytics.overview.totalUsers - analytics.overview.candidateCount - analytics.overview.recruiterCount) / analytics.overview.totalUsers) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ 
                          width: `${((analytics.overview.totalUsers - analytics.overview.candidateCount - analytics.overview.recruiterCount) / analytics.overview.totalUsers) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    Platform Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Active Companies</span>
                      <span className="font-semibold">
                        {Math.round((analytics.overview.activeCompanies / analytics.overview.totalCompanies) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Jobs</span>
                      <span className="font-semibold">
                        {Math.round((analytics.overview.activeJobs / analytics.overview.totalJobs) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Interview Rate</span>
                      <span className="font-semibold">
                        {analytics.overview.totalApplications > 0 
                          ? Math.round((analytics.overview.totalInterviews / analytics.overview.totalApplications) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                    Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Interviews</span>
                      <span className="font-semibold">{analytics.overview.totalInterviews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Applications</span>
                      <span className="font-semibold">{analytics.overview.totalApplications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Hires</span>
                      <span className="font-semibold">{analytics.overview.totalHires}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Success Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Hire Success Rate</span>
                      <span className="font-semibold">
                        {analytics.overview.totalApplications > 0 
                          ? Math.round((analytics.overview.totalHires / analytics.overview.totalApplications) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg. Applications/Job</span>
                      <span className="font-semibold">
                        {analytics.overview.totalJobs > 0 
                          ? Math.round(analytics.overview.totalApplications / analytics.overview.totalJobs)
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Platform Status</span>
                      <span className="font-semibold text-green-600">Healthy</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Growth Metrics</CardTitle>
                <CardDescription>Month-over-month growth across key metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">+{analytics.platformGrowth.companiesGrowthRate}%</div>
                    <p className="text-sm text-green-700">Company Growth</p>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">+{analytics.platformGrowth.usersGrowthRate}%</div>
                    <p className="text-sm text-blue-700">User Growth</p>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">+{analytics.platformGrowth.applicationsGrowthRate}%</div>
                    <p className="text-sm text-purple-700">Application Growth</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Registration Breakdown</CardTitle>
                <CardDescription>Detailed monthly registration data</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.monthlyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="companies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Active Companies</CardTitle>
                <CardDescription>Companies ranked by activity (jobs posted + applications received)</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.topCompanies.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topCompanies.map((company, index) => (
                      <div key={company.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{company.name}</h4>
                            <p className="text-sm text-gray-600">
                              {company.jobs} jobs • {company.applications} applications
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {company.activity} total activity
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No company data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Efficiency</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Hire Rate</span>
                        <span>{analytics.overview.totalApplications > 0 
                          ? Math.round((analytics.overview.totalHires / analytics.overview.totalApplications) * 100)
                          : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${analytics.overview.totalApplications > 0 
                              ? (analytics.overview.totalHires / analytics.overview.totalApplications) * 100
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Interview Conversion</span>
                        <span>{analytics.overview.totalApplications > 0 
                          ? Math.round((analytics.overview.totalInterviews / analytics.overview.totalApplications) * 100)
                          : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${analytics.overview.totalApplications > 0 
                              ? (analytics.overview.totalInterviews / analytics.overview.totalApplications) * 100
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Company Activation</span>
                        <span>{analytics.overview.totalCompanies > 0 
                          ? Math.round((analytics.overview.activeCompanies / analytics.overview.totalCompanies) * 100)
                          : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: `${analytics.overview.totalCompanies > 0 
                              ? (analytics.overview.activeCompanies / analytics.overview.totalCompanies) * 100
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Utilization</CardTitle>
                  <CardDescription>How platform resources are being used</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Jobs per Company</span>
                      <span className="font-semibold">
                        {analytics.overview.totalCompanies > 0 
                          ? Math.round(analytics.overview.totalJobs / analytics.overview.totalCompanies)
                          : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Applications per Job</span>
                      <span className="font-semibold">
                        {analytics.overview.totalJobs > 0 
                          ? Math.round(analytics.overview.totalApplications / analytics.overview.totalJobs)
                          : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Recruiters per Company</span>
                      <span className="font-semibold">
                        {analytics.overview.totalCompanies > 0 
                          ? Math.round(analytics.overview.recruiterCount / analytics.overview.totalCompanies)
                          : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Success Rate</span>
                      <span className="font-semibold text-green-600">
                        {analytics.overview.totalApplications > 0 
                          ? Math.round((analytics.overview.totalHires / analytics.overview.totalApplications) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Container>
    </AdminLayout>
  );
}