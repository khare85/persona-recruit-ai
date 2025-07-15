'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  HardDrive, 
  Activity,
  RefreshCw,
  Download,
  Upload,
  Clock,
  CheckCircle
} from 'lucide-react';

interface DatabaseStats {
  status: string;
  totalSize: number;
  usedSpace: number;
  collections: Array<{
    name: string;
    documents: number;
    size: string;
  }>;
  recentBackups: Array<{
    id: string;
    date: string;
    size: string;
    status: string;
  }>;
}

export default function AdminDatabasePage() {
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      // Mock data - in real implementation would fetch from database service
      setDbStats({
        status: 'healthy',
        totalSize: 2048, // MB
        usedSpace: 1340, // MB
        collections: [
          { name: 'users', documents: 1247, size: '234 MB' },
          { name: 'companies', documents: 127, size: '45 MB' },
          { name: 'jobs', documents: 856, size: '189 MB' },
          { name: 'applications', documents: 4523, size: '678 MB' },
          { name: 'interviews', documents: 892, size: '123 MB' },
        ],
        recentBackups: [
          { id: '1', date: '2024-06-24T02:00:00Z', size: '1.2 GB', status: 'completed' },
          { id: '2', date: '2024-06-23T02:00:00Z', size: '1.1 GB', status: 'completed' },
          { id: '3', date: '2024-06-22T02:00:00Z', size: '1.1 GB', status: 'completed' },
        ]
      });
    } catch (error) {
      console.error('Error fetching database stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning': return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const usagePercentage = dbStats ? (dbStats.usedSpace / dbStats.totalSize) * 100 : 0;

  return (
    <AdminLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Database className="mr-3 h-8 w-8 text-primary" />
            Database Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor database health, performance, and manage backups
          </p>
        </div>

        {/* Database Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {getStatusBadge(dbStats?.status || 'unknown')}
              <p className="text-xs text-muted-foreground mt-2">All systems operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dbStats?.usedSpace} MB</div>
              <Progress value={usagePercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {usagePercentage.toFixed(1)}% of {dbStats?.totalSize} MB
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collections</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dbStats?.collections.length || 0}</div>
              <p className="text-xs text-muted-foreground">Active collections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {dbStats?.recentBackups[0] ? new Date(dbStats.recentBackups[0].date).toLocaleDateString() : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Automated daily backups</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="collections" className="space-y-6">
          <TabsList>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="backups">Backups</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="collections">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Database Collections</CardTitle>
                    <CardDescription>Collection sizes and document counts</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchDatabaseStats}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dbStats?.collections.map((collection) => (
                    <div key={collection.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium capitalize">{collection.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {collection.documents.toLocaleString()} documents
                        </p>
                      </div>
                      <Badge variant="outline">{collection.size}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backups">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Database Backups</CardTitle>
                    <CardDescription>Automated and manual backup history</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download Latest
                    </Button>
                    <Button size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Create Backup
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dbStats?.recentBackups.map((backup) => (
                    <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">
                          {new Date(backup.date).toLocaleDateString()} at {new Date(backup.date).toLocaleTimeString()}
                        </h4>
                        <p className="text-sm text-muted-foreground">Size: {backup.size}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm capitalize">{backup.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>Database Maintenance</CardTitle>
                <CardDescription>Performance optimization and cleanup tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Index Optimization</h4>
                      <p className="text-sm text-muted-foreground">Rebuild database indexes for better performance</p>
                    </div>
                    <Button variant="outline">
                      <Activity className="mr-2 h-4 w-4" />
                      Optimize
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Cleanup Old Data</h4>
                      <p className="text-sm text-muted-foreground">Remove expired sessions and temporary data</p>
                    </div>
                    <Button variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Cleanup
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Health Check</h4>
                      <p className="text-sm text-muted-foreground">Run comprehensive database health diagnostics</p>
                    </div>
                    <Button variant="outline">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Run Check
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </AdminLayout>
  );
}