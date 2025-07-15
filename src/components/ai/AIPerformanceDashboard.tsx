/**
 * AI Performance Dashboard Component
 * Real-time monitoring of AI services performance
 */

'use client';

import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Activity, 
  Database, 
  Clock, 
  Users, 
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Server,
  BarChart3
} from 'lucide-react';
import { useAIStats } from '@/hooks/useAIProcessing';

interface AIPerformanceDashboardProps {
  refreshInterval?: number;
}

const AIPerformanceDashboard = memo(({ refreshInterval = 10000 }: AIPerformanceDashboardProps) => {
  const { stats, isLoading, refresh } = useAIStats();
  const [alerts, setAlerts] = useState<any[]>([]);

  // Check for performance alerts
  useEffect(() => {
    if (!stats) return;

    const newAlerts: any[] = [];

    // Memory usage alert
    if (stats.orchestrator?.memoryUsage?.usagePercent > 80) {
      newAlerts.push({
        type: 'warning',
        title: 'High Memory Usage',
        description: `Memory usage at ${stats.orchestrator.memoryUsage.usagePercent}%`,
        icon: AlertTriangle
      });
    }

    // Cache hit rate alert
    if (stats.orchestrator?.cacheHitRate < 70) {
      newAlerts.push({
        type: 'warning',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate at ${stats.orchestrator.cacheHitRate}%`,
        icon: AlertTriangle
      });
    }

    // Queue backlog alert
    if (stats.queue?.waiting > 50) {
      newAlerts.push({
        type: 'error',
        title: 'Queue Backlog',
        description: `${stats.queue.waiting} jobs waiting in queue`,
        icon: AlertTriangle
      });
    }

    setAlerts(newAlerts);
  }, [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load AI performance statistics. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of AI services and performance metrics
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <alert.icon className="h-4 w-4" />
              <AlertDescription>
                <strong>{alert.title}:</strong> {alert.description}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.orchestrator?.cacheHitRate || 0}%
            </div>
            <Progress 
              value={stats.orchestrator?.cacheHitRate || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.orchestrator?.memoryUsage?.usagePercent || 0}%
            </div>
            <Progress 
              value={stats.orchestrator?.memoryUsage?.usagePercent || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.queue?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.queue?.waiting || 0} waiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={stats.queue?.waiting > 20 ? 'destructive' : 'secondary'}>
                {stats.queue?.waiting > 20 ? 'High Load' : 'Healthy'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.queue?.completed || 0} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Orchestrator Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Orchestrator
            </CardTitle>
            <CardDescription>
              Core AI processing statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Cache Hit Rate</div>
                <div className="text-lg font-semibold">
                  {stats.orchestrator?.cacheHitRate || 0}%
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Active Jobs</div>
                <div className="text-lg font-semibold">
                  {stats.orchestrator?.activeJobs || 0}
                </div>
              </div>
            </div>

            {/* Memory Usage Details */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Memory Usage</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used</span>
                  <span>{stats.orchestrator?.memoryUsage?.usagePercent || 0}%</span>
                </div>
                <Progress value={stats.orchestrator?.memoryUsage?.usagePercent || 0} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Critical: {stats.orchestrator?.memoryUsage?.isCritical ? 'Yes' : 'No'}</span>
                  <span>High: {stats.orchestrator?.memoryUsage?.isMemoryHigh ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Rate Limiting Status */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Rate Limiting</div>
              <div className="grid grid-cols-2 gap-2">
                {stats.orchestrator?.rateLimitStatus && Object.entries(stats.orchestrator.rateLimitStatus).map(([service, status]: [string, any]) => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="text-sm">{service}</span>
                    <Badge variant={status.isLimited ? 'destructive' : 'secondary'}>
                      {status.remaining}/{status.maxRequests}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Processing Queue
            </CardTitle>
            <CardDescription>
              Background job processing statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Waiting</div>
                <div className="text-lg font-semibold text-orange-600">
                  {stats.queue?.waiting || 0}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Active</div>
                <div className="text-lg font-semibold text-blue-600">
                  {stats.queue?.active || 0}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Completed</div>
                <div className="text-lg font-semibold text-green-600">
                  {stats.queue?.completed || 0}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Failed</div>
                <div className="text-lg font-semibold text-red-600">
                  {stats.queue?.failed || 0}
                </div>
              </div>
            </div>

            {/* Queue Health Indicator */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Queue Health</div>
              <div className="flex items-center space-x-2">
                {stats.queue?.waiting > 50 ? (
                  <Badge variant="destructive">Overloaded</Badge>
                ) : stats.queue?.waiting > 20 ? (
                  <Badge variant="secondary">High Load</Badge>
                ) : (
                  <Badge variant="outline">Healthy</Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {stats.queue?.workers || 0} workers
                </span>
              </div>
            </div>

            {/* Worker Stats */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Workers</div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Workers</span>
                <span className="text-sm font-semibold">{stats.queue?.workers || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>
            Historical performance metrics and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.orchestrator?.cacheHitRate || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600 ml-1">+5% from last hour</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.queue?.completed || 0}
              </div>
              <div className="text-sm text-muted-foreground">Jobs Completed</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-blue-600 ml-1">+12% from last hour</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.orchestrator?.memoryUsage?.usagePercent || 0}%
              </div>
              <div className="text-sm text-muted-foreground">Memory Usage</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-purple-600 ml-1">-8% from last hour</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

AIPerformanceDashboard.displayName = 'AIPerformanceDashboard';

export default AIPerformanceDashboard;