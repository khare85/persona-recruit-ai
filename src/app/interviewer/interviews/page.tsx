'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare,
  Search,
  Filter,
  Calendar,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Eye,
  FileText,
  Video,
  Download,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
  Award,
  BarChart3,
  Target,
  Users,
  MapPin,
  Timer
} from 'lucide-react';
import Link from 'next/link';

// Mock interview history data
const interviewHistory = [
  {
    id: 'IV-001',
    candidateName: 'Sarah Johnson',
    candidateAvatar: '/avatars/sarah.jpg',
    position: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    interviewDate: '2024-06-21T10:00:00Z',
    duration: 60,
    type: 'Technical Interview',
    format: 'In-Person',
    location: 'Conference Room A',
    status: 'completed',
    myRating: 5,
    recommendation: 'Strong Hire',
    aiScore: 87,
    candidateRating: 4.8,
    feedbackSubmitted: true,
    notes: 'Excellent React knowledge and system design skills',
    strengths: ['Technical expertise', 'Clear communication', 'Problem solving'],
    improvements: ['Could improve on edge case handling'],
    outcome: 'hired'
  },
  {
    id: 'IV-002',
    candidateName: 'Marcus Chen',
    candidateAvatar: '/avatars/marcus.jpg',
    position: 'DevOps Engineer',
    company: 'CloudScale Solutions',
    interviewDate: '2024-06-20T14:30:00Z',
    duration: 45,
    type: 'Behavioral Interview',
    format: 'Virtual',
    location: 'Zoom Meeting',
    status: 'completed',
    myRating: 4,
    recommendation: 'Hire',
    aiScore: 92,
    candidateRating: 4.6,
    feedbackSubmitted: true,
    notes: 'Strong leadership potential and team collaboration skills',
    strengths: ['Leadership', 'Communication', 'Technical depth'],
    improvements: ['More specific examples would be helpful'],
    outcome: 'hired'
  },
  {
    id: 'IV-003',
    candidateName: 'Emily Rodriguez',
    candidateAvatar: '/avatars/emily.jpg',
    position: 'UX Designer',
    company: 'DesignFirst Studio',
    interviewDate: '2024-06-19T11:00:00Z',
    duration: 50,
    type: 'Portfolio Review',
    format: 'In-Person',
    location: 'Design Studio',
    status: 'completed',
    myRating: 3,
    recommendation: 'Hire with Reservations',
    aiScore: null,
    candidateRating: 4.2,
    feedbackSubmitted: true,
    notes: 'Creative portfolio but needs more experience with user research',
    strengths: ['Creative thinking', 'Design skills', 'Portfolio quality'],
    improvements: ['User research methodology', 'Data-driven design'],
    outcome: 'declined'
  },
  {
    id: 'IV-004',
    candidateName: 'David Kim',
    candidateAvatar: '/avatars/david.jpg',
    position: 'Data Scientist',
    company: 'DataDriven Analytics',
    interviewDate: '2024-06-18T15:00:00Z',
    duration: 60,
    type: 'Technical + Case Study',
    format: 'Hybrid',
    location: 'Conference Room C',
    status: 'completed',
    myRating: 5,
    recommendation: 'Strong Hire',
    aiScore: 94,
    candidateRating: 4.9,
    feedbackSubmitted: true,
    notes: 'Outstanding ML expertise and practical problem-solving approach',
    strengths: ['ML expertise', 'Business acumen', 'Code quality'],
    improvements: ['None significant'],
    outcome: 'hired'
  },
  {
    id: 'IV-005',
    candidateName: 'Jennifer Walsh',
    candidateAvatar: '/avatars/jennifer.jpg',
    position: 'Product Manager',
    company: 'NextGen Robotics',
    interviewDate: '2024-06-17T09:30:00Z',
    duration: 45,
    type: 'Final Round',
    format: 'Virtual',
    location: 'Microsoft Teams',
    status: 'completed',
    myRating: 4,
    recommendation: 'Hire',
    aiScore: 89,
    candidateRating: 4.5,
    feedbackSubmitted: true,
    notes: 'Good strategic thinking with solid product vision',
    strengths: ['Product strategy', 'Stakeholder management', 'Vision'],
    improvements: ['Technical depth could be stronger'],
    outcome: 'hired'
  }
];

export default function InterviewerInterviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recommendationFilter, setRecommendationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'Strong Hire':
        return <Badge className="bg-green-100 text-green-800"><TrendingUp className="mr-1 h-3 w-3" />Strong Hire</Badge>;
      case 'Hire':
        return <Badge className="bg-blue-100 text-blue-800"><ThumbsUp className="mr-1 h-3 w-3" />Hire</Badge>;
      case 'Hire with Reservations':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="mr-1 h-3 w-3" />Hire with Reservations</Badge>;
      case 'No Hire':
        return <Badge className="bg-red-100 text-red-800"><TrendingDown className="mr-1 h-3 w-3" />No Hire</Badge>;
      default:
        return <Badge variant="outline">{recommendation}</Badge>;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'hired':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Hired</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="mr-1 h-3 w-3" />Declined</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      default:
        return <Badge variant="outline">{outcome}</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
    ));
  };

  const filteredInterviews = interviewHistory.filter(interview => {
    const matchesSearch = interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interview.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    const matchesRecommendation = recommendationFilter === 'all' || interview.recommendation === recommendationFilter;
    
    return matchesSearch && matchesStatus && matchesRecommendation;
  });

  // Calculate statistics
  const totalInterviews = interviewHistory.length;
  const averageRating = (interviewHistory.reduce((sum, interview) => sum + interview.myRating, 0) / totalInterviews).toFixed(1);
  const averageCandidateRating = (interviewHistory.reduce((sum, interview) => sum + interview.candidateRating, 0) / totalInterviews).toFixed(1);
  const hireRate = Math.round((interviewHistory.filter(i => i.outcome === 'hired').length / totalInterviews) * 100);

  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <MessageSquare className="mr-3 h-8 w-8 text-primary" />
                Interview History
              </h1>
              <p className="text-muted-foreground mt-1">
                Review your past interviews, feedback, and performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInterviews}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating}/5</div>
              <p className="text-xs text-muted-foreground">Given by me</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Candidate Rating</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageCandidateRating}/5</div>
              <p className="text-xs text-muted-foreground">From candidates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hire Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hireRate}%</div>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by candidate, position, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Recommendations</SelectItem>
                  <SelectItem value="Strong Hire">Strong Hire</SelectItem>
                  <SelectItem value="Hire">Hire</SelectItem>
                  <SelectItem value="Hire with Reservations">Hire with Reservations</SelectItem>
                  <SelectItem value="No Hire">No Hire</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Latest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="rating-desc">Highest Rating</SelectItem>
                  <SelectItem value="rating-asc">Lowest Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">Interview List ({filteredInterviews.length})</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {filteredInterviews.map((interview) => (
              <Card key={interview.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={interview.candidateAvatar} />
                        <AvatarFallback>{interview.candidateName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold">{interview.candidateName}</h3>
                            <p className="text-muted-foreground font-medium">{interview.position}</p>
                            <p className="text-sm text-muted-foreground">{interview.company}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatDate(interview.interviewDate)}</p>
                            <p className="text-xs text-muted-foreground">{interview.duration} minutes</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Timer className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{interview.type}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{interview.format} • {interview.location}</span>
                            </div>
                            {interview.aiScore && (
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">AI Score: </span>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {interview.aiScore}%
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">My Rating:</span>
                              <div className="flex items-center space-x-1">
                                {getRatingStars(interview.myRating)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Candidate Rating:</span>
                              <span className="text-sm font-semibold">{interview.candidateRating}/5</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Recommendation:</span>
                              {getRecommendationBadge(interview.recommendation)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 p-3 rounded-lg mb-4">
                          <h4 className="font-medium text-sm mb-1">Interview Notes:</h4>
                          <p className="text-sm text-muted-foreground">{interview.notes}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">Final Outcome:</span>
                            {getOutcomeBadge(interview.outcome)}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="mr-1 h-3 w-3" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <FileText className="mr-1 h-3 w-3" />
                              Feedback
                            </Button>
                            {interview.aiScore && (
                              <Button variant="outline" size="sm">
                                <Video className="mr-1 h-3 w-3" />
                                AI Interview
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredInterviews.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No interviews found</h3>
                  <p className="text-muted-foreground">No interviews match your current search criteria.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interview Performance Trends</CardTitle>
                  <CardDescription>Your interview performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">This Month</span>
                      <span className="text-2xl font-bold">4.6/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Last Month</span>
                      <span className="text-2xl font-bold">4.4/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">3 Months Ago</span>
                      <span className="text-2xl font-bold">4.2/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendation Distribution</CardTitle>
                  <CardDescription>Breakdown of your hiring recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Strong Hire</span>
                      <Badge className="bg-green-100 text-green-800">40%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Hire</span>
                      <Badge className="bg-blue-100 text-blue-800">40%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Hire with Reservations</span>
                      <Badge className="bg-yellow-100 text-yellow-800">20%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">No Hire</span>
                      <Badge className="bg-red-100 text-red-800">0%</Badge>
                    </div>
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