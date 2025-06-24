'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AIPerformanceDashboard, AnalyticsFilters } from '@/types/analytics.types';
import { Scale, TrendingUp, CheckCircle, AlertTriangle, Users } from 'lucide-react';

interface FairnessMetricsProps {
  data: AIPerformanceDashboard | null;
  filters: AnalyticsFilters;
  loading: boolean;
  onRefresh: () => void;
}

export function FairnessMetrics({ data, filters, loading }: FairnessMetricsProps) {
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

  const { fairnessMetrics } = data;

  // Mock fairness data - would come from API in production
  const fairnessScores = {
    demographicParity: 0.85,
    equalizedOdds: 0.78,
    equalOpportunity: 0.82,
    disparateImpact: 0.88,
    statisticalParity: 0.86
  };

  const fairnessTrends = [
    { date: '2024-01-01', score: 0.82 },
    { date: '2024-01-02', score: 0.84 },
    { date: '2024-01-03', score: 0.81 },
    { date: '2024-01-04', score: 0.85 },
    { date: '2024-01-05', score: 0.87 },
    { date: '2024-01-06', score: 0.86 },
    { date: '2024-01-07', score: 0.88 }
  ];

  const radarData = [
    { metric: 'Demographic Parity', score: fairnessScores.demographicParity * 100 },
    { metric: 'Equalized Odds', score: fairnessScores.equalizedOdds * 100 },
    { metric: 'Equal Opportunity', score: fairnessScores.equalOpportunity * 100 },
    { metric: 'Disparate Impact', score: fairnessScores.disparateImpact * 100 },
    { metric: 'Statistical Parity', score: fairnessScores.statisticalParity * 100 }
  ];

  const groupComparison = [
    { group: 'Gender: Male', score: 0.92, sampleSize: 520 },
    { group: 'Gender: Female', score: 0.78, sampleSize: 450 },
    { group: 'Age: 26-35', score: 0.95, sampleSize: 456 },
    { group: 'Age: 36-45', score: 0.89, sampleSize: 378 },
    { group: 'Age: 18-25', score: 0.74, sampleSize: 234 },
    { group: 'Age: 55+', score: 0.71, sampleSize: 123 }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.9) return 'default';
    if (score >= 0.8) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Fairness Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Demographic Parity</p>
              <p className={`text-2xl font-bold ${getScoreColor(fairnessScores.demographicParity)}`}>
                {(fairnessScores.demographicParity * 100).toFixed(1)}%
              </p>
              <Progress value={fairnessScores.demographicParity * 100} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Equalized Odds</p>
              <p className={`text-2xl font-bold ${getScoreColor(fairnessScores.equalizedOdds)}`}>
                {(fairnessScores.equalizedOdds * 100).toFixed(1)}%
              </p>
              <Progress value={fairnessScores.equalizedOdds * 100} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Equal Opportunity</p>
              <p className={`text-2xl font-bold ${getScoreColor(fairnessScores.equalOpportunity)}`}>
                {(fairnessScores.equalOpportunity * 100).toFixed(1)}%
              </p>
              <Progress value={fairnessScores.equalOpportunity * 100} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Disparate Impact</p>
              <p className={`text-2xl font-bold ${getScoreColor(fairnessScores.disparateImpact)}`}>
                {(fairnessScores.disparateImpact * 100).toFixed(1)}%
              </p>
              <Progress value={fairnessScores.disparateImpact * 100} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Statistical Parity</p>
              <p className={`text-2xl font-bold ${getScoreColor(fairnessScores.statisticalParity)}`}>
                {(fairnessScores.statisticalParity * 100).toFixed(1)}%
              </p>
              <Progress value={fairnessScores.statisticalParity * 100} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fairness Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="h-5 w-5 mr-2" />
              Fairness Metrics Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                score: {
                  label: "Score",
                  color: "hsl(var(--chart-1))",
                }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Fairness Score"
                    dataKey="score"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Fairness Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Fairness Trend (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                score: {
                  label: "Fairness Score",
                  color: "hsl(var(--chart-1))",
                }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fairnessTrends}>
                  <XAxis dataKey="date" />
                  <YAxis domain={[0.7, 1.0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Group Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Demographic Group Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groupComparison.map((group, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{group.group}</span>
                    <Badge variant="outline" className="text-xs">
                      n={group.sampleSize}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <Progress value={group.score * 100} className="h-2" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={getScoreBadge(group.score) as any}>
                    {(group.score * 100).toFixed(1)}%
                  </Badge>
                  {group.score >= 0.8 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fairness Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Scale className="h-5 w-5 mr-2" />
            Fairness Standards & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Current Compliance Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">80% Rule (Disparate Impact)</span>
                  <Badge variant={fairnessScores.disparateImpact >= 0.8 ? 'default' : 'destructive'}>
                    {fairnessScores.disparateImpact >= 0.8 ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Equal Opportunity</span>
                  <Badge variant={fairnessScores.equalOpportunity >= 0.8 ? 'default' : 'destructive'}>
                    {fairnessScores.equalOpportunity >= 0.8 ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Demographic Parity</span>
                  <Badge variant={fairnessScores.demographicParity >= 0.8 ? 'default' : 'destructive'}>
                    {fairnessScores.demographicParity >= 0.8 ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Recommended Actions</h4>
              <div className="space-y-2 text-sm">
                {fairnessScores.equalizedOdds < 0.8 && (
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <span>Improve equalized odds through balanced training data</span>
                  </div>
                )}
                {fairnessScores.equalOpportunity < 0.8 && (
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <span>Review model selection criteria for equal opportunity</span>
                  </div>
                )}
                {Object.values(fairnessScores).every(score => score >= 0.8) && (
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>All fairness metrics meet recommended thresholds</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}