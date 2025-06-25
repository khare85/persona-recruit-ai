'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Target, 
  Award, 
  BookOpen, 
  Lightbulb,
  BarChart3,
  CalendarDays,
  Users,
  DollarSign,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Zap,
  Brain,
  Trophy,
  Briefcase,
  GraduationCap,
  Activity,
  MapPin,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface CareerInsights {
  profileStrength: number;
  skillsAnalysis: {
    strongSkills: string[];
    skillsToImprove: string[];
    recommendedSkills: string[];
    industryDemand: { [key: string]: number };
  };
  marketAnalysis: {
    avgSalaryRange: string;
    jobAvailability: number;
    competitionLevel: 'low' | 'medium' | 'high';
    growthTrend: 'up' | 'down' | 'stable';
    topLocations: string[];
  };
  applicationStats: {
    totalApplications: number;
    responseRate: number;
    interviewRate: number;
    avgTimeToResponse: number;
    successfulApplications: number;
  };
  recommendations: Array<{
    id: string;
    type: 'skill' | 'experience' | 'network' | 'application';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: string;
    timeToComplete: string;
  }>;
}

interface LearningResource {
  id: string;
  title: string;
  provider: string;
  type: 'course' | 'certification' | 'book' | 'video' | 'article';
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  price: string;
  relevanceScore: number;
  skills: string[];
  url: string;
}

export default function CandidateCareerInsightsPage() {
  const [insights, setInsights] = useState<CareerInsights | null>(null);
  const [learningResources, setLearningResources] = useState<LearningResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCareerInsights();
  }, []);

  const fetchCareerInsights = async () => {
    try {
      const [insightsResponse, resourcesResponse] = await Promise.all([
        fetch('/api/candidates/career-insights'),
        fetch('/api/candidates/learning-resources')
      ]);

      if (insightsResponse.ok) {
        const insightsResult = await insightsResponse.json();
        setInsights(insightsResult.data);
      }

      if (resourcesResponse.ok) {
        const resourcesResult = await resourcesResponse.json();
        setLearningResources(resourcesResult.data.resources || []);
      }
    } catch (error) {
      console.error('Error fetching career insights:', error);
      // Mock data for demonstration
      const mockInsights: CareerInsights = {
        profileStrength: 78,
        skillsAnalysis: {
          strongSkills: ['React', 'JavaScript', 'Node.js', 'TypeScript'],
          skillsToImprove: ['System Design', 'AWS', 'Docker'],
          recommendedSkills: ['GraphQL', 'Kubernetes', 'Machine Learning'],
          industryDemand: {
            'React': 95,
            'JavaScript': 98,
            'Node.js': 87,
            'TypeScript': 89,
            'GraphQL': 76,
            'AWS': 92,
            'Docker': 84
          }
        },
        marketAnalysis: {
          avgSalaryRange: '$110,000 - $150,000',
          jobAvailability: 87,
          competitionLevel: 'medium',
          growthTrend: 'up',
          topLocations: ['San Francisco', 'New York', 'Seattle', 'Austin', 'Remote']
        },
        applicationStats: {
          totalApplications: 23,
          responseRate: 65,
          interviewRate: 34,
          avgTimeToResponse: 5.2,
          successfulApplications: 8
        },
        recommendations: [
          {
            id: '1',
            type: 'skill',
            title: 'Learn System Design',
            description: 'System design is highly valued for senior positions. Adding this skill could increase your interview rate by 40%.',
            priority: 'high',
            estimatedImpact: '+40% interview rate',
            timeToComplete: '2-3 months'
          },
          {
            id: '2',
            type: 'experience',
            title: 'Add Open Source Contributions',
            description: 'Contributing to popular open source projects can significantly boost your profile visibility.',
            priority: 'medium',
            estimatedImpact: '+25% profile views',
            timeToComplete: '1-2 months'
          },
          {
            id: '3',
            type: 'application',
            title: 'Optimize Application Strategy',
            description: 'Your response rate is good, but targeting companies with better cultural fit could improve success.',
            priority: 'medium',
            estimatedImpact: '+15% success rate',
            timeToComplete: '2 weeks'
          }
        ]
      };

      const mockResources: LearningResource[] = [
        {
          id: '1',
          title: 'System Design Interview Course',
          provider: 'Tech Academy',
          type: 'course',
          duration: '8 weeks',
          level: 'intermediate',
          rating: 4.8,
          price: '$99',
          relevanceScore: 94,
          skills: ['System Design', 'Architecture', 'Scalability'],
          url: 'https://example.com/course1'
        },
        {
          id: '2',
          title: 'AWS Certified Solutions Architect',
          provider: 'Amazon',
          type: 'certification',
          duration: '3-4 months',
          level: 'intermediate',
          rating: 4.7,
          price: '$150',
          relevanceScore: 89,
          skills: ['AWS', 'Cloud Computing', 'DevOps'],
          url: 'https://example.com/cert1'
        },
        {
          id: '3',
          title: 'Advanced React Patterns',
          provider: 'React Academy',
          type: 'course',
          duration: '4 weeks',
          level: 'advanced',
          rating: 4.9,
          price: '$79',
          relevanceScore: 87,
          skills: ['React', 'JavaScript', 'Performance'],
          url: 'https://example.com/course2'
        }
      ];

      setInsights(mockInsights);
      setLearningResources(mockResources);
    } finally {
      setIsLoading(false);
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Minus className="h-4 w-4 text-yellow-600" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'certification': return <Award className="h-4 w-4 text-purple-600" />;
      case 'book': return <BookOpen className="h-4 w-4 text-green-600" />;
      case 'video': return <Activity className="h-4 w-4 text-red-600" />;
      case 'article': return <Activity className="h-4 w-4 text-gray-600" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  if (!insights) return null;

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <TrendingUp className="mr-3 h-8 w-8 text-primary" />
            Career Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered insights to accelerate your career growth and optimize your job search strategy
          </p>
        </div>

        {/* Profile Strength Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-6 w-6 text-primary" />
              Profile Strength Score
            </CardTitle>
            <CardDescription>
              Your overall profile strength based on skills, experience, and market demand
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Profile Completeness</span>
                  <span className="text-sm font-bold">{insights.profileStrength}%</span>
                </div>
                <Progress value={insights.profileStrength} className="h-3" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{insights.profileStrength}/100</div>
                <p className="text-xs text-muted-foreground">Strong Profile</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="skills" className="space-y-6">
          <TabsList>
            <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
            <TabsTrigger value="market">Market Insights</TabsTrigger>
            <TabsTrigger value="performance">Application Performance</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="learning">Learning Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="skills">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                    Your Strong Skills
                  </CardTitle>
                  <CardDescription>Skills where you excel in the current market</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.skillsAnalysis.strongSkills.map((skill) => (
                      <div key={skill} className="flex justify-between items-center">
                        <span className="font-medium">{skill}</span>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={insights.skillsAnalysis.industryDemand[skill] || 0} 
                            className="w-20 h-2" 
                          />
                          <span className="text-xs text-muted-foreground w-8">
                            {insights.skillsAnalysis.industryDemand[skill] || 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
                    Skills to Improve
                  </CardTitle>
                  <CardDescription>High-demand skills to boost your competitiveness</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.skillsAnalysis.skillsToImprove.map((skill) => (
                      <div key={skill} className="flex justify-between items-center">
                        <span className="font-medium">{skill}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-yellow-600">
                            High Demand
                          </Badge>
                          <Button size="sm" variant="outline">
                            Learn
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5 text-blue-600" />
                    Recommended Skills
                  </CardTitle>
                  <CardDescription>Emerging skills that could give you a competitive edge</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {insights.skillsAnalysis.recommendedSkills.map((skill) => (
                      <div key={skill} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{skill}</span>
                          <Badge variant="secondary">+15% salary</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Growing demand in your field
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="market">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                    Market Analysis
                  </CardTitle>
                  <CardDescription>Current market conditions for your skill set</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Average Salary Range</span>
                    <span className="text-lg font-bold text-green-600">
                      {insights.marketAnalysis.avgSalaryRange}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Job Availability</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={insights.marketAnalysis.jobAvailability} className="w-20 h-2" />
                      <span className="font-bold">{insights.marketAnalysis.jobAvailability}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Competition Level</span>
                    <Badge className={getCompetitionColor(insights.marketAnalysis.competitionLevel)}>
                      {insights.marketAnalysis.competitionLevel}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Growth Trend</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(insights.marketAnalysis.growthTrend)}
                      <span className="font-medium capitalize">{insights.marketAnalysis.growthTrend}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-blue-600" />
                    Top Hiring Locations
                  </CardTitle>
                  <CardDescription>Best locations for opportunities in your field</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.marketAnalysis.topLocations.map((location, index) => (
                      <div key={location} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{index + 1}</span>
                          </div>
                          <span className="font-medium">{location}</span>
                        </div>
                        <Button size="sm" variant="outline">
                          View Jobs
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{insights.applicationStats.totalApplications}</div>
                  <p className="text-xs text-muted-foreground">Applications sent</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{insights.applicationStats.responseRate}%</div>
                  <p className="text-xs text-muted-foreground">Above average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{insights.applicationStats.interviewRate}%</div>
                  <p className="text-xs text-muted-foreground">Interview conversion</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{insights.applicationStats.avgTimeToResponse}</div>
                  <p className="text-xs text-muted-foreground">Days to hear back</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Application Performance Insights</CardTitle>
                <CardDescription>Analysis of your job application success patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-green-800">Strong Response Rate</h4>
                        <p className="text-sm text-green-700">
                          Your {insights.applicationStats.responseRate}% response rate is above the industry average of 45%.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <div className="flex">
                      <Lightbulb className="h-5 w-5 text-blue-400" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">Optimization Opportunity</h4>
                        <p className="text-sm text-blue-700">
                          Companies respond to you in {insights.applicationStats.avgTimeToResponse} days on average. Consider following up after 7 days for better engagement.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <div className="flex">
                      <Trophy className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">Success Pattern</h4>
                        <p className="text-sm text-yellow-700">
                          You have {insights.applicationStats.successfulApplications} successful applications. Tech companies with 100-500 employees show the highest success rate for your profile.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="space-y-6">
              {insights.recommendations.map((rec) => (
                <Card key={rec.id} className={`${getPriorityColor(rec.priority)} border-l-4`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          {rec.type === 'skill' && <GraduationCap className="mr-2 h-5 w-5" />}
                          {rec.type === 'experience' && <Briefcase className="mr-2 h-5 w-5" />}
                          {rec.type === 'network' && <Users className="mr-2 h-5 w-5" />}
                          {rec.type === 'application' && <Target className="mr-2 h-5 w-5" />}
                          {rec.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {rec.description}
                        </CardDescription>
                      </div>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                        {rec.priority} priority
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {rec.estimatedImpact}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {rec.timeToComplete}
                        </div>
                      </div>
                      <Button size="sm">
                        Get Started
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="learning">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="mr-2 h-6 w-6 text-primary" />
                    Recommended Learning Resources
                  </CardTitle>
                  <CardDescription>
                    Personalized learning recommendations based on your career goals and skill gaps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {learningResources.map((resource) => (
                      <Card key={resource.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                              {getResourceTypeIcon(resource.type)}
                              <Badge variant="outline" className="text-xs">
                                {resource.type}
                              </Badge>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {resource.relevanceScore}% match
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{resource.rating}</span>
                            </div>
                          </div>
                          
                          <h4 className="font-semibold text-lg mb-1">{resource.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{resource.provider}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
                            <span>📅 {resource.duration}</span>
                            <span>📊 {resource.level}</span>
                            <span className="font-medium text-green-600">💰 {resource.price}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {resource.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          
                          <Button size="sm" className="w-full" asChild>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              View Resource
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}