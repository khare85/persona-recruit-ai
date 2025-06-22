'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Database, 
  Cloud, 
  Cpu, 
  HardDrive, 
  Activity,
  Wifi,
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Monitor,
  MemoryStick,
  Globe,
  Lock,
  Eye,
  Settings,
  Download,
  Upload
} from 'lucide-react';

const systemStatus = {
  overall: 'healthy',
  uptime: 99.92,
  lastIncident: '12 days ago',
  services: [
    { name: 'Web Application', status: 'healthy', uptime: 99.95, responseTime: 142 },
    { name: 'API Gateway', status: 'healthy', uptime: 99.98, responseTime: 89 },
    { name: 'Database', status: 'healthy', uptime: 99.87, responseTime: 23 },
    { name: 'AI Services', status: 'warning', uptime: 98.45, responseTime: 256 },
    { name: 'File Storage', status: 'healthy', uptime: 99.99, responseTime: 67 },
    { name: 'Authentication', status: 'healthy', uptime: 99.92, responseTime: 134 },
    { name: 'Email Service', status: 'healthy', uptime: 99.78, responseTime: 890 },
    { name: 'Analytics Engine', status: 'healthy', uptime: 99.56, responseTime: 445 }
  ],
  servers: [
    { name: 'Web Server 1', cpu: 45, memory: 62, disk: 38, status: 'healthy', location: 'US-East' },
    { name: 'Web Server 2', cpu: 52, memory: 58, disk: 41, status: 'healthy', location: 'US-West' },
    { name: 'Database Primary', cpu: 67, memory: 78, disk: 55, status: 'warning', location: 'US-East' },
    { name: 'Database Replica', cpu: 34, memory: 45, disk: 52, status: 'healthy', location: 'EU-West' },
    { name: 'AI Processing', cpu: 89, memory: 91, disk: 23, status: 'critical', location: 'US-Central' },
    { name: 'File Storage', cpu: 23, memory: 34, disk: 67, status: 'healthy', location: 'Global CDN' }
  ],
  metrics: {
    totalRequests: 2456789,
    successRate: 99.94,
    avgResponseTime: 167,
    concurrentUsers: 1247,
    dataTransfer: 2.4,
    errorRate: 0.06
  },
  security: {
    threatBlocked: 1247,
    lastScan: '2 hours ago',
    vulnerabilities: 0,
    ssl: 'A+',
    compliance: 'SOC2, GDPR',
    lastUpdate: '1 day ago'
  }
};

export default function AdminSystemPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="mr-1 h-3 w-3" />Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Critical</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgressColor = (value: number) => {
    if (value < 60) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <AdminLayout>
      <Container className="py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <Server className="mr-3 h-8 w-8 text-primary" />
                System Health & Monitoring
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time system monitoring, performance metrics, and infrastructure status
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Logs
              </Button>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Healthy</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>All systems operational</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.uptime}%</div>
              <div className="text-xs text-muted-foreground">
                Last incident: {systemStatus.lastIncident}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.metrics.concurrentUsers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {systemStatus.metrics.successRate}% success rate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.metrics.avgResponseTime}ms</div>
              <div className="text-xs text-muted-foreground">
                {systemStatus.metrics.errorRate}% error rate
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="services" className="space-y-6">
          <TabsList>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="mr-2 h-5 w-5 text-primary" />
                  Service Status
                </CardTitle>
                <CardDescription>Real-time status of all platform services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {systemStatus.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`} />
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {service.uptime}% uptime • {service.responseTime}ms avg
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Key performance indicators for the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{systemStatus.metrics.totalRequests.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{systemStatus.metrics.dataTransfer}TB</div>
                    <div className="text-sm text-muted-foreground">Data Transfer</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{systemStatus.metrics.successRate}%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-primary" />
                  Server Infrastructure
                </CardTitle>
                <CardDescription>Real-time monitoring of server resources and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {systemStatus.servers.map((server, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{server.name}</h3>
                          <p className="text-sm text-muted-foreground">{server.location}</p>
                        </div>
                        {getStatusBadge(server.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="flex items-center">
                              <Cpu className="mr-1 h-3 w-3" />
                              CPU Usage
                            </span>
                            <span>{server.cpu}%</span>
                          </div>
                          <Progress value={server.cpu} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="flex items-center">
                              <MemoryStick className="mr-1 h-3 w-3" />
                              Memory
                            </span>
                            <span>{server.memory}%</span>
                          </div>
                          <Progress value={server.memory} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="flex items-center">
                              <HardDrive className="mr-1 h-3 w-3" />
                              Disk Usage
                            </span>
                            <span>{server.disk}%</span>
                          </div>
                          <Progress value={server.disk} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-primary" />
                  Security Overview
                </CardTitle>
                <CardDescription>Security monitoring and threat detection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{systemStatus.security.threatBlocked}</div>
                    <div className="text-sm text-muted-foreground">Threats Blocked</div>
                    <div className="text-xs text-muted-foreground mt-1">Last 24 hours</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{systemStatus.security.vulnerabilities}</div>
                    <div className="text-sm text-muted-foreground">Open Vulnerabilities</div>
                    <div className="text-xs text-muted-foreground mt-1">Last scan: {systemStatus.security.lastScan}</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{systemStatus.security.ssl}</div>
                    <div className="text-sm text-muted-foreground">SSL Rating</div>
                    <div className="text-xs text-muted-foreground mt-1">Certificate valid</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Security Status: Secure</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    All security systems are operational. Compliance: {systemStatus.security.compliance}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Last security update: {systemStatus.security.lastUpdate}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2 h-5 w-5 text-primary" />
                  System Logs
                </CardTitle>
                <CardDescription>Recent system events and logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">Database backup completed successfully</div>
                        <div className="text-sm text-muted-foreground">2 minutes ago</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600">Info</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <div>
                        <div className="font-medium">High CPU usage detected on AI Processing server</div>
                        <div className="text-sm text-muted-foreground">15 minutes ago</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">Warning</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">Security scan completed - no vulnerabilities found</div>
                        <div className="text-sm text-muted-foreground">2 hours ago</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600">Info</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Upload className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">System update deployed successfully</div>
                        <div className="text-sm text-muted-foreground">1 day ago</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-blue-600">Deploy</Badge>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View All Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </AdminLayout>
  );
}