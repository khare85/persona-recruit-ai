'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Calendar,
  Globe,
  Zap,
  MessageSquare
} from 'lucide-react';

const platformMetrics = {
  users: {
    total: 2847,
    growth: 12.5,
    newThisMonth: 342,
    activeToday: 1256
  },
  companies: {
    total: 142,
    growth: 8.3,
    newThisMonth: 8,
    enterprise: 23
  },
  jobs: {
    total: 1847,
    growth: 15.2,
    activeToday: 567,
    newThisWeek: 89
  },
  revenue: {
    total: 324500,
    growth: 18.7,
    thisMonth: 78200,
    avgPerCompany: 2287
  },
  aiUsage: {
    totalSearches: 15670,
    growth: 23.1,
    avgPerDay: 521,
    successRate: 94.2
  },
  interviews: {
    total: 2156,
    growth: 19.4,
    aiInterviews: 1894,
    completionRate: 87.8
  }
};

const topPerformingCompanies = [
  { name: 'TechCorp Inc.', revenue: 28000, hires: 45, growth: 23 },
  { name: 'NextGen Robotics', revenue: 25600, hires: 67, growth: 18 },
  { name: 'CloudScale Solutions', revenue: 18900, hires: 23, growth: 15 },
  { name: 'DataDriven Analytics', revenue: 16200, hires: 34, growth: 12 },
  { name: 'InnovateTech Solutions', revenue: 14800, hires: 29, growth: 9 }
];

const recentActivity = [
  { type: 'user', message: '47 new user registrations today', time: '2 min ago', trend: 'up' },
  { type: 'revenue', message: '$12,400 in new subscriptions', time: '15 min ago', trend: 'up' },
  { type: 'ai', message: '1,250 AI searches completed', time: '30 min ago', trend: 'up' },
  { type: 'interview', message: '23 AI interviews conducted', time: '1 hour ago', trend: 'up' },
  { type: 'support', message: '8 support tickets resolved', time: '2 hours ago', trend: 'neutral' }
];

export default function AdminAnalyticsPage() {
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

  return (
    <AdminLayout>
      <Container className="py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <BarChart3 className="mr-3 h-8 w-8 text-primary" />
                Analytics & Reports
              </h1>
              <p className="text-muted-foreground mt-1">
                Platform performance metrics, user behavior insights, and business intelligence
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Custom Date Range
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformMetrics.users.total.toLocaleString()}</div>
              <div className="flex items-center space-x-2 text-xs">
                {getGrowthIcon(platformMetrics.users.growth)}
                <span className={getGrowthColor(platformMetrics.users.growth)}>
                  +{platformMetrics.users.growth}% from last month
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {platformMetrics.users.activeToday} active today • {platformMetrics.users.newThisMonth} new this month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformMetrics.companies.total}</div>
              <div className="flex items-center space-x-2 text-xs">
                {getGrowthIcon(platformMetrics.companies.growth)}
                <span className={getGrowthColor(platformMetrics.companies.growth)}>
                  +{platformMetrics.companies.growth}% from last month
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {platformMetrics.companies.enterprise} enterprise • {platformMetrics.companies.newThisMonth} new this month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${platformMetrics.revenue.total.toLocaleString()}</div>
              <div className="flex items-center space-x-2 text-xs">
                {getGrowthIcon(platformMetrics.revenue.growth)}
                <span className={getGrowthColor(platformMetrics.revenue.growth)}>
                  +{platformMetrics.revenue.growth}% from last month
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ${platformMetrics.revenue.avgPerCompany} avg per company
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformMetrics.jobs.total.toLocaleString()}</div>
              <div className="flex items-center space-x-2 text-xs">
                {getGrowthIcon(platformMetrics.jobs.growth)}
                <span className={getGrowthColor(platformMetrics.jobs.growth)}>
                  +{platformMetrics.jobs.growth}% from last month
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {platformMetrics.jobs.activeToday} active today • {platformMetrics.jobs.newThisWeek} new this week
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Usage</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformMetrics.aiUsage.totalSearches.toLocaleString()}</div>
              <div className="flex items-center space-x-2 text-xs">
                {getGrowthIcon(platformMetrics.aiUsage.growth)}
                <span className={getGrowthColor(platformMetrics.aiUsage.growth)}>
                  +{platformMetrics.aiUsage.growth}% from last month
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {platformMetrics.aiUsage.avgPerDay} avg per day • {platformMetrics.aiUsage.successRate}% success rate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Interviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformMetrics.interviews.total.toLocaleString()}</div>
              <div className="flex items-center space-x-2 text-xs">
                {getGrowthIcon(platformMetrics.interviews.growth)}
                <span className={getGrowthColor(platformMetrics.interviews.growth)}>
                  +{platformMetrics.interviews.growth}% from last month
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {platformMetrics.interviews.aiInterviews} AI powered • {platformMetrics.interviews.completionRate}% completion rate
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Companies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                    Top Performing Companies
                  </CardTitle>
                  <CardDescription>Companies by revenue and hiring activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformingCompanies.map((company, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {company.hires} hires • ${company.revenue.toLocaleString()} revenue
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          +{company.growth}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Feed */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5 text-primary" />
                    Real-time Activity
                  </CardTitle>
                  <CardDescription>Latest platform activity and milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'user' ? 'bg-blue-500' :
                          activity.type === 'revenue' ? 'bg-green-500' :
                          activity.type === 'ai' ? 'bg-purple-500' :
                          activity.type === 'interview' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                        {activity.trend === 'up' && (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-primary" />
                  Platform Health & Performance
                </CardTitle>
                <CardDescription>System metrics and operational status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">99.2%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">142ms</div>
                    <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">94.8%</div>
                    <div className="text-sm text-muted-foreground">AI Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">8</div>
                    <div className="text-sm text-muted-foreground">Open Issues</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
                <CardDescription>Detailed platform usage patterns and user behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Advanced usage analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Financial performance and subscription metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Revenue analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>System performance and optimization insights</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Performance metrics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </AdminLayout>
  );
}