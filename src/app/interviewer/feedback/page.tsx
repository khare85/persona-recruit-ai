'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ClipboardCheck, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  CheckCircle,
  AlertCircle,
  Save,
  Send,
  Eye,
  Video,
  FileText,
  User,
  CalendarDays,
  Clock,
  Award,
  MessageSquare,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// Mock interview data for feedback
const pendingFeedback = [
  {
    id: 'IV-001',
    candidateName: 'Sarah Johnson',
    candidateAvatar: '/avatars/sarah.jpg',
    position: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    interviewDate: '2024-06-22T10:00:00Z',
    duration: 60,
    type: 'Technical Interview',
    aiScore: 87,
    interviewNotes: 'Focus on React expertise and system design',
    candidateProfile: '/candidates/1',
    jobRequirements: [
      'React/TypeScript expertise',
      'System design experience',
      'Team leadership skills',
      'Performance optimization',
      'Testing best practices'
    ],
    interviewQuestions: [
      'Explain React virtual DOM and reconciliation',
      'Design a scalable frontend architecture',
      'How do you handle state management in large apps?',
      'Describe your testing strategy',
      'Walk through optimizing a slow React app'
    ]
  },
  {
    id: 'IV-002',
    candidateName: 'Marcus Chen',
    candidateAvatar: '/avatars/marcus.jpg',
    position: 'DevOps Engineer',
    company: 'CloudScale Solutions',
    interviewDate: '2024-06-22T14:30:00Z',
    duration: 45,
    type: 'Behavioral Interview',
    aiScore: 92,
    interviewNotes: 'Assess leadership and team collaboration skills',
    candidateProfile: '/candidates/2',
    jobRequirements: [
      'Kubernetes expertise',
      'CI/CD pipeline design',
      'Infrastructure as Code',
      'Team leadership',
      'Incident management'
    ],
    interviewQuestions: [
      'Tell me about a time you led a critical incident response',
      'How do you mentor junior team members?',
      'Describe your approach to infrastructure automation',
      'Give an example of improving team processes',
      'How do you handle conflicting priorities?'
    ]
  }
];

// Mock completed feedback
const completedFeedback = [
  {
    id: 'IV-003',
    candidateName: 'David Kim',
    position: 'Data Scientist',
    interviewDate: '2024-06-21T15:00:00Z',
    overallRating: 5,
    recommendation: 'Strong Hire',
    submittedDate: '2024-06-21T16:30:00Z'
  },
  {
    id: 'IV-004',
    candidateName: 'Jennifer Walsh',
    position: 'Product Manager',
    interviewDate: '2024-06-20T11:00:00Z',
    overallRating: 4,
    recommendation: 'Hire',
    submittedDate: '2024-06-20T12:15:00Z'
  }
];

export default function InterviewerFeedbackPage() {
  const [selectedInterview, setSelectedInterview] = useState(pendingFeedback[0]);
  const [feedback, setFeedback] = useState({
    overallRating: 0,
    recommendation: '',
    technicalSkills: 0,
    communication: 0,
    problemSolving: 0,
    culturalFit: 0,
    leadership: 0,
    strengths: '',
    weaknesses: '',
    detailedFeedback: '',
    questionsAsked: [] as string[],
    wouldHire: '',
    confidenceLevel: 0,
    additionalNotes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleRatingChange = (field: string, value: number[]) => {
    setFeedback(prev => ({ ...prev, [field]: value[0] }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionToggle = (question: string, checked: boolean) => {
    setFeedback(prev => ({
      ...prev,
      questionsAsked: checked 
        ? [...prev.questionsAsked, question]
        : prev.questionsAsked.filter(q => q !== question)
    }));
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      // Reset form or redirect
    }, 1500);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'Strong Hire':
        return <Badge className="bg-green-100 text-green-800"><TrendingUp className="mr-1 h-3 w-3" />Strong Hire</Badge>;
      case 'Hire':
        return <Badge className="bg-blue-100 text-blue-800"><ThumbsUp className="mr-1 h-3 w-3" />Hire</Badge>;
      case 'No Hire':
        return <Badge className="bg-red-100 text-red-800"><TrendingDown className="mr-1 h-3 w-3" />No Hire</Badge>;
      default:
        return <Badge variant="outline">{recommendation}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <ClipboardCheck className="mr-3 h-8 w-8 text-primary" />
            Interview Feedback
          </h1>
          <p className="text-muted-foreground mt-1">
            Submit detailed feedback and evaluations for your completed interviews
          </p>
        </div>

        {saveSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Feedback saved as draft successfully!</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Feedback ({pendingFeedback.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedFeedback.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Interview Selection */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Pending Interviews</CardTitle>
                  <CardDescription>Select an interview to provide feedback</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingFeedback.map((interview) => (
                    <div
                      key={interview.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedInterview.id === interview.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedInterview(interview)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={interview.candidateAvatar} />
                          <AvatarFallback>{interview.candidateName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{interview.candidateName}</h4>
                          <p className="text-xs text-muted-foreground truncate">{interview.position}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(interview.interviewDate)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Feedback Form */}
              <div className="lg:col-span-3 space-y-6">
                {/* Interview Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <User className="mr-2 h-5 w-5 text-primary" />
                        Interview Overview
                      </span>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-3 w-3" />
                          Candidate Profile
                        </Button>
                        <Button variant="outline" size="sm">
                          <Video className="mr-1 h-3 w-3" />
                          AI Interview
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedInterview.candidateAvatar} />
                        <AvatarFallback>{selectedInterview.candidateName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">{selectedInterview.candidateName}</h3>
                        <p className="text-muted-foreground">{selectedInterview.position}</p>
                        <p className="text-sm text-muted-foreground">{selectedInterview.company}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(selectedInterview.interviewDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedInterview.duration} minutes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedInterview.type}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Interview Focus:</h4>
                      <p className="text-sm text-muted-foreground">{selectedInterview.interviewNotes}</p>
                    </div>
                    
                    {selectedInterview.aiScore && (
                      <div className="mt-4 flex items-center space-x-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">AI Interview Score:</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {selectedInterview.aiScore}%
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Rating Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="mr-2 h-5 w-5 text-primary" />
                      Evaluation Ratings
                    </CardTitle>
                    <CardDescription>Rate the candidate on key competencies (1-5 scale)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Technical Skills</Label>
                          <div className="mt-2">
                            <Slider
                              value={[feedback.technicalSkills]}
                              onValueChange={(value) => handleRatingChange('technicalSkills', value)}
                              max={5}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Poor</span>
                              <span className="font-medium">{feedback.technicalSkills || 'Not rated'}</span>
                              <span>Excellent</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Communication</Label>
                          <div className="mt-2">
                            <Slider
                              value={[feedback.communication]}
                              onValueChange={(value) => handleRatingChange('communication', value)}
                              max={5}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Poor</span>
                              <span className="font-medium">{feedback.communication || 'Not rated'}</span>
                              <span>Excellent</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Problem Solving</Label>
                          <div className="mt-2">
                            <Slider
                              value={[feedback.problemSolving]}
                              onValueChange={(value) => handleRatingChange('problemSolving', value)}
                              max={5}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foregreen mt-1">
                              <span>Poor</span>
                              <span className="font-medium">{feedback.problemSolving || 'Not rated'}</span>
                              <span>Excellent</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Cultural Fit</Label>
                          <div className="mt-2">
                            <Slider
                              value={[feedback.culturalFit]}
                              onValueChange={(value) => handleRatingChange('culturalFit', value)}
                              max={5}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Poor</span>
                              <span className="font-medium">{feedback.culturalFit || 'Not rated'}</span>
                              <span>Excellent</span>
                            </div>
                          </div>
                        </div>

                        {selectedInterview.type.includes('Behavioral') && (
                          <div>
                            <Label className="text-sm font-medium">Leadership Potential</Label>
                            <div className="mt-2">
                              <Slider
                                value={[feedback.leadership]}
                                onValueChange={(value) => handleRatingChange('leadership', value)}
                                max={5}
                                min={1}
                                step={1}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Poor</span>
                                <span className="font-medium">{feedback.leadership || 'Not rated'}</span>
                                <span>Excellent</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <Label className="text-sm font-medium">Confidence in Assessment</Label>
                          <div className="mt-2">
                            <Slider
                              value={[feedback.confidenceLevel]}
                              onValueChange={(value) => handleRatingChange('confidenceLevel', value)}
                              max={5}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Low</span>
                              <span className="font-medium">{feedback.confidenceLevel || 'Not rated'}</span>
                              <span>High</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Overall Rating */}
                    <div>
                      <Label className="text-sm font-medium">Overall Rating</Label>
                      <div className="mt-2">
                        <Slider
                          value={[feedback.overallRating]}
                          onValueChange={(value) => handleRatingChange('overallRating', value)}
                          max={5}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Poor</span>
                          <span className={`font-bold text-lg ${getRatingColor(feedback.overallRating)}`}>
                            {feedback.overallRating || 'Not rated'}
                          </span>
                          <span>Excellent</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Questions Asked */}
                <Card>
                  <CardHeader>
                    <CardTitle>Interview Questions</CardTitle>
                    <CardDescription>Select the questions you asked during the interview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedInterview.interviewQuestions.map((question, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <Checkbox
                            id={`question-${index}`}
                            checked={feedback.questionsAsked.includes(question)}
                            onCheckedChange={(checked) => handleQuestionToggle(question, checked as boolean)}
                          />
                          <label htmlFor={`question-${index}`} className="text-sm cursor-pointer">
                            {question}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Feedback */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Feedback</CardTitle>
                    <CardDescription>Provide specific feedback about the candidate's performance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="strengths">Key Strengths</Label>
                        <Textarea
                          id="strengths"
                          placeholder="What did the candidate do well?"
                          value={feedback.strengths}
                          onChange={(e) => handleInputChange('strengths', e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weaknesses">Areas for Improvement</Label>
                        <Textarea
                          id="weaknesses"
                          placeholder="What areas need development?"
                          value={feedback.weaknesses}
                          onChange={(e) => handleInputChange('weaknesses', e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="detailedFeedback">Overall Comments</Label>
                      <Textarea
                        id="detailedFeedback"
                        placeholder="Provide detailed feedback about the candidate's performance, specific examples, and any additional observations..."
                        value={feedback.detailedFeedback}
                        onChange={(e) => handleInputChange('detailedFeedback', e.target.value)}
                        rows={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="additionalNotes">Additional Notes</Label>
                      <Textarea
                        id="additionalNotes"
                        placeholder="Any additional observations or notes for the hiring team..."
                        value={feedback.additionalNotes}
                        onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendation */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hiring Recommendation</CardTitle>
                    <CardDescription>Your final recommendation for this candidate</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label>Would you recommend hiring this candidate?</Label>
                      <RadioGroup
                        value={feedback.recommendation}
                        onValueChange={(value) => handleInputChange('recommendation', value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Strong Hire" id="strong-hire" />
                          <Label htmlFor="strong-hire" className="cursor-pointer">
                            <Badge className="bg-green-100 text-green-800">
                              <TrendingUp className="mr-1 h-3 w-3" />
                              Strong Hire
                            </Badge>
                            <span className="ml-2 text-sm">Exceptional candidate, hire immediately</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Hire" id="hire" />
                          <Label htmlFor="hire" className="cursor-pointer">
                            <Badge className="bg-blue-100 text-blue-800">
                              <ThumbsUp className="mr-1 h-3 w-3" />
                              Hire
                            </Badge>
                            <span className="ml-2 text-sm">Good candidate, meets requirements</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Hire with Reservations" id="hire-reservations" />
                          <Label htmlFor="hire-reservations" className="cursor-pointer">
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Hire with Reservations
                            </Badge>
                            <span className="ml-2 text-sm">Has potential but needs development</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No Hire" id="no-hire" />
                          <Label htmlFor="no-hire" className="cursor-pointer">
                            <Badge className="bg-red-100 text-red-800">
                              <TrendingDown className="mr-1 h-3 w-3" />
                              No Hire
                            </Badge>
                            <span className="ml-2 text-sm">Does not meet requirements</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button onClick={handleSubmitFeedback} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Feedback</CardTitle>
                <CardDescription>Review your previously submitted interview feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedFeedback.map((feedback) => (
                    <div key={feedback.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{feedback.candidateName}</h4>
                        <p className="text-sm text-muted-foreground">{feedback.position}</p>
                        <p className="text-xs text-muted-foreground">
                          Interviewed: {formatDate(feedback.interviewDate)} • 
                          Submitted: {formatDate(feedback.submittedDate)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">Rating</div>
                          <div className={`text-lg font-bold ${getRatingColor(feedback.overallRating)}`}>
                            {feedback.overallRating}/5
                          </div>
                        </div>
                        
                        {getRecommendationBadge(feedback.recommendation)}
                        
                        <Button variant="outline" size="sm">
                          <FileText className="mr-1 h-3 w-3" />
                          View Details
                        </Button>
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