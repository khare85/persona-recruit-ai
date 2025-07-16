'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Building2, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Activity,
  Server,
  Globe,
  Database,
  Zap,
  Eye,
  Settings,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Monitor,
  Cpu,
  HardDrive,
  Network,
  Mail,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw,
  Power,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCompanies: number;
  activeCompanies: number;
  totalJobs: number;
  totalApplications: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  apiLatency: number;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  networkTraffic: number;
}

interface PlatformStats {
  revenue: number;
  monthlyGrowth: number;
  churnRate: number;
  conversionRate: number;
  supportTickets: number;
  errorRate: number;
  uptime: number;
}

interface CompanyOverview {
  id: string;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise';
  users: number;
  jobsPosted: number;
  applications: number;
  revenue: number;
  status: 'active' | 'suspended' | 'trial';
  lastActivity: Date;
  billingStatus: 'current' | 'overdue' | 'cancelled';
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  resolved: boolean;
}

interface UserActivity {
  id: string;
  userType: 'candidate' | 'recruiter' | 'company_admin' | 'super_admin';
  action: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
  status: 'success' | 'failed' | 'pending';
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);
  
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 12847,
    activeUsers: 8934,
    totalCompanies: 1247,
    activeCompanies: 892,
    totalJobs: 5634,
    totalApplications: 89456,
    systemHealth: 'healthy',
    apiLatency: 125,
    cpuUsage: 68,
    memoryUsage: 74,
    storageUsage: 45,
    networkTraffic: 2.4
  });
  
  const [stats, setStats] = useState<PlatformStats>({
    revenue: 284750,
    monthlyGrowth: 18.5,
    churnRate: 3.2,
    conversionRate: 12.8,
    supportTickets: 23,
    errorRate: 0.02,
    uptime: 99.97
  });
  
  const [topCompanies, setTopCompanies] = useState<CompanyOverview[]>([
    {
      id: '1',
      name: 'TechCorp Solutions',
      plan: 'enterprise',
      users: 156,
      jobsPosted: 45,
      applications: 2847,
      revenue: 12500,
      status: 'active',
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      billingStatus: 'current'
    },
    {
      id: '2',
      name: 'StartupX Inc',
      plan: 'professional',
      users: 24,
      jobsPosted: 8,
      applications: 456,
      revenue: 2500,
      status: 'active',
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      billingStatus: 'current'
    },
    {
      id: '3',
      name: 'Global Dynamics',
      plan: 'enterprise',
      users: 89,
      jobsPosted: 23,
      applications: 1234,
      revenue: 8900,
      status: 'active',
      lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
      billingStatus: 'current'
    },
    {
      id: '4',
      name: 'Innovation Labs',
      plan: 'professional',
      users: 12,
      jobsPosted: 5,
      applications: 234,
      revenue: 1800,
      status: 'trial',
      lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000),
      billingStatus: 'current'
    },
    {
      id: '5',
      name: 'MegaCorp Ltd',
      plan: 'starter',
      users: 5,
      jobsPosted: 2,
      applications: 89,
      revenue: 450,
      status: 'suspended',
      lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      billingStatus: 'overdue'
    }
  ]);
  
  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'High API Latency',
      message: 'API response time increased to 245ms in the last hour',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      source: 'API Gateway',
      resolved: false
    },
    {
      id: '2',
      type: 'error',
      title: 'Database Connection Pool',
      message: 'Connection pool utilization at 95%',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      source: 'Database',
      resolved: true
    },
    {
      id: '3',
      type: 'info',
      title: 'Scheduled Maintenance',
      message: 'System maintenance scheduled for tomorrow 2:00 AM UTC',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      source: 'System',
      resolved: false
    },
    {
      id: '4',
      type: 'success',
      title: 'Backup Completed',
      message: 'Daily backup completed successfully',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      source: 'Backup Service',
      resolved: true
    }
  ]);
  
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([
    {
      id: '1',
      userType: 'company_admin',
      action: 'Created new job posting',
      details: 'Senior React Developer position at TechCorp',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      ipAddress: '192.168.1.45',
      status: 'success'
    },
    {
      id: '2',
      userType: 'recruiter',
      action: 'Conducted AI interview',
      details: 'Interview for Full Stack Developer position',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      ipAddress: '10.0.1.23',
      status: 'success'
    },
    {
      id: '3',
      userType: 'candidate',
      action: 'Profile registration',
      details: 'New candidate profile created',
      timestamp: new Date(Date.now() - 35 * 60 * 1000),
      ipAddress: '203.45.67.89',
      status: 'success'
    },
    {
      id: '4',
      userType: 'company_admin',
      action: 'Failed login attempt',
      details: 'Multiple failed login attempts detected',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      ipAddress: '45.67.89.12',
      status: 'failed'
    }
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'current': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info': return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!user || user.role !== 'super_admin') {
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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                <p className="text-gray-600">System monitoring and platform management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                {getSystemHealthIcon(metrics.systemHealth)}
                <span className={`text-sm font-medium ${getSystemHealthColor(metrics.systemHealth)}`}>
                  System {metrics.systemHealth}
                </span>
              </div>
              
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last hour</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button 
                onClick={() => router.push('/admin/settings')}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers.toLocaleString()}</p>
                      <p className="text-sm text-green-600">+{stats.monthlyGrowth}% this month</p>
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
                      <p className="text-sm text-gray-600">Active Companies</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.activeCompanies}</p>
                      <p className="text-sm text-blue-600">of {metrics.totalCompanies} total</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">${stats.revenue.toLocaleString()}</p>
                      <p className="text-sm text-green-600">+{stats.monthlyGrowth}% growth</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">System Uptime</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.uptime}%</p>
                      <p className="text-sm text-green-600">Last 30 days</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Activity className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    System Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.map(alert => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0 mt-1">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900 text-sm">{alert.title}</h4>
                            <Badge variant={alert.resolved ? 'default' : 'destructive'} className="text-xs">
                              {alert.resolved ? 'Resolved' : 'Active'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{alert.message}</p>
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(alert.timestamp)} • {alert.source}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Key Performance Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Conversion Rate</span>
                        <span className="text-sm text-gray-600">{stats.conversionRate}%</span>
                      </div>
                      <Progress value={stats.conversionRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Churn Rate</span>
                        <span className="text-sm text-gray-600">{stats.churnRate}%</span>
                      </div>
                      <Progress value={stats.churnRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Error Rate</span>
                        <span className="text-sm text-gray-600">{stats.errorRate}%</span>
                      </div>
                      <Progress value={stats.errorRate * 50} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Support Response</span>
                        <span className="text-sm text-gray-600">{stats.supportTickets} tickets</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Company</th>
                        <th className="text-left p-3">Plan</th>
                        <th className="text-left p-3">Users</th>
                        <th className="text-left p-3">Jobs</th>
                        <th className="text-left p-3">Revenue</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Last Activity</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCompanies.map(company => (
                        <tr key={company.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{company.name}</div>
                              <div className="text-gray-500 text-xs">{company.applications} applications</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={getPlanColor(company.plan)}>
                              {company.plan}
                            </Badge>
                          </td>
                          <td className="p-3">{company.users}</td>
                          <td className="p-3">{company.jobsPosted}</td>
                          <td className="p-3">${company.revenue.toLocaleString()}</td>
                          <td className="p-3">
                            <Badge className={getStatusColor(company.status)}>
                              {company.status}
                            </Badge>
                          </td>
                          <td className="p-3">{formatTimestamp(company.lastActivity)}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="w-3 h-3 mr-1" />
                                Manage
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Cpu className="w-4 h-4" />
                    CPU Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{metrics.cpuUsage}%</div>
                  <Progress value={metrics.cpuUsage} className="h-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Monitor className="w-4 h-4" />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{metrics.memoryUsage}%</div>
                  <Progress value={metrics.memoryUsage} className="h-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HardDrive className="w-4 h-4" />
                    Storage Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{metrics.storageUsage}%</div>
                  <Progress value={metrics.storageUsage} className="h-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Network className="w-4 h-4" />
                    Network Traffic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{metrics.networkTraffic} GB/s</div>
                  <Progress value={metrics.networkTraffic * 20} className="h-2" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent User Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">{activity.action}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.userType}
                            </Badge>
                            <Badge 
                              variant={activity.status === 'success' ? 'default' : activity.status === 'failed' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {activity.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{activity.details}</p>
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(activity.timestamp)} • {activity.ipAddress}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}