'use client';

import { useState, useEffect } from 'react';
import { 
  Video, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Star,
  Play,
  Pause,
  Square,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MessageSquare,
  FileText,
  BarChart3,
  Brain,
  Settings,
  Eye,
  Send,
  Plus,
  Filter,
  Search,
  Download,
  Zap,
  Target,
  Award,
  TrendingUp,
  UserCheck,
  Timer,
  Headphones,
  Volume2,
  VolumeX,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Flag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface InterviewerStats {
  totalInterviews: number;
  scheduledToday: number;
  completedThisWeek: number;
  averageScore: number;
  averageDuration: number;
  successRate: number;
}

interface ScheduledInterview {
  id: string;
  candidateName: string;
  position: string;
  company: string;
  type: 'technical' | 'behavioral' | 'cultural' | 'final';
  scheduledTime: Date;
  duration: number;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  candidateAvatar?: string;
  jobId: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}

interface InterviewFeedback {
  id: string;
  interviewId: string;
  candidateName: string;
  position: string;
  company: string;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  culturalFitScore: number;
  recommendation: 'hire' | 'no_hire' | 'maybe';
  strengths: string[];
  weaknesses: string[];
  notes: string;
  timestamp: Date;
}

interface LiveInterviewData {
  id: string;
  candidateName: string;
  position: string;
  company: string;
  startTime: Date;
  currentDuration: number;
  status: 'waiting' | 'connected' | 'recording' | 'paused' | 'completed';
  videoEnabled: boolean;
  audioEnabled: boolean;
  aiAnalysis: {
    sentiment: number;
    confidence: number;
    keyTopics: string[];
    recommendations: string[];
  };
}

export default function InterviewerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('scheduled');
  const [liveInterview, setLiveInterview] = useState<LiveInterviewData | null>(null);
  
  const [stats, setStats] = useState<InterviewerStats>({
    totalInterviews: 247,
    scheduledToday: 5,
    completedThisWeek: 12,
    averageScore: 7.8,
    averageDuration: 45,
    successRate: 68
  });
  
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([
    {
      id: '1',
      candidateName: 'Sarah Chen',
      position: 'Senior React Developer',
      company: 'TechCorp',
      type: 'technical',
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      duration: 60,
      status: 'upcoming',
      jobId: 'job-1',
      priority: 'high'
    },
    {
      id: '2',
      candidateName: 'Michael Rodriguez',
      position: 'Full Stack Developer',
      company: 'StartupX',
      type: 'behavioral',
      scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      duration: 45,
      status: 'upcoming',
      jobId: 'job-2',
      priority: 'medium'
    },
    {
      id: '3',
      candidateName: 'Emily Johnson',
      position: 'DevOps Engineer',
      company: 'CloudTech',
      type: 'technical',
      scheduledTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      duration: 90,
      status: 'upcoming',
      jobId: 'job-3',
      priority: 'high'
    },
    {
      id: '4',
      candidateName: 'David Park',
      position: 'Product Manager',
      company: 'Innovation Labs',
      type: 'cultural',
      scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      duration: 30,
      status: 'completed',
      jobId: 'job-4',
      priority: 'medium'
    }
  ]);
  
  const [recentFeedback, setRecentFeedback] = useState<InterviewFeedback[]>([
    {
      id: '1',
      interviewId: '4',
      candidateName: 'David Park',
      position: 'Product Manager',
      company: 'Innovation Labs',
      overallScore: 8.5,
      technicalScore: 8.0,
      communicationScore: 9.0,
      culturalFitScore: 8.5,
      recommendation: 'hire',
      strengths: ['Strong leadership', 'Excellent communication', 'Strategic thinking'],
      weaknesses: ['Limited technical depth', 'Needs more market research experience'],
      notes: 'Excellent candidate with strong product vision and leadership skills.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      interviewId: '3',
      candidateName: 'Lisa Wang',
      position: 'UX Designer',
      company: 'DesignStudio',
      overallScore: 7.2,
      technicalScore: 7.5,
      communicationScore: 7.0,
      culturalFitScore: 7.0,
      recommendation: 'maybe',
      strengths: ['Creative problem solving', 'Good portfolio', 'User research skills'],
      weaknesses: ['Limited prototyping experience', 'Communication could be clearer'],
      notes: 'Good potential but needs more experience in collaborative design processes.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'bg-purple-100 text-purple-800';
      case 'behavioral': return 'bg-orange-100 text-orange-800';
      case 'cultural': return 'bg-green-100 text-green-800';
      case 'final': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'hire': return 'bg-green-100 text-green-800';
      case 'no_hire': return 'bg-red-100 text-red-800';
      case 'maybe': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStartInterview = (interview: ScheduledInterview) => {
    setLiveInterview({
      id: interview.id,
      candidateName: interview.candidateName,
      position: interview.position,
      company: interview.company,
      startTime: new Date(),
      currentDuration: 0,
      status: 'waiting',
      videoEnabled: true,
      audioEnabled: true,
      aiAnalysis: {
        sentiment: 0.7,
        confidence: 0.8,
        keyTopics: ['React', 'JavaScript', 'Problem Solving'],
        recommendations: ['Ask about scalability experience', 'Discuss team collaboration']
      }
    });
    setActiveTab('live');
  };

  const handleEndInterview = () => {
    if (liveInterview) {
      setLiveInterview(null);
      setActiveTab('feedback');
    }
  };

  if (!user || user.role !== 'interviewer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interviewer Dashboard</h1>
                <p className="text-gray-600">Manage interviews and candidate assessments</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
              
              <Button 
                onClick={() => router.push('/interviewer/settings')}
                variant="outline"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              
              <Button 
                onClick={() => router.push('/interviewer/calendar')}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Interviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalInterviews}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Video className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Scheduled Today</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.scheduledToday}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedThisWeek}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageScore}/10</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageDuration}m</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="live">Live Interview</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Scheduled Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduledInterviews.map(interview => (
                    <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {interview.candidateName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{interview.candidateName}</h3>
                            <Badge className={getTypeColor(interview.type)}>
                              {interview.type}
                            </Badge>
                            <Badge className={getPriorityColor(interview.priority)}>
                              {interview.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {interview.position} at {interview.company}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatTime(interview.scheduledTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Timer className="w-4 h-4" />
                              {formatDuration(interview.duration)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(interview.status)}>
                          {interview.status}
                        </Badge>
                        {interview.status === 'upcoming' && (
                          <Button 
                            onClick={() => handleStartInterview(interview)}
                            size="sm"
                            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live">
            {liveInterview ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Video Interview */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video className="w-5 h-5" />
                          Live Interview - {liveInterview.candidateName}
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                          LIVE
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Video Area */}
                        <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
                          <div className="text-center text-white">
                            <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">Video Interview in Progress</p>
                            <p className="text-sm opacity-75">
                              {liveInterview.position} at {liveInterview.company}
                            </p>
                          </div>
                        </div>
                        
                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                          <Button 
                            variant={liveInterview.videoEnabled ? "default" : "outline"}
                            size="sm"
                          >
                            {liveInterview.videoEnabled ? (
                              <Camera className="w-4 h-4 mr-2" />
                            ) : (
                              <CameraOff className="w-4 h-4 mr-2" />
                            )}
                            Video
                          </Button>
                          
                          <Button 
                            variant={liveInterview.audioEnabled ? "default" : "outline"}
                            size="sm"
                          >
                            {liveInterview.audioEnabled ? (
                              <Mic className="w-4 h-4 mr-2" />
                            ) : (
                              <MicOff className="w-4 h-4 mr-2" />
                            )}
                            Audio
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            <Square className="w-4 h-4 mr-2" />
                            Record
                          </Button>
                          
                          <Button 
                            onClick={handleEndInterview}
                            variant="destructive" 
                            size="sm"
                          >
                            <Square className="w-4 h-4 mr-2" />
                            End Interview
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Analysis & Notes */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        AI Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Sentiment</span>
                            <span className="text-sm text-gray-600">
                              {Math.round(liveInterview.aiAnalysis.sentiment * 100)}%
                            </span>
                          </div>
                          <Progress value={liveInterview.aiAnalysis.sentiment * 100} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Confidence</span>
                            <span className="text-sm text-gray-600">
                              {Math.round(liveInterview.aiAnalysis.confidence * 100)}%
                            </span>
                          </div>
                          <Progress value={liveInterview.aiAnalysis.confidence * 100} className="h-2" />
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Key Topics</h4>
                          <div className="flex flex-wrap gap-1">
                            {liveInterview.aiAnalysis.keyTopics.map(topic => (
                              <Badge key={topic} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">AI Recommendations</h4>
                          <ul className="text-sm space-y-1">
                            {liveInterview.aiAnalysis.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <Target className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Interview Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Add your interview notes here..."
                        rows={6}
                        className="resize-none"
                      />
                      <Button size="sm" className="mt-2">
                        <Bookmark className="w-4 h-4 mr-2" />
                        Save Note
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Interview</h3>
                  <p className="text-gray-600 mb-4">Start an interview from the scheduled interviews tab</p>
                  <Button 
                    onClick={() => setActiveTab('scheduled')}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    View Scheduled Interviews
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Recent Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentFeedback.map(feedback => (
                    <div key={feedback.id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{feedback.candidateName}</h3>
                          <p className="text-sm text-gray-600">{feedback.position} at {feedback.company}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRecommendationColor(feedback.recommendation)}>
                            {feedback.recommendation.replace('_', ' ')}
                          </Badge>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{feedback.overallScore}/10</div>
                            <div className="text-sm text-gray-600">Overall</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{feedback.technicalScore}/10</div>
                          <div className="text-sm text-gray-600">Technical</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{feedback.communicationScore}/10</div>
                          <div className="text-sm text-gray-600">Communication</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{feedback.culturalFitScore}/10</div>
                          <div className="text-sm text-gray-600">Cultural Fit</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                          <ul className="text-sm space-y-1">
                            {feedback.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">Areas for Improvement</h4>
                          <ul className="text-sm space-y-1">
                            {feedback.weaknesses.map((weakness, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                        <p className="text-sm text-gray-700">{feedback.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Interview Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Technical Interviews</span>
                        <span className="text-sm text-gray-600">85% success rate</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Behavioral Interviews</span>
                        <span className="text-sm text-gray-600">72% success rate</span>
                      </div>
                      <Progress value={72} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Cultural Fit</span>
                        <span className="text-sm text-gray-600">68% success rate</span>
                      </div>
                      <Progress value={68} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Monthly Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Interviews Conducted</span>
                      <span className="text-sm text-gray-600">+15% vs last month</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Score</span>
                      <span className="text-sm text-gray-600">+0.3 vs last month</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-sm text-gray-600">+5% vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}