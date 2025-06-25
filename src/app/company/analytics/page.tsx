'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  CalendarDays,
  UserCheck,
  Building,
  Filter,
  Download,
  Loader2,
  AlertCircle,
  Star,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnalyticsData {
  overview: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    pendingApplications: number;
    totalInterviews: number;
    scheduledInterviews: number;
    totalHires: number;
    recruiters: number;
  };
  applicationsByStatus: Record<string, number>;
  monthlyApplications: Array<{ month: string; count: number }>;
  topJobs: Array<{
    jobId: string;
    title: string;
    department: string;
    applications: number;
  }>;
  averageMatchScore: number;
}

const statusColors = {
  pending: '#f59e0b',
  under_review: '#3b82f6',
  interview_scheduled: '#8b5cf6',
  interviewed: '#6366f1',
  hired: '#10b981',
  rejected: '#ef4444'
};

const statusLabels = {
  pending: 'Pending',
  under_review: 'Under Review',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  hired: 'Hired',
  rejected: 'Rejected'
};

export default function CompanyAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('12m');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/company/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        setError('Failed to load analytics data');
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
    a.download = `company-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'No analytics data available'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Prepare pie chart data
  const pieChartData = Object.entries(analytics.applicationsByStatus).map(([status, count]) => ({
    name: statusLabels[status as keyof typeof statusLabels] || status,
    value: count,
    color: statusColors[status as keyof typeof statusColors] || '#6b7280'
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Company Analytics
              </h1>
              <p className="text-gray-600">Insights and metrics for your recruitment performance</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh
              </Button>
              <Button onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.overview.activeJobs} active positions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.overview.pendingApplications} pending review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.overview.totalInterviews}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.overview.scheduledInterviews} scheduled
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
                  : 0}% conversion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="jobs">Top Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Application Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Trends</CardTitle>
                  <CardDescription>Monthly application volume over the last 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.monthlyApplications}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Application Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Status Distribution</CardTitle>
                  <CardDescription>Breakdown of applications by current status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Average Match Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.averageMatchScore}%</div>
                  <p className="text-sm text-gray-600">AI-powered candidate matching</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Active Recruiters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.overview.recruiters}</div>
                  <p className="text-sm text-gray-600">Team members recruiting</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-500" />
                    Response Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analytics.overview.totalApplications > 0 
                      ? Math.round(((analytics.overview.totalApplications - analytics.overview.pendingApplications) / analytics.overview.totalApplications) * 100)
                      : 0}%
                  </div>
                  <p className="text-sm text-gray-600">Applications reviewed</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Status Breakdown</CardTitle>
                <CardDescription>Detailed view of application statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.applicationsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {status === 'hired' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
                          {status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                          {!['hired', 'rejected', 'pending'].includes(status) && <Users className="h-4 w-4 text-blue-500" />}
                          <span className="font-medium">
                            {statusLabels[status as keyof typeof statusLabels] || status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{count}</Badge>
                        <span className="text-sm text-gray-600">
                          {analytics.overview.totalApplications > 0 
                            ? Math.round((count / analytics.overview.totalApplications) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>How candidates progress through your hiring process</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Total Applications</span>
                      <span className="font-semibold">{analytics.overview.totalApplications}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Under Review</span>
                      <span className="font-semibold">{analytics.applicationsByStatus.under_review || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Interviews Scheduled</span>
                      <span className="font-semibold">{analytics.applicationsByStatus.interview_scheduled || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Interviewed</span>
                      <span className="font-semibold">{analytics.applicationsByStatus.interviewed || 0}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">Hired</span>
                      <span className="font-bold text-green-600">{analytics.overview.totalHires}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                  <CardDescription>Important performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Hire Rate</span>
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
                        <span>Interview Rate</span>
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
                        <span>Response Rate</span>
                        <span>{analytics.overview.totalApplications > 0 
                          ? Math.round(((analytics.overview.totalApplications - analytics.overview.pendingApplications) / analytics.overview.totalApplications) * 100)
                          : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: `${analytics.overview.totalApplications > 0 
                              ? ((analytics.overview.totalApplications - analytics.overview.pendingApplications) / analytics.overview.totalApplications) * 100
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Jobs</CardTitle>
                <CardDescription>Jobs with the most applications</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.topJobs.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topJobs.map((job, index) => (
                      <div key={job.jobId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{job.title}</h4>
                            <p className="text-sm text-gray-600">{job.department}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{job.applications} applications</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No job data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
