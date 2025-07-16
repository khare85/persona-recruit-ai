'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Calendar,
  Target,
  Award,
  Filter,
  Download,
  Eye,
  Plus,
  Settings,
  Building2,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Activity,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Bell,
  UserPlus,
  MapPin,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SemanticSearch, SearchResult, SearchFilters } from '@/components/search/SemanticSearch';

interface CompanyStats {
  totalEmployees: number;
  activeJobPostings: number;
  pendingApplications: number;
  interviewsThisWeek: number;
  hiresThisMonth: number;
  averageTimeToHire: number;
  totalRecruiters: number;
  budgetSpent: number;
  budgetRemaining: number;
}

interface HiringMetrics {
  applicationRate: number;
  interviewRate: number;
  offerRate: number;
  acceptanceRate: number;
  retentionRate: number;
  diversityScore: number;
}

interface DepartmentData {
  id: string;
  name: string;
  openPositions: number;
  filled: number;
  pending: number;
  budget: number;
  avgSalary: number;
  headcount: number;
  growthRate: number;
}

interface RecentActivity {
  id: string;
  type: 'hire' | 'application' | 'interview' | 'offer' | 'rejection';
  title: string;
  description: string;
  timestamp: Date;
  department: string;
  recruiter: string;
  status: string;
}

interface TopPerformer {
  id: string;
  name: string;
  role: string;
  department: string;
  hiresThisMonth: number;
  conversionRate: number;
  avgTimeToHire: number;
  satisfaction: number;
}

export default function CompanyDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  
  const [stats, setStats] = useState<CompanyStats>({
    totalEmployees: 347,
    activeJobPostings: 23,
    pendingApplications: 156,
    interviewsThisWeek: 28,
    hiresThisMonth: 12,
    averageTimeToHire: 16,
    totalRecruiters: 8,
    budgetSpent: 285000,
    budgetRemaining: 115000
  });
  
  const [metrics, setMetrics] = useState<HiringMetrics>({
    applicationRate: 78,
    interviewRate: 32,
    offerRate: 18,
    acceptanceRate: 85,
    retentionRate: 92,
    diversityScore: 68
  });
  
  const [departments, setDepartments] = useState<DepartmentData[]>([
    {
      id: 'engineering',
      name: 'Engineering',
      openPositions: 8,
      filled: 3,
      pending: 5,
      budget: 120000,
      avgSalary: 135000,
      headcount: 95,
      growthRate: 15
    },
    {
      id: 'product',
      name: 'Product',
      openPositions: 4,
      filled: 2,
      pending: 2,
      budget: 80000,
      avgSalary: 125000,
      headcount: 28,
      growthRate: 22
    },
    {
      id: 'design',
      name: 'Design',
      openPositions: 3,
      filled: 1,
      pending: 2,
      budget: 45000,
      avgSalary: 110000,
      headcount: 18,
      growthRate: 8
    },
    {
      id: 'marketing',
      name: 'Marketing',
      openPositions: 5,
      filled: 2,
      pending: 3,
      budget: 65000,
      avgSalary: 85000,
      headcount: 32,
      growthRate: 18
    },
    {
      id: 'sales',
      name: 'Sales',
      openPositions: 3,
      filled: 4,
      pending: 1,
      budget: 95000,
      avgSalary: 95000,
      headcount: 45,
      growthRate: 12
    }
  ]);
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'hire',
      title: 'New Hire Confirmed',
      description: 'Sarah Chen joined as Senior React Developer',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      department: 'Engineering',
      recruiter: 'Alex Johnson',
      status: 'completed'
    },
    {
      id: '2',
      type: 'offer',
      title: 'Offer Extended',
      description: 'Michael Rodriguez - Full Stack Developer position',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      department: 'Engineering',
      recruiter: 'Emma Davis',
      status: 'pending'
    },
    {
      id: '3',
      type: 'interview',
      title: 'Final Interview Completed',
      description: 'Product Manager candidate - Lisa Park',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      department: 'Product',
      recruiter: 'James Wilson',
      status: 'completed'
    },
    {
      id: '4',
      type: 'application',
      title: 'High-Quality Application',
      description: 'UX Designer with 8+ years experience applied',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      department: 'Design',
      recruiter: 'Maria Garcia',
      status: 'new'
    }
  ]);
  
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      role: 'Senior Recruiter',
      department: 'Engineering',
      hiresThisMonth: 5,
      conversionRate: 28,
      avgTimeToHire: 12,
      satisfaction: 4.8
    },
    {
      id: '2',
      name: 'Emma Davis',
      role: 'Technical Recruiter',
      department: 'Engineering',
      hiresThisMonth: 3,
      conversionRate: 32,
      avgTimeToHire: 14,
      satisfaction: 4.9
    },
    {
      id: '3',
      name: 'James Wilson',
      role: 'Product Recruiter',
      department: 'Product',
      hiresThisMonth: 2,
      conversionRate: 35,
      avgTimeToHire: 18,
      satisfaction: 4.7
    },
    {
      id: '4',
      name: 'Maria Garcia',
      role: 'Design Recruiter',
      department: 'Design',
      hiresThisMonth: 2,
      conversionRate: 25,
      avgTimeToHire: 16,
      satisfaction: 4.6
    }
  ]);

  // Handle semantic search
  const handleSearch = async (query: string, filters: SearchFilters): Promise<SearchResult[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResults: SearchResult[] = [
          {
            id: '1',
            type: 'candidate',
            title: 'Sarah Chen',
            subtitle: 'Senior React Developer',
            description: 'Experienced frontend developer with 6+ years building scalable applications',
            tags: ['React', 'TypeScript', 'Node.js'],
            metadata: {
              location: 'San Francisco, CA',
              experience: '6 years',
              salary: '$140,000',
              matchScore: 95
            },
            featured: true
          }
        ];
        resolve(mockResults);
      }, 1000);
    });
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'hire': return <UserCheck className="w-4 h-4 text-green-600" />;
      case 'offer': return <Award className="w-4 h-4 text-blue-600" />;
      case 'interview': return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'application': return <Users className="w-4 h-4 text-orange-600" />;
      case 'rejection': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMetricColor = (value: number, type: string) => {
    const thresholds = {
      applicationRate: { good: 70, average: 50 },
      interviewRate: { good: 30, average: 20 },
      offerRate: { good: 15, average: 10 },
      acceptanceRate: { good: 80, average: 60 },
      retentionRate: { good: 85, average: 70 },
      diversityScore: { good: 70, average: 50 }
    };
    
    const threshold = thresholds[type as keyof typeof thresholds];
    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.average) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!user || user.role !== 'company_admin') {
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
              <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
              <p className="text-gray-600">Manage your hiring pipeline and team performance</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <Button 
                onClick={() => router.push('/company/settings')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI-Powered Search */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company-wide Talent Search</h2>
          <SemanticSearch
            type="candidate"
            placeholder="Search across all your recruiters' candidates..."
            onSearch={handleSearch}
            showFilters={true}
            showSuggestions={true}
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
                  <p className="text-sm text-green-600 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +12 this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeJobPostings}</p>
                  <p className="text-sm text-blue-600 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +3 this week
                  </p>
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
                  <p className="text-sm text-orange-600 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +23 today
                  </p>
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
                  <p className="text-sm text-gray-600">Hiring Budget</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(stats.budgetRemaining / 1000).toFixed(0)}k
                  </p>
                  <p className="text-sm text-gray-600">
                    of ${((stats.budgetSpent + stats.budgetRemaining) / 1000).toFixed(0)}k total
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hiring Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Hiring Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getMetricColor(metrics.applicationRate, 'applicationRate')}`}>
                      {metrics.applicationRate}%
                    </div>
                    <p className="text-sm text-gray-600">Application Rate</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getMetricColor(metrics.interviewRate, 'interviewRate')}`}>
                      {metrics.interviewRate}%
                    </div>
                    <p className="text-sm text-gray-600">Interview Rate</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getMetricColor(metrics.offerRate, 'offerRate')}`}>
                      {metrics.offerRate}%
                    </div>
                    <p className="text-sm text-gray-600">Offer Rate</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getMetricColor(metrics.acceptanceRate, 'acceptanceRate')}`}>
                      {metrics.acceptanceRate}%
                    </div>
                    <p className="text-sm text-gray-600">Acceptance Rate</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getMetricColor(metrics.retentionRate, 'retentionRate')}`}>
                      {metrics.retentionRate}%
                    </div>
                    <p className="text-sm text-gray-600">Retention Rate</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getMetricColor(metrics.diversityScore, 'diversityScore')}`}>
                      {metrics.diversityScore}%
                    </div>
                    <p className="text-sm text-gray-600">Diversity Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Department Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Department Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.map(dept => (
                    <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {dept.headcount} employees
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            +{dept.growthRate}% growth
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">{dept.openPositions}</span> open positions
                          </div>
                          <div>
                            <span className="font-medium">{dept.filled}</span> filled this month
                          </div>
                          <div>
                            <span className="font-medium">${(dept.avgSalary / 1000).toFixed(0)}k</span> avg salary
                          </div>
                        </div>
                        <div className="mt-2">
                          <Progress value={(dept.filled / dept.openPositions) * 100} className="h-2" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
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
                          <h4 className="font-medium text-gray-900 text-sm">{activity.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {activity.department}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(activity.timestamp)} • {activity.recruiter}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformers.map((performer, index) => (
                    <div key={performer.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">{performer.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {performer.department}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{performer.role}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{performer.hiresThisMonth} hires</span>
                          <span>{performer.conversionRate}% conversion</span>
                          <span>{performer.avgTimeToHire}d avg</span>
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
                    onClick={() => router.push('/company/jobs/new')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Job
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/company/recruiters')}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Recruiter
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/company/analytics')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/company/billing')}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Billing & Plans
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