'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Star,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Clock,
  Users,
  MessageSquare,
  CheckCircle,
  BarChart3,
  Calendar,
  Download,
  FileText,
  Trophy,
  Medal,
  Zap,
  ThumbsUp
} from 'lucide-react';
import { useState } from 'react';

// Mock performance data
const performanceData = {
  overview: {
    totalInterviews: 156,
    thisMonth: 12,
    averageRating: 4.8,
    candidateRating: 4.7,
    onTimeRate: 96,
    completionRate: 98,
    hireRate: 78,
    feedbackScore: 4.8
  },
  monthlyStats: [
    { month: 'Jan', interviews: 10, rating: 4.6, hireRate: 75 },
    { month: 'Feb', interviews: 14, rating: 4.7, hireRate: 80 },
    { month: 'Mar', interviews: 18, rating: 4.8, hireRate: 78 },
    { month: 'Apr', interviews: 16, rating: 4.9, hireRate: 82 },
    { month: 'May', interviews: 15, rating: 4.8, hireRate: 77 },
    { month: 'Jun', interviews: 12, rating: 4.8, hireRate: 75 }
  ],
  specializations: [
    { area: 'Frontend Development', interviews: 45, rating: 4.9, expertise: 'Expert' },
    { area: 'System Design', interviews: 38, rating: 4.8, expertise: 'Expert' },
    { area: 'Team Leadership', interviews: 32, rating: 4.7, expertise: 'Advanced' },
    { area: 'Technical Architecture', interviews: 25, rating: 4.6, expertise: 'Advanced' },
    { area: 'Product Management', interviews: 16, rating: 4.5, expertise: 'Intermediate' }
  ],
  achievements: [
    { 
      title: 'Top Interviewer Q1 2024', 
      description: 'Highest rated interviewer in the engineering department',
      date: '2024-03-31',
      icon: Trophy,
      type: 'gold'
    },
    {
      title: '100+ Interviews Milestone',
      description: 'Completed over 100 successful interviews',
      date: '2024-05-15',
      icon: Medal,
      type: 'silver'
    },
    {
      title: 'Perfect Attendance',
      description: '98% on-time rate for scheduled interviews',
      date: '2024-06-01',
      icon: CheckCircle,
      type: 'bronze'
    },
    {
      title: 'High Impact Interviewer',
      description: '4.8+ average rating from candidates',
      date: '2024-06-15',
      icon: Star,
      type: 'special'
    }
  ],
  feedback: [
    {
      candidate: 'Sarah Johnson',
      position: 'Senior Frontend Developer',
      rating: 5,
      comment: 'Alex was incredibly thorough and made me feel comfortable throughout the process.',
      date: '2024-06-21'
    },
    {
      candidate: 'Marcus Chen',
      position: 'DevOps Engineer',
      rating: 5,
      comment: 'Great technical depth and excellent communication skills.',
      date: '2024-06-20'
    },
    {
      candidate: 'David Kim',
      position: 'Data Scientist',
      rating: 5,
      comment: 'Very knowledgeable and asked insightful questions.',
      date: '2024-06-18'
    }
  ]
};

export default function InterviewerPerformancePage() {
  const [timeRange, setTimeRange] = useState('6months');

  const getAchievementIcon = (achievement: any) => {
    const IconComponent = achievement.icon;
    const colorClasses = {
      gold: 'text-yellow-600 bg-yellow-100',
      silver: 'text-gray-600 bg-gray-100',
      bronze: 'text-orange-600 bg-orange-100',
      special: 'text-purple-600 bg-purple-100'
    };
    
    return (
      <div className={`p-2 rounded-full ${colorClasses[achievement.type as keyof typeof colorClasses]}`}>
        <IconComponent className="h-6 w-6" />
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <BarChart3 className="mr-3 h-8 w-8 text-primary" />
                My Performance
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your interview performance, ratings, and achievements
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.overview.totalInterviews}</div>
              <p className="text-xs text-muted-foreground">
                +{performanceData.overview.thisMonth} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.overview.averageRating}/5</div>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +0.2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hire Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.overview.hireRate}%</div>
              <p className="text-xs text-muted-foreground">Above company average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.overview.onTimeRate}%</div>
              <p className="text-xs text-green-600">Excellent punctuality</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Performance Overview</TabsTrigger>
            <TabsTrigger value="specializations">Specializations</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="feedback">Candidate Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                    Performance Trends
                  </CardTitle>
                  <CardDescription>Your interview performance over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceData.monthlyStats.map((stat, index) => (
                      <div key={stat.month} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <h4 className="font-medium">{stat.month} 2024</h4>
                          <p className="text-sm text-muted-foreground">{stat.interviews} interviews</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{stat.rating}/5</div>
                          <div className="text-sm text-muted-foreground">{stat.hireRate}% hire rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="mr-2 h-5 w-5 text-primary" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>Detailed breakdown of your interview performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Candidate Rating</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{performanceData.overview.candidateRating}/5</span>
                        <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{performanceData.overview.completionRate}%</span>
                        <Badge className="bg-blue-100 text-blue-800">Outstanding</Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Feedback Quality</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{performanceData.overview.feedbackScore}/5</span>
                        <Badge className="bg-purple-100 text-purple-800">Top Tier</Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Interview Efficiency</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">92%</span>
                        <Badge className="bg-orange-100 text-orange-800">High</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Performance Highlights</CardTitle>
                <CardDescription>Key achievements and improvements in your recent interviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">+15%</div>
                    <div className="text-sm font-medium mb-1">Hire Rate Improvement</div>
                    <div className="text-xs text-muted-foreground">Last 3 months</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">4.9/5</div>
                    <div className="text-sm font-medium mb-1">Peak Monthly Rating</div>
                    <div className="text-xs text-muted-foreground">April 2024</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">18</div>
                    <div className="text-sm font-medium mb-1">Max Monthly Interviews</div>
                    <div className="text-xs text-muted-foreground">March 2024</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specializations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-primary" />
                  Interview Specializations
                </CardTitle>
                <CardDescription>Your areas of expertise and performance in each domain</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.specializations.map((spec, index) => (
                    <div key={spec.area} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{spec.area}</h3>
                        <p className="text-sm text-muted-foreground">{spec.interviews} interviews conducted</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">Rating</div>
                          <div className="text-lg font-bold">{spec.rating}/5</div>
                        </div>
                        <Badge 
                          className={
                            spec.expertise === 'Expert' ? 'bg-green-100 text-green-800' :
                            spec.expertise === 'Advanced' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {spec.expertise}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skill Development Recommendations</CardTitle>
                <CardDescription>Suggested areas for continued growth and improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm">Cloud Architecture Interviews</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consider expanding into cloud architecture interviews to diversify your specializations.
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm">Executive-Level Interviews</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your high ratings make you a good candidate for senior leadership position interviews.
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm">Cross-Functional Interview Training</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Training in product management interviews could broaden your interview scope.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-primary" />
                  Achievements & Recognition
                </CardTitle>
                <CardDescription>Your interviewing milestones and accomplishments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {performanceData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                      {getAchievementIcon(achievement)}
                      <div className="flex-1">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(achievement.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Towards Next Achievements</CardTitle>
                <CardDescription>Goals you're working towards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Veteran Interviewer (200+ Interviews)</h4>
                      <p className="text-sm text-muted-foreground">Complete 200 total interviews</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">156/200</div>
                      <div className="text-xs text-muted-foreground">78% Complete</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Perfect Rating Streak</h4>
                      <p className="text-sm text-muted-foreground">Maintain 4.8+ rating for 3 months</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">2/3 months</div>
                      <div className="text-xs text-muted-foreground">67% Complete</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ThumbsUp className="mr-2 h-5 w-5 text-primary" />
                  Recent Candidate Feedback
                </CardTitle>
                <CardDescription>What candidates are saying about your interviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.feedback.map((feedback, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{feedback.candidate}</h4>
                          <p className="text-sm text-muted-foreground">{feedback.position}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < feedback.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm italic">"{feedback.comment}"</p>
                      <p className="text-xs text-muted-foreground mt-2">{formatDate(feedback.date)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback Summary</CardTitle>
                <CardDescription>Common themes in candidate feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">95%</div>
                    <div className="text-sm font-medium">Positive Feedback</div>
                    <div className="text-xs text-muted-foreground">Last 6 months</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-xl font-bold text-blue-600 mb-2">"Thorough"</div>
                    <div className="text-sm font-medium">Most Common Word</div>
                    <div className="text-xs text-muted-foreground">In feedback</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-2">4.7/5</div>
                    <div className="text-sm font-medium">Avg Interview Experience</div>
                    <div className="text-xs text-muted-foreground">Candidate rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}