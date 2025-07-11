
'use client';

import { AdminPageWrapper, useAdminData } from '@/utils/adminPageTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIPerformanceDashboard, AnalyticsFilters } from '@/types/analytics.types';
import { PerformanceOverview } from '@/components/ai-analytics/PerformanceOverview';
import { BiasMonitoring } from '@/components/ai-analytics/BiasMonitoring';
import { FairnessMetrics } from '@/components/ai-analytics/FairnessMetrics';
import { AlertsPanel } from '@/components/ai-analytics/AlertsPanel';
import { ExportControls } from '@/components/ai-analytics/ExportControls';
import { TimeRangeSelector } from '@/components/ai-analytics/TimeRangeSelector';
import { AlertTriangle, Activity, Shield, TrendingUp } from 'lucide-react';

export default function AIAnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: new Date(),
      preset: '7d'
    }
  });

  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useAdminData<{ data: AIPerformanceDashboard }>({
    endpoint: `/api/ai-analytics/dashboard?${new URLSearchParams({
      startDate: filters.timeRange.start.toISOString(),
      endDate: filters.timeRange.end.toISOString(),
    })}`
  });

  const handleTimeRangeChange = (newTimeRange: AnalyticsFilters['timeRange']) => {
    setFilters(prev => ({
      ...prev,
      timeRange: newTimeRange
    }));
  };

  const handleFilterChange = (key: keyof AnalyticsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  return (
    <AdminPageWrapper
      title="AI Analytics & Bias Monitoring"
      description="Real-time performance monitoring and fairness analytics for AI operations"
      icon={TrendingUp}
      isLoading={isLoading}
      error={error}
      onRefresh={refetch}
    >
      <div className="space-y-6">
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
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {dashboardData?.data?.activeAlerts?.filter(alert => alert.severity === 'critical').length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Critical Issues Detected</AlertTitle>
            <AlertDescription>
              {dashboardData.data.activeAlerts.filter(alert => alert.severity === 'critical').length} critical issues require immediate attention.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Performance</TabsTrigger>
            <TabsTrigger value="bias">Bias Monitoring</TabsTrigger>
            <TabsTrigger value="fairness">Fairness Metrics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <PerformanceOverview 
              data={dashboardData?.data || null} 
              loading={isLoading}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="bias" className="space-y-4">
            <BiasMonitoring 
              data={dashboardData?.data || null} 
              filters={filters}
              loading={isLoading}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="fairness" className="space-y-4">
            <FairnessMetrics 
              data={dashboardData?.data || null} 
              filters={filters}
              loading={isLoading}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <AlertsPanel 
              alerts={dashboardData?.data?.activeAlerts || []} 
              loading={isLoading}
              onRefresh={refetch}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageWrapper>
  );
}
