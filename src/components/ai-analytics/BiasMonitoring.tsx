'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AIPerformanceDashboard, AnalyticsFilters } from '@/types/analytics.types';
import { Shield, AlertTriangle, Users, TrendingDown, TrendingUp, Eye, FileText } from 'lucide-react';

interface BiasMonitoringProps {
  data: AIPerformanceDashboard | null;
  filters: AnalyticsFilters;
  loading: boolean;
  onRefresh: () => void;
}

export function BiasMonitoring({ data, filters, loading }: BiasMonitoringProps) {
  const [selectedBiasType, setSelectedBiasType] = useState<string | null>(null);

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { biasOverview } = data;

  // Mock data for detailed bias analysis
  const biasBreakdown = [
    { type: 'Gender Bias', count: 12, severity: 'high', trend: 'decreasing' },
    { type: 'Age Bias', count: 8, severity: 'medium', trend: 'stable' },
    { type: 'Racial Bias', count: 3, severity: 'critical', trend: 'increasing' },
    { type: 'Education Bias', count: 15, severity: 'low', trend: 'decreasing' },
    { type: 'Location Bias', count: 6, severity: 'medium', trend: 'stable' }
  ];

  const demographicAnalysis = [
    { group: 'Gender: Female', successRate: 72, sampleSize: 450, fairnessScore: 0.78 },
    { group: 'Gender: Male', successRate: 85, sampleSize: 520, fairnessScore: 0.92 },
    { group: 'Age: 18-25', successRate: 68, sampleSize: 234, fairnessScore: 0.74 },
    { group: 'Age: 26-35', successRate: 88, sampleSize: 456, fairnessScore: 0.95 },
    { group: 'Age: 36-45', successRate: 82, sampleSize: 378, fairnessScore: 0.89 },
    { group: 'Age: 46-55', successRate: 79, sampleSize: 245, fairnessScore: 0.85 },
    { group: 'Age: 55+', successRate: 65, sampleSize: 123, fairnessScore: 0.71 }
  ];

  const biasDetectionTrend = [
    { date: '2024-01-01', flags: 5, criticalFlags: 1 },
    { date: '2024-01-02', flags: 8, criticalFlags: 2 },
    { date: '2024-01-03', flags: 3, criticalFlags: 0 },
    { date: '2024-01-04', flags: 12, criticalFlags: 3 },
    { date: '2024-01-05', flags: 6, criticalFlags: 1 },
    { date: '2024-01-06', flags: 4, criticalFlags: 0 },
    { date: '2024-01-07', flags: 7, criticalFlags: 1 }
  ];

  const pieData = biasBreakdown.map((item, index) => ({
    name: item.type,
    value: item.count,
    color: `hsl(${index * 360 / biasBreakdown.length}, 70%, 50%)`
  }));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable': return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
      default: return null;
    }
  };

  const getFairnessColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Bias Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bias Flags</p>
                <p className="text-2xl font-bold">{biasOverview.totalFlags}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              {getTrendIcon(biasOverview.trendDirection)}
              <span className="ml-1 text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Flags</p>
                <p className="text-2xl font-bold text-red-600">{biasOverview.criticalFlags}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-4">
              <Progress 
                value={(biasOverview.criticalFlags / biasOverview.totalFlags) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fairness Score</p>
                <p className={`text-2xl font-bold ${getFairnessColor(biasOverview.fairnessScore)}`}>
                  {(biasOverview.fairnessScore * 100).toFixed(1)}%
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-4">
              <Progress value={biasOverview.fairnessScore * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bias Types</p>
                <p className="text-2xl font-bold">{Object.keys(biasOverview.flagsByType).length}</p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Active monitoring
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {biasOverview.criticalFlags > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {biasOverview.criticalFlags} critical bias issues detected requiring immediate attention. 
            Review the bias breakdown below for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bias Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Bias Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Count",
                  color: "hsl(var(--chart-1))",
                }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bias Detection Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Bias Detection Trend (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                flags: {
                  label: "Total Flags",
                  color: "hsl(var(--chart-1))",
                },
                criticalFlags: {
                  label: "Critical Flags",
                  color: "hsl(var(--destructive))",
                }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={biasDetectionTrend}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="flags"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="criticalFlags"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bias Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Bias Type Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {biasBreakdown.map((bias, index) => (
                <div 
                  key={index} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedBiasType === bias.type ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedBiasType(selectedBiasType === bias.type ? null : bias.type)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{bias.type}</span>
                        <Badge variant={getSeverityColor(bias.severity) as any}>
                          {bias.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {bias.count} flags detected
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(bias.trend)}
                      <span className="text-lg font-bold">{bias.count}</span>
                    </div>
                  </div>
                  
                  {selectedBiasType === bias.type && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Detailed analysis and recommendations for {bias.type} would appear here.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demographic Group Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Demographic Group Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demographicAnalysis.map((group, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{group.group}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        n={group.sampleSize}
                      </Badge>
                      <span className={`text-sm font-medium ${getFairnessColor(group.fairnessScore)}`}>
                        {(group.fairnessScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span>{group.successRate}%</span>
                  </div>
                  <Progress value={group.successRate} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Critical: Address Racial Bias</p>
                <p className="text-sm text-red-700 mt-1">
                  3 critical racial bias flags detected. Immediate review of training data and model parameters required.
                </p>
                <Button variant="destructive" size="sm" className="mt-2">
                  Review Now
                </Button>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Eye className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Monitor Gender Bias Trend</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Gender bias flags are decreasing but still require monitoring. Consider bias testing in pipeline.
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Set Up Monitoring
                </Button>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Improve Data Collection</p>
                <p className="text-sm text-blue-700 mt-1">
                  Sample sizes for some demographic groups are low. Consider expanding data collection with user consent.
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  View Guidelines
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}