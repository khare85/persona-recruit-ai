/**
 * Modern Admin Dashboard
 * Enterprise-grade system monitoring and management
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Users, 
  Building2, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Server,
  Database,
  Zap,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Monitor,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  Download,
  Settings,
  Bell,
  Globe,
  Wifi,
  WifiOff,
  Power
} from 'lucide-react';

import { 
  ModernDashboardLayout, 
  ModernPageLayout 
} from '@/components/layout/ModernLayout';
import { 
  ModernCard, 
  ModernMetricCard, 
  ModernButton, 
  ModernBadge,
  ModernGrid,
  ModernEmptyState,
  ModernSkeletonCard
} from '@/components/ui/modern-design-system';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// =================================
// INTERFACES
// =================================

interface SystemHealth {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  uptime: string;
  status: 'healthy' | 'warning' | 'critical';
}

interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCompanies: number;
  activeCompanies: number;
  totalJobs: number;
  totalApplications: number;
  aiProcessingJobs: number;
  systemAlerts: number;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  severity: 'high' | 'medium' | 'low';
}

interface CompanyStats {
  id: string;
  name: string;
  users: number;
  activeJobs: number;
  applications: number;
  plan: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'trial' | 'suspended';
  lastActivity: Date;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'company_signup' | 'job_posted' | 'application_received' | 'system_event';
  description: string;
  timestamp: Date;
  userId?: string;
  companyId?: string;
}

// =================================
// MODERN ADMIN DASHBOARD
// =================================

export default function ModernAdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [topCompanies, setTopCompanies] = useState<CompanyStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSystemHealth({
          cpu: 45,
          memory: 72,
          storage: 38,
          network: 92,
          uptime: '99.9%',
          status: 'healthy'
        });

        setPlatformMetrics({
          totalUsers: 12847,
          activeUsers: 3924,
          totalCompanies: 342,
          activeCompanies: 298,
          totalJobs: 1847,
          totalApplications: 28394,
          aiProcessingJobs: 23,
          systemAlerts: 3
        });

        setSystemAlerts([
          {
            id: '1',
            type: 'warning',
            title: 'High Memory Usage',
            message: 'Memory usage is above 70% on production servers',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            resolved: false,
            severity: 'medium'
          },
          {
            id: '2',
            type: 'info',
            title: 'Scheduled Maintenance',
            message: 'Database maintenance scheduled for tonight at 2 AM UTC',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            resolved: false,
            severity: 'low'
          },
          {
            id: '3',
            type: 'error',
            title: 'API Rate Limit Exceeded',
            message: 'High API usage detected from company ID: 123',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            resolved: true,
            severity: 'high'
          }
        ]);

        setTopCompanies([
          {
            id: '1',
            name: 'TechCorp Inc.',
            users: 45,
            activeJobs: 12,
            applications: 234,
            plan: 'enterprise',
            status: 'active',
            lastActivity: new Date(Date.now() - 30 * 60 * 1000)
          },
          {
            id: '2',
            name: 'StartupX',
            users: 8,
            activeJobs: 3,
            applications: 67,
            plan: 'pro',
            status: 'active',
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            id: '3',
            name: 'GlobalSoft',
            users: 78,
            activeJobs: 24,
            applications: 456,
            plan: 'enterprise',
            status: 'active',
            lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000)
          }
        ]);

        setRecentActivity([
          {
            id: '1',
            type: 'company_signup',
            description: 'New company \"InnovateLabs\" signed up',
            timestamp: new Date(Date.now() - 10 * 60 * 1000)
          },
          {
            id: '2',
            type: 'user_signup',
            description: 'New user registration: john.doe@example.com',
            timestamp: new Date(Date.now() - 25 * 60 * 1000)
          },
          {
            id: '3',
            type: 'job_posted',
            description: 'TechCorp posted \"Senior Developer\" position',
            timestamp: new Date(Date.now() - 45 * 60 * 1000)
          },
          {
            id: '4',
            type: 'system_event',
            description: 'AI model updated to version 2.1.3',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
          }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (!user || user.role !== 'super_admin') {
    return (
      <ModernDashboardLayout title="Access Denied">
        <ModernEmptyState
          icon={Shield}
          title="Super Admin Access Required"
          description="You need super admin permissions to access this dashboard."
          action={
            <ModernButton onClick={() => router.push('/auth')}>
              Sign In
            </ModernButton>
          }
        />
      </ModernDashboardLayout>
    );
  }

  const getHealthColor = (value: number) => {
    if (value >= 80) return 'error';
    if (value >= 60) return 'warning';
    return 'success';
  };

  const getHealthStatus = () => {
    const avgHealth = systemHealth ? (systemHealth.cpu + systemHealth.memory + systemHealth.storage) / 3 : 0;
    if (avgHealth >= 80) return { label: 'Critical', color: 'error' };
    if (avgHealth >= 60) return { label: 'Warning', color: 'warning' };
    return { label: 'Healthy', color: 'success' };
  };

  return (
    <ModernDashboardLayout 
      title="Admin Dashboard"
      subtitle="Platform monitoring and system management"
    >
      <ModernPageLayout
        title="System Overview"
        actions={
          <>
            <ModernButton variant="secondary" leftIcon={RefreshCw}>
              Refresh
            </ModernButton>
            <ModernButton leftIcon={Settings}>
              Settings
            </ModernButton>
          </>
        }
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Platform KPIs */}
            <div>
              <h2 className=\"text-lg font-semibold text-neutral-900 mb-4\">Platform KPIs</h2>
              {loading ? (
                <ModernGrid cols={4}>
                  <ModernSkeletonCard />
                  <ModernSkeletonCard />
                  <ModernSkeletonCard />
                  <ModernSkeletonCard />
                </ModernGrid>
              ) : (
                <ModernGrid cols={4}>
                  <ModernMetricCard
                    title=\"Total Users\"
                    value={platformMetrics?.totalUsers.toLocaleString() || '0'}
                    subtitle={`${platformMetrics?.activeUsers.toLocaleString()} active`}
                    icon={Users}
                    color=\"primary\"
                    trend={{ value: 8, isPositive: true }}
                  />
                  <ModernMetricCard
                    title=\"Companies\"
                    value={platformMetrics?.totalCompanies.toLocaleString() || '0'}
                    subtitle={`${platformMetrics?.activeCompanies.toLocaleString()} active`}
                    icon={Building2}
                    color=\"success\"
                    trend={{ value: 12, isPositive: true }}
                  />
                  <ModernMetricCard
                    title=\"Active Jobs\"
                    value={platformMetrics?.totalJobs.toLocaleString() || '0'}
                    icon={Briefcase}
                    color=\"warning\"
                    trend={{ value: 5, isPositive: true }}
                  />
                  <ModernMetricCard
                    title=\"System Alerts\"
                    value={platformMetrics?.systemAlerts || 0}
                    icon={AlertTriangle}
                    color={platformMetrics?.systemAlerts && platformMetrics.systemAlerts > 0 ? 'error' : 'neutral'}
                    trend={{ value: 2, isPositive: false }}
                  />
                </ModernGrid>
              )}
            </div>

            {/* System Health Overview */}
            <div>
              <div className=\"flex items-center justify-between mb-4\">
                <h2 className=\"text-lg font-semibold text-neutral-900\">System Health</h2>
                <ModernBadge 
                  variant={getHealthStatus().color as any}
                  icon={getHealthStatus().color === 'success' ? CheckCircle : getHealthStatus().color === 'warning' ? AlertTriangle : XCircle}
                >
                  {getHealthStatus().label}
                </ModernBadge>
              </div>
              <ModernGrid cols={4}>
                <ModernCard className=\"p-4\">
                  <div className=\"flex items-center justify-between mb-2\">
                    <div className=\"flex items-center gap-2\">
                      <Cpu className=\"w-4 h-4 text-neutral-600\" />
                      <span className=\"text-sm font-medium\">CPU Usage</span>
                    </div>
                    <span className=\"text-sm font-bold\">{systemHealth?.cpu}%</span>
                  </div>
                  <Progress value={systemHealth?.cpu || 0} className=\"h-2\" />
                </ModernCard>
                <ModernCard className=\"p-4\">
                  <div className=\"flex items-center justify-between mb-2\">
                    <div className=\"flex items-center gap-2\">
                      <HardDrive className=\"w-4 h-4 text-neutral-600\" />
                      <span className=\"text-sm font-medium\">Memory</span>
                    </div>
                    <span className=\"text-sm font-bold\">{systemHealth?.memory}%</span>
                  </div>
                  <Progress value={systemHealth?.memory || 0} className=\"h-2\" />
                </ModernCard>
                <ModernCard className=\"p-4\">
                  <div className=\"flex items-center justify-between mb-2\">
                    <div className=\"flex items-center gap-2\">
                      <Database className=\"w-4 h-4 text-neutral-600\" />
                      <span className=\"text-sm font-medium\">Storage</span>
                    </div>
                    <span className=\"text-sm font-bold\">{systemHealth?.storage}%</span>
                  </div>
                  <Progress value={systemHealth?.storage || 0} className=\"h-2\" />
                </ModernCard>
                <ModernCard className=\"p-4\">
                  <div className=\"flex items-center justify-between mb-2\">
                    <div className=\"flex items-center gap-2\">
                      <Network className=\"w-4 h-4 text-neutral-600\" />
                      <span className=\"text-sm font-medium\">Network</span>
                    </div>
                    <span className=\"text-sm font-bold\">{systemHealth?.network}%</span>
                  </div>
                  <Progress value={systemHealth?.network || 0} className=\"h-2\" />
                </ModernCard>
              </ModernGrid>
            </div>

            {/* Recent Alerts */}
            <div>
              <h2 className=\"text-lg font-semibold text-neutral-900 mb-4\">Recent Alerts</h2>
              <div className=\"space-y-3\">
                {systemAlerts.map((alert) => (
                  <ModernCard key={alert.id} className=\"p-4\">
                    <div className=\"flex items-start gap-3\">
                      <div className={cn(
                        \"p-1 rounded-full\",
                        alert.type === 'error' ? 'bg-red-100' : alert.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      )}>
                        {alert.type === 'error' ? (
                          <XCircle className=\"w-4 h-4 text-red-600\" />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className=\"w-4 h-4 text-yellow-600\" />
                        ) : (
                          <CheckCircle className=\"w-4 h-4 text-blue-600\" />
                        )}
                      </div>
                      <div className=\"flex-1\">
                        <div className=\"flex items-center justify-between\">
                          <h4 className=\"font-medium text-neutral-900\">{alert.title}</h4>
                          <div className=\"flex items-center gap-2\">
                            <ModernBadge 
                              variant={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'neutral'}
                              size=\"sm\"
                            >
                              {alert.severity}
                            </ModernBadge>
                            {alert.resolved && (
                              <ModernBadge variant=\"success\" size=\"sm\">
                                Resolved
                              </ModernBadge>
                            )}
                          </div>
                        </div>
                        <p className=\"text-sm text-neutral-600 mt-1\">{alert.message}</p>
                        <p className=\"text-xs text-neutral-500 mt-2\">{alert.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                  </ModernCard>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value=\"companies\" className=\"space-y-6\">
            <div>
              <h2 className=\"text-lg font-semibold text-neutral-900 mb-4\">Top Companies</h2>
              <div className=\"space-y-4\">
                {topCompanies.map((company) => (
                  <ModernCard key={company.id} className=\"p-4\">
                    <div className=\"flex items-center justify-between\">
                      <div className=\"flex items-center gap-3\">
                        <Avatar className=\"w-12 h-12\">
                          <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className=\"font-semibold text-neutral-900\">{company.name}</h4>
                          <p className=\"text-sm text-neutral-600\">{company.users} users • {company.activeJobs} active jobs</p>
                        </div>
                      </div>
                      <div className=\"flex items-center gap-4\">
                        <ModernBadge 
                          variant={company.plan === 'enterprise' ? 'success' : company.plan === 'pro' ? 'warning' : 'neutral'}
                        >
                          {company.plan}
                        </ModernBadge>
                        <ModernBadge 
                          variant={company.status === 'active' ? 'success' : company.status === 'trial' ? 'warning' : 'error'}
                        >
                          {company.status}
                        </ModernBadge>
                        <ModernButton variant=\"ghost\" size=\"sm\">
                          View Details
                        </ModernButton>
                      </div>
                    </div>
                  </ModernCard>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value=\"system\" className=\"space-y-6\">
            <div>
              <h2 className=\"text-lg font-semibold text-neutral-900 mb-4\">System Health Details</h2>
              <ModernGrid cols={2}>
                <ModernCard className=\"p-6\">
                  <h3 className=\"font-semibold text-neutral-900 mb-4\">Server Status</h3>
                  <div className=\"space-y-4\">
                    <div className=\"flex items-center justify-between\">
                      <span className=\"text-sm text-neutral-600\">Web Server</span>
                      <div className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-green-500 rounded-full\" />
                        <span className=\"text-sm font-medium\">Online</span>
                      </div>
                    </div>
                    <div className=\"flex items-center justify-between\">
                      <span className=\"text-sm text-neutral-600\">Database</span>
                      <div className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-green-500 rounded-full\" />
                        <span className=\"text-sm font-medium\">Online</span>
                      </div>
                    </div>
                    <div className=\"flex items-center justify-between\">
                      <span className=\"text-sm text-neutral-600\">AI Services</span>
                      <div className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-yellow-500 rounded-full\" />
                        <span className=\"text-sm font-medium\">Processing</span>
                      </div>
                    </div>
                    <div className=\"flex items-center justify-between\">
                      <span className=\"text-sm text-neutral-600\">File Storage</span>
                      <div className=\"flex items-center gap-2\">
                        <div className=\"w-2 h-2 bg-green-500 rounded-full\" />
                        <span className=\"text-sm font-medium\">Online</span>
                      </div>
                    </div>
                  </div>
                </ModernCard>
                <ModernCard className=\"p-6\">
                  <h3 className=\"font-semibold text-neutral-900 mb-4\">Performance Metrics</h3>
                  <div className=\"space-y-4\">
                    <div className=\"flex items-center justify-between\">
                      <span className=\"text-sm text-neutral-600\">Uptime</span>
                      <span className=\"text-sm font-medium\">{systemHealth?.uptime}</span>
                    </div>
                    <div className=\"flex items-center justify-between\">
                      <span className=\"text-sm text-neutral-600\">Response Time</span>
                      <span className=\"text-sm font-medium\">245ms</span>
                    </div>
                    <div className=\"flex items-center justify-between\">
                      <span className=\"text-sm text-neutral-600\">Throughput</span>
                      <span className=\"text-sm font-medium\">1,247 req/min</span>
                    </div>
                    <div className=\"flex items-center justify-between\">
                      <span className=\"text-sm text-neutral-600\">Error Rate</span>
                      <span className=\"text-sm font-medium\">0.03%</span>
                    </div>
                  </div>
                </ModernCard>
              </ModernGrid>
            </div>
          </TabsContent>

          <TabsContent value=\"activity\" className=\"space-y-6\">
            <div>
              <h2 className=\"text-lg font-semibold text-neutral-900 mb-4\">Recent Activity</h2>
              <div className=\"space-y-3\">
                {recentActivity.map((activity) => (
                  <ModernCard key={activity.id} className=\"p-4\">
                    <div className=\"flex items-start gap-3\">
                      <div className={cn(
                        \"w-2 h-2 rounded-full mt-2 flex-shrink-0\",
                        activity.type === 'system_event' ? 'bg-blue-500' : 
                        activity.type === 'user_signup' ? 'bg-green-500' : 
                        activity.type === 'company_signup' ? 'bg-purple-500' : 'bg-yellow-500'
                      )} />
                      <div className=\"flex-1\">
                        <p className=\"text-sm font-medium text-neutral-900\">{activity.description}</p>
                        <p className=\"text-xs text-neutral-500 mt-1\">{activity.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                  </ModernCard>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ModernPageLayout>
    </ModernDashboardLayout>
  );
}

// Helper function for class names
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}