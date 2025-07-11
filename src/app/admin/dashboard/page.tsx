
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoOrAuthFetch } from '@/hooks/useDemoOrAuthFetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { ShieldCheck, Users, Building, Server, Activity, DollarSign, BarChart3, Settings, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminDashboardData {
  totalUsers: number;
  totalCompanies: number;
  systemHealth: number;
  monthlyRevenue: number;
  activeJobs: number;
  supportTickets: number;
  recentActivity: Array<{ type: string; message: string; time: string }>;
}

export default function AdminDashboardPage() {
  const { loading: authLoading } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const demoOrAuthFetch = useDemoOrAuthFetch();

  const fetchData = useCallback(async () => {
    if (authLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await demoOrAuthFetch('/api/admin/dashboard');
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [demoOrAuthFetch, authLoading]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading || !data) {
    return (
      <AdminLayout>
        <Container className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </Container>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Container>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || "Could not load dashboard data."}</AlertDescription>
          </Alert>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
            <ShieldCheck className="mr-3 h-8 w-8 text-primary" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform performance, manage users and companies, and oversee system operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalUsers.toLocaleString()}</div>
              <span className="text-xs text-muted-foreground">+47 this week</span>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <Building className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalCompanies}</div>
              <span className="text-xs text-muted-foreground">+3 this month</span>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Server className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.systemHealth}%</div>
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                Healthy
              </Badge>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data.monthlyRevenue.toLocaleString()}</div>
              <span className="text-xs text-muted-foreground">+12% vs last month</span>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-6 w-6 text-primary" /> Recent Activity
                </CardTitle>
                <CardDescription>Latest platform activity and system events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-md">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'user' ? 'bg-blue-500' :
                      activity.type === 'company' ? 'bg-green-500' :
                      activity.type === 'system' ? 'bg-orange-500' :
                      'bg-purple-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-6 w-6 text-primary" /> Platform Analytics
                </CardTitle>
                <CardDescription>Key performance metrics and usage statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-md">
                    <div className="text-2xl font-bold">{data.activeJobs}</div>
                    <div className="text-sm text-muted-foreground">Active Jobs</div>
                  </div>
                  <div className="text-center p-4 border rounded-md">
                    <div className="text-2xl font-bold">{data.supportTickets}</div>
                    <div className="text-sm text-muted-foreground">Open Tickets</div>
                  </div>
                  <div className="text-center p-4 border rounded-md">
                    <div className="text-2xl font-bold">2.4k</div>
                    <div className="text-sm text-muted-foreground">Job Applications</div>
                  </div>
                  <div className="text-center p-4 border rounded-md">
                    <div className="text-2xl font-bold">94%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Admin Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/admin/users">
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4 text-primary" />User Management
                  </Button>
                </Link>
                <Link href="/admin/company-management">
                  <Button variant="ghost" className="w-full justify-start">
                    <Building className="mr-2 h-4 w-4 text-primary" />Company Management
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button variant="ghost" className="w-full justify-start">
                    <BarChart3 className="mr-2 h-4 w-4 text-primary" />Platform Analytics
                  </Button>
                </Link>
                <Link href="/admin/system">
                  <Button variant="ghost" className="w-full justify-start">
                    <Server className="mr-2 h-4 w-4 text-primary" />System Health
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button variant="outline" className="w-full mt-2">
                    <Settings className="mr-2 h-4 w-4" />Platform Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Database cleanup scheduled</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">All systems operational</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </AdminLayout>
  );
}
