
'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
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
  XCircle,
  BarChart3,
  Activity,
  RefreshCw,
  Target
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';

interface RecruiterMetrics {
  totalApplications: number;
  activeJobs: number;
  hireRate: number;
  avgTimeToHire: number;
  interviewConversionRate: number;
  totalHires: number;
  applicationsThisMonth: number;
  hiresThisMonth: number;
}

interface JobPerformance {
  id: string;
  title: string;
  applications: number;
  views: number;
  hires: number;
  conversionRate: number;
  avgTimeToFill: number;
  status: string;
}

interface MonthlyTrend {
  month: string;
  applications: number;
  interviews: number;
  hires: number;
}

interface SourceMetrics {
  source: string;
  applications: number;
  hires: number;
  conversionRate: number;
}

export default function RecruiterAnalyticsPage() {
  const [metrics, setMetrics] = useState<RecruiterMetrics | null>(null);
  const [jobPerformance, setJobPerformance] = useState<JobPerformance[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [sourceMetrics, setSourceMetrics] = useState<SourceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('last-3-months');
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authenticatedFetch(`/api/recruiter/analytics?timeRange=${timeRange}`);
      setMetrics(result.data.metrics);
      setJobPerformance(result.data.jobPerformance);
      setMonthlyTrends(result.data.monthlyTrends);
      setSourceMetrics(result.data.sourceMetrics);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while loading analytics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, authenticatedFetch]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <BarChart3 className="mr-3 h-8 w-8 text-primary" />
            Recruitment Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your recruitment performance and identify optimization opportunities
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAnalytics}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalApplications || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{metrics?.applicationsThisMonth || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.activeJobs || 0}</div>
              <p className="text-xs text-muted-foreground">Currently recruiting</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hire Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.hireRate || 0}%</div>
              <p className="text-xs text-muted-foreground">Application to hire conversion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.avgTimeToHire || 0} days</div>
              <p className="text-xs text-muted-foreground">From application to offer</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Job Performance</TabsTrigger>
            <TabsTrigger value="sources">Source Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-primary" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Total Hires</div>
                      <div className="text-sm text-muted-foreground">All time</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{metrics?.totalHires || 0}</div>
                      <div className="text-xs text-muted-foreground">+{metrics?.hiresThisMonth || 0} this month</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Interview Conversion</div>
                      <div className="text-sm text-muted-foreground">Interview to hire rate</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{metrics?.interviewConversionRate || 0}%</div>
                      <div className="text-xs text-muted-foreground">Above average</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                    Monthly Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyTrends.map((trend, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="font-medium">{trend.month}</div>
                        <div className="flex gap-4 text-sm">
                          <span>{trend.applications} apps</span>
                          <span>{trend.interviews} interviews</span>
                          <span className="text-green-600 font-medium">{trend.hires} hires</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Job Performance Analysis</CardTitle>
                <CardDescription>Performance metrics for your active and recent job postings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobPerformance.map((job) => (
                    <div key={job.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{job.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {job.applications} applications • {job.views} views • {job.hires} hires
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">{job.conversionRate}%</span> conversion
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {job.avgTimeToFill} days avg.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Source Performance</CardTitle>
                <CardDescription>Analyze which sources bring the best candidates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sourceMetrics.map((source) => (
                    <div key={source.source} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{source.source}</div>
                        <div className="text-sm text-muted-foreground">
                          {source.applications} applications • {source.hires} hires
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{source.conversionRate}%</div>
                        <div className="text-xs text-muted-foreground">conversion rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Trends</CardTitle>
                  <CardDescription>Monthly application volume over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {monthlyTrends.map((trend, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-primary rounded-t-sm"
                          style={{ height: `${(trend.applications / 100) * 200}px` }}
                        ></div>
                        <div className="text-xs mt-2 text-center">{trend.month.split(' ')[0]}</div>
                        <div className="text-xs font-medium">{trend.applications}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hiring Funnel</CardTitle>
                  <CardDescription>Conversion rates through your hiring process</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Applications</span>
                      <span className="font-semibold">{metrics?.totalApplications || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Interviews</span>
                      <span className="font-semibold">{Math.round((metrics?.totalApplications || 0) * 0.3)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Offers</span>
                      <span className="font-semibold">{Math.round((metrics?.totalApplications || 0) * 0.18)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '18%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Hires</span>
                      <span className="font-bold text-green-600">{metrics?.totalHires || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${metrics?.hireRate || 0}%` }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}
