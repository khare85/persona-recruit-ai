'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AIPerformanceDashboard, AnalyticsFilters } from '@/types/analytics.types';
import { PerformanceOverview } from '@/components/ai-analytics/PerformanceOverview';
import { BiasMonitoring } from '@/components/ai-analytics/BiasMonitoring'; // Corrected import path
import { FairnessMetrics } from '@/components/ai-analytics/FairnessMetrics'; // Corrected import path
import { AlertsPanel } from '@/components/ai-analytics/AlertsPanel'; // Corrected import path
import { ExportControls } from '@/components/ai-analytics/ExportControls'; // Corrected import path
import { TimeRangeSelector } from '@/components/ai-analytics/TimeRangeSelector';
import { AlertTriangle, Activity, Shield, TrendingUp, RefreshCw } from 'lucide-react';

export default function AIAnalyticsPage() {
  const [dashboardData, setDashboardData] = useState<AIPerformanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: new Date(),
      preset: '7d'
    }
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: filters.timeRange.start.toISOString(),
        endDate: filters.timeRange.end.toISOString(),
        ...(filters.operationTypes && { operationTypes: filters.operationTypes.join(',') }),
        ...(filters.companyIds && { companyIds: filters.companyIds.join(',') }),
        ...(filters.models && { models: filters.models.join(',') }),
        ...(filters.severityLevels && { severityLevels: filters.severityLevels.join(',') }),
        ...(filters.biasTypes && { biasTypes: filters.biasTypes.join(',') }),
        ...(filters.successOnly && { successOnly: 'true' }),
        ...(filters.withDemographics && { withDemographics: 'true' })
      });

      const response = await fetch(`/api/ai-analytics/dashboard?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, filters]);

  // Handle time range changes
  const handleTimeRangeChange = (newTimeRange: AnalyticsFilters['timeRange']) => {
    setFilters(prev => ({
      ...prev,
      timeRange: newTimeRange
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof AnalyticsFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading && !dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading AI Analytics Dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchDashboardData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Analytics & Bias Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time performance monitoring and fairness analytics for AI operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-600' : ''}`} />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <ExportControls filters={filters} />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Filters & Time Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <TimeRangeSelector
              timeRange={filters.timeRange}
              onChange={handleTimeRangeChange}
            />
            
            <div>
              <label className="text-sm font-medium mb-2 block">Operation Types</label>
              <Select
                value={filters.operationTypes?.join(',') || ''}
                onValueChange={(value) => handleFilterChange('operationTypes', value ? value.split(',') : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Operations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Operations</SelectItem>
                  <SelectItem value="resume_processing">Resume Processing</SelectItem>
                  <SelectItem value="candidate_matching">Candidate Matching</SelectItem>
                  <SelectItem value="job_generation">Job Generation</SelectItem>
                  <SelectItem value="skill_extraction">Skill Extraction</SelectItem>
                  <SelectItem value="interview_analysis">Interview Analysis</SelectItem>
                  <SelectItem value="talent_search">Talent Search</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Models</label>
              <Select
                value={filters.models?.join(',') || ''}
                onValueChange={(value) => handleFilterChange('models', value ? value.split(',') : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Models</SelectItem>
                  <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                  <SelectItem value="text-embedding-005">Text Embedding 005</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bias Types</label>
              <Select
                value={filters.biasTypes?.join(',') || ''}
                onValueChange={(value) => handleFilterChange('biasTypes', value ? value.split(',') : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Bias Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="gender_bias">Gender Bias</SelectItem>
                  <SelectItem value="age_bias">Age Bias</SelectItem>
                  <SelectItem value="racial_bias">Racial Bias</SelectItem>
                  <SelectItem value="education_bias">Education Bias</SelectItem>
                  <SelectItem value="location_bias">Location Bias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts Banner */}
      {dashboardData?.activeAlerts?.filter(alert => alert.severity === 'critical').length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Issues Detected</AlertTitle>
          <AlertDescription>
            {dashboardData.activeAlerts.filter(alert => alert.severity === 'critical').length} critical issues require immediate attention.
            Check the Alerts tab for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="bias" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Bias Monitoring
          </TabsTrigger>
          <TabsTrigger value="fairness" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Fairness Metrics
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts
            {dashboardData?.activeAlerts?.filter(alert => !alert.acknowledged).length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {dashboardData.activeAlerts.filter(alert => !alert.acknowledged).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <PerformanceOverview 
            data={dashboardData} 
            loading={loading}
            onRefresh={fetchDashboardData}
          />
        </TabsContent>

        <TabsContent value="bias" className="space-y-4">
          <BiasMonitoring 
            data={dashboardData} 
            filters={filters}
            loading={loading}
            onRefresh={fetchDashboardData}
          />
        </TabsContent>

        <TabsContent value="fairness" className="space-y-4">
          <FairnessMetrics 
            data={dashboardData} 
            filters={filters}
            loading={loading}
            onRefresh={fetchDashboardData}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsPanel 
            alerts={dashboardData?.activeAlerts || []} 
            loading={loading}
            onRefresh={fetchDashboardData}
          />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Last updated: {dashboardData ? new Date().toLocaleString() : 'Never'}
            </div>
            <div className="flex items-center space-x-4">
              <span>Auto-refresh: {autoRefresh ? 'Enabled (30s)' : 'Disabled'}</span>
              <span>Time range: {filters.timeRange.preset || 'Custom'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}