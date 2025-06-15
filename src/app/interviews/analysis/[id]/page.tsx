"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Container } from '@/components/shared/Container';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  Star, 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Eye,
  Download,
  Share2,
  Video
} from 'lucide-react';
import { getMockInterviewAnalysis } from '@/services/mockDataService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function InterviewAnalysisPage() {
  const params = useParams();
  const id = params.id as string;
  const analysis = getMockInterviewAnalysis(id);

  if (!analysis) {
    return (
      <DashboardLayout>
        <Container>
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-4">Interview Analysis Not Found</h1>
            <p className="text-muted-foreground">The requested interview analysis could not be found.</p>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  // Chart data
  const competencyData = analysis.competencyScores.map(comp => ({
    name: comp.name,
    score: comp.score,
    maxScore: comp.maxScore,
    percentage: (comp.score / comp.maxScore) * 100
  }));

  const videoMetricsData = [
    { name: 'Confidence', value: analysis.videoMetrics.confidenceLevel },
    { name: 'Clarity', value: analysis.videoMetrics.communicationClarity },
    { name: 'Engagement', value: analysis.videoMetrics.engagement },
    { name: 'Professionalism', value: analysis.videoMetrics.professionalDemeanor }
  ];

  const questionScoresData = analysis.interviewQuestions.map((q, index) => ({
    question: `Q${index + 1}`,
    score: q.score,
    fullQuestion: q.question
  }));

  const pieData = [
    { name: 'Strengths', value: analysis.keyStrengths.length, color: '#22c55e' },
    { name: 'Development Areas', value: analysis.areasForDevelopment.length, color: '#f59e0b' }
  ];

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Strongly Recommended': return 'bg-green-100 text-green-800 border-green-200';
      case 'Recommended': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Recommended with Reservations': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Not Recommended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600';
    if (score >= 7) return 'text-blue-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout>
      <Container>
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <Brain className="mr-3 h-8 w-8 text-primary" />
                AI Interview Analysis Report
              </h1>
              <p className="text-muted-foreground mt-2">
                Comprehensive analysis for {analysis.candidateName} - {analysis.jobTitle}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.overallScore}/100</div>
                <Progress value={analysis.overallScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recommendation</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge className={getRecommendationColor(analysis.recommendation)}>
                  {analysis.recommendation}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interview Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis.duration}</div>
                <p className="text-xs text-muted-foreground">
                  {new Date(analysis.interviewDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Candidate</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{analysis.candidateName}</div>
                <p className="text-xs text-muted-foreground">ID: {analysis.candidateId}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="competencies">Competencies</TabsTrigger>
            <TabsTrigger value="video-analysis">Video Analysis</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Q&A</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Behavioral Analysis */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                    Behavioral Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{analysis.behavioralAnalysis}</p>
                </CardContent>
              </Card>

              {/* Key Strengths */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Key Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.keyStrengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <Star className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Areas for Development */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Areas for Development
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.areasForDevelopment.map((area, index) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="mr-2 h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Justification */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Detailed Justification</CardTitle>
                  <CardDescription>AI reasoning behind the recommendation</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{analysis.detailedJustification}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="competencies" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Competency Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                    Competency Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={competencyData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Competency Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={competencyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Competency Details */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Competency Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.competencyScores.map((comp, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">{comp.name}</h4>
                          <Badge variant="outline" className={getScoreColor(comp.score)}>
                            {comp.score}/{comp.maxScore}
                          </Badge>
                        </div>
                        <Progress value={(comp.score / comp.maxScore) * 100} className="mb-2" />
                        <p className="text-sm text-muted-foreground">{comp.justification}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="video-analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="mr-2 h-5 w-5 text-primary" />
                    Video Analysis Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={videoMetricsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Video Metrics Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Behavioral Indicators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Confidence Level</span>
                        <span className="text-sm">{analysis.videoMetrics.confidenceLevel}%</span>
                      </div>
                      <Progress value={analysis.videoMetrics.confidenceLevel} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Communication Clarity</span>
                        <span className="text-sm">{analysis.videoMetrics.communicationClarity}%</span>
                      </div>
                      <Progress value={analysis.videoMetrics.communicationClarity} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Engagement</span>
                        <span className="text-sm">{analysis.videoMetrics.engagement}%</span>
                      </div>
                      <Progress value={analysis.videoMetrics.engagement} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Professional Demeanor</span>
                        <span className="text-sm">{analysis.videoMetrics.professionalDemeanor}%</span>
                      </div>
                      <Progress value={analysis.videoMetrics.professionalDemeanor} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audio Transcript Highlights */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                    Audio Transcript Highlights
                  </CardTitle>
                  <CardDescription>Key statements and responses from the interview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.audioTranscriptHighlights.map((highlight, index) => (
                      <div key={index} className="bg-muted/50 p-3 rounded-lg border-l-4 border-primary">
                        <p className="text-sm italic">"{highlight}"</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                  Question-by-Question Analysis
                </CardTitle>
                <CardDescription>Detailed breakdown of each interview question and response</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Question Scores Chart */}
                <div className="mb-6">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={questionScoresData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="question" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip 
                        labelFormatter={(label) => {
                          const item = questionScoresData.find(d => d.question === label);
                          return item ? item.fullQuestion : label;
                        }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Q&A */}
                <div className="space-y-6">
                  {analysis.interviewQuestions.map((qa, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-lg">Question {index + 1}</h4>
                        <Badge className={getScoreColor(qa.score)}>
                          Score: {qa.score}/10
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-sm text-muted-foreground mb-1">QUESTION:</h5>
                          <p className="text-sm">{qa.question}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm text-muted-foreground mb-1">CANDIDATE RESPONSE:</h5>
                          <p className="text-sm bg-muted/50 p-3 rounded">{qa.candidateResponse}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm text-muted-foreground mb-1">AI EVALUATION:</h5>
                          <p className="text-sm text-blue-700">{qa.aiEvaluation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}