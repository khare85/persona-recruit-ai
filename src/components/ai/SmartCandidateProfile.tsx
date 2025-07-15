/**
 * Smart Candidate Profile Component
 * AI-enhanced candidate profile with real-time insights
 */

'use client';

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  Star,
  AlertCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useAIInsights, useJobMatching, useVideoAnalysis } from '@/hooks/useAIProcessing';

interface SmartCandidateProfileProps {
  candidateId: string;
  candidate: any;
  showAIInsights?: boolean;
  showJobMatches?: boolean;
  showVideoAnalysis?: boolean;
}

const SmartCandidateProfile = memo(({ 
  candidateId, 
  candidate, 
  showAIInsights = true,
  showJobMatches = true,
  showVideoAnalysis = true
}: SmartCandidateProfileProps) => {
  const { insights, isLoading: insightsLoading, error: insightsError } = useAIInsights(candidateId);
  const { matches, isLoading: matchesLoading, progress: matchingProgress } = useJobMatching(candidateId);
  const { analysis, isAnalyzing, progress: videoProgress } = useVideoAnalysis(candidate?.videoPath);

  const competencyScore = useMemo(() => {
    if (!insights?.competencies) return 0;
    const scores = Object.values(insights.competencies);
    return scores.reduce((sum: number, score: any) => sum + score.score, 0) / scores.length;
  }, [insights]);

  const matchScore = useMemo(() => {
    if (!matches?.length) return 0;
    return matches.reduce((sum, match) => sum + match.score, 0) / matches.length;
  }, [matches]);

  return (
    <div className="space-y-6">
      {/* Basic Profile Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {candidate.name}
                {insights?.overallScore && (
                  <Badge variant="secondary">
                    Score: {insights.overallScore}/100
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {candidate.title} • {candidate.location}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                AI Enhanced
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {competencyScore.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                Overall Score
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {matches?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Job Matches
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {matchScore.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Match Score
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {showAIInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Insights
            </CardTitle>
            <CardDescription>
              AI-powered analysis of candidate profile and capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : insightsError ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{insightsError}</AlertDescription>
              </Alert>
            ) : insights ? (
              <div className="space-y-6">
                {/* Competencies */}
                {insights.competencies && (
                  <div>
                    <h4 className="font-semibold mb-3">Competencies</h4>
                    <div className="space-y-3">
                      {Object.entries(insights.competencies).map(([key, competency]: [string, any]) => (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {competency.score}/10
                            </span>
                          </div>
                          <Progress value={competency.score * 10} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {competency.feedback}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {insights.strengths && (
                  <div>
                    <h4 className="font-semibold mb-3">Strengths</h4>
                    <div className="flex flex-wrap gap-2">
                      {insights.strengths.map((strength: string, index: number) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Areas for Improvement */}
                {insights.areasForImprovement && (
                  <div>
                    <h4 className="font-semibold mb-3">Growth Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {insights.areasForImprovement.map((area: string, index: number) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                {insights.recommendation && (
                  <div>
                    <h4 className="font-semibold mb-2">AI Recommendation</h4>
                    <Badge 
                      variant={insights.recommendation.includes('Strong') ? 'default' : 'secondary'}
                      className="mb-2"
                    >
                      {insights.recommendation}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {insights.nextSteps}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No AI insights available</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Job Matches */}
      {showJobMatches && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Job Matches
              {matchesLoading && (
                <RefreshCw className="h-4 w-4 animate-spin" />
              )}
            </CardTitle>
            <CardDescription>
              AI-powered job matching based on candidate profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            {matchesLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm">Analyzing candidate profile...</span>
                </div>
                <Progress value={matchingProgress} className="mb-4" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : matches?.length > 0 ? (
              <div className="space-y-4">
                {matches.slice(0, 5).map((match, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-semibold">{match.title}</h5>
                      <p className="text-sm text-muted-foreground">
                        {match.company} • {match.location}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          {match.score.toFixed(1)}% match
                        </Badge>
                        <Badge variant="secondary">
                          {match.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {match.score.toFixed(1)}%
                      </div>
                      <Progress value={match.score} className="w-20 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No job matches found</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Video Analysis */}
      {showVideoAnalysis && candidate?.videoPath && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Video Interview Analysis
            </CardTitle>
            <CardDescription>
              AI analysis of video interview performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm">Analyzing video interview...</span>
                </div>
                <Progress value={videoProgress} className="mb-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {analysis.competencies && Object.entries(analysis.competencies).map(([key, comp]: [string, any]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {comp.score}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
                </div>
                
                {analysis.transcript && (
                  <div>
                    <h4 className="font-semibold mb-2">Key Points</h4>
                    <p className="text-sm text-muted-foreground">
                      {analysis.transcript}
                    </p>
                  </div>
                )}
                
                {analysis.behavioralObservations && (
                  <div>
                    <h4 className="font-semibold mb-2">Behavioral Observations</h4>
                    <p className="text-sm text-muted-foreground">
                      {analysis.behavioralObservations}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Video analysis not available</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

SmartCandidateProfile.displayName = 'SmartCandidateProfile';

export default SmartCandidateProfile;