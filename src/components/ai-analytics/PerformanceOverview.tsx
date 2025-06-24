'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { AIPerformanceDashboard } from '@/types/analytics.types';
import { Activity, Clock, CheckCircle, XCircle, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceOverviewProps {
  data: AIPerformanceDashboard | null;
  loading: boolean;
  onRefresh: () => void;
}

export function PerformanceOverview({ data, loading }: PerformanceOverviewProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
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

  const { performance, operationStats, modelUsage } = data;

  // Mock data for charts - in production this would come from the API
  const latencyTrend = [
    { time: '00:00', latency: 1200, operations: 45 },
    { time: '04:00', latency: 1150, operations: 32 },
    { time: '08:00', latency: 1800, operations: 89 },
    { time: '12:00', latency: 2100, operations: 156 },
    { time: '16:00', latency: 1950, operations: 134 },
    { time: '20:00', latency: 1600, operations: 67 }
  ];

  const operationBreakdown = [
    { operation: 'Resume Processing', count: 2340, successRate: 94.2 },
    { operation: 'Candidate Matching', count: 1890, successRate: 97.8 },
    { operation: 'Job Generation', count: 567, successRate: 89.3 },
    { operation: 'Skill Extraction', count: 3421, successRate: 96.1 },
    { operation: 'Interview Analysis', count: 234, successRate: 91.7 }
  ];

  const errorTrend = [
    { time: '00:00', errors: 2 },
    { time: '04:00', errors: 1 },
    { time: '08:00', errors: 5 },
    { time: '12:00', errors: 8 },
    { time: '16:00', errors: 3 },
    { time: '20:00', errors: 2 }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Operations</p>
                <p className="text-2xl font-bold">{performance.totalOperations.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">+12.5%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{(performance.successRate * 100).toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4">
              <Progress value={performance.successRate * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold">{performance.averageLatency}ms</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600">-8.2%</span>
              <span className="text-muted-foreground ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{(performance.errorRate * 100).toFixed(2)}%</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-4">
              <Progress value={performance.errorRate * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Latency Trend (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                latency: {
                  label: "Latency (ms)",
                  color: "hsl(var(--chart-1))",
                },
                operations: {
                  label: "Operations",
                  color: "hsl(var(--chart-2))",
                }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyTrend}>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="latency"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Operations Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Operations by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Count",
                  color: "hsl(var(--chart-1))",
                }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={operationBreakdown} layout="horizontal">
                  <XAxis type="number" />
                  <YAxis dataKey="operation" type="category" width={120} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--chart-1))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              Top Error Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performance.topErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{error.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {error.count} occurrences
                    </p>
                  </div>
                  <Badge variant={error.percentage > 50 ? 'destructive' : error.percentage > 20 ? 'secondary' : 'outline'}>
                    {error.percentage.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Model Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Model Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modelUsage.map((model, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{model.model}</span>
                    <Badge variant="outline">{model.operations} ops</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Latency: </span>
                      <span>{model.averageLatency}ms</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success: </span>
                      <span>{(model.successRate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress value={model.successRate * 100} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            Error Trend (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              errors: {
                label: "Errors",
                color: "hsl(var(--destructive))",
              }
            }}
            className="h-[200px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={errorTrend}>
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}