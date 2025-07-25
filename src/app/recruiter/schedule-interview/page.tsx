
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  Video,
  Phone,
  Search,
  Star,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  Filter,
  ArrowLeft,
  ArrowRight,
  Plus,
  UserCheck,
  Building,
  Mail,
  FileText,
  Zap,
  Bot
} from 'lucide-react';

import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Mock data for candidates, interviewers, and jobs
const candidates = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    avatar: '/avatars/sarah.jpg',
    position: 'Senior Frontend Developer',
    aiScore: 87,
    aiInterviewCompleted: true,
    status: 'ai_completed'
  },
  {
    id: '2',
    name: 'Marcus Chen',
    email: 'marcus.chen@email.com',
    avatar: '/avatars/marcus.jpg',
    position: 'DevOps Engineer',
    aiScore: 92,
    aiInterviewCompleted: true,
    status: 'ai_completed'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily@designfirst.com',
    avatar: '/avatars/emily.jpg',
    position: 'UX Designer',
    aiScore: null,
    aiInterviewCompleted: false,
    status: 'pending_ai'
  }
];

const interviewers = [
  {
    id: '1',
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@techcorp.com',
    avatar: '/avatars/alex.jpg',
    department: 'Engineering',
    specialty: 'Frontend & System Design',
    rating: 4.8,
    availability: 'available',
    totalInterviews: 156
  },
  {
    id: '2',
    name: 'Maria Garcia',
    email: 'maria.garcia@techcorp.com',
    avatar: '/avatars/maria.jpg',
    department: 'Product',
    specialty: 'Product Strategy & Behavioral',
    rating: 4.6,
    availability: 'busy',
    totalInterviews: 89
  },
  {
    id: '3',
    name: 'David Chen',
    email: 'david.chen@techcorp.com',
    avatar: '/avatars/david.jpg',
    department: 'Engineering',
    specialty: 'Backend & DevOps',
    rating: 4.9,
    availability: 'available',
    totalInterviews: 203
  }
];

const mockAgents = [
  {
    id: 'ai-agent-tech',
    name: 'Alex - Technical Screener',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    specialty: 'Deep technical and coding assessments',
    availability: '',
    rating: 4.7,
  },
  {
    id: 'ai-agent-behavioral',
    name: 'Jordan - Behavioral Analyst',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    specialty: 'Situational and behavioral questions',
    availability: '',
    rating: 4.9,
  },
  {
    id: 'ai-agent-general',
    name: 'Casey - General Interviewer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey',
    specialty: 'Well-rounded initial screening',
    availability: '',
    rating: 4.6,
  },
  {
    id: 'ai-agent-mira',
    name: 'Mira - Conversational AI',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mira',
    specialty: 'Natural language conversation agent',
    availability: '',
    rating: 4.8,
  }
];

const jobRoles = [
  { id: '1', title: 'Senior Frontend Developer', department: 'Engineering' },
  { id: '2', title: 'DevOps Engineer', department: 'Engineering' },
  { id: '3', title: 'UX Designer', department: 'Design' },
  { id: '4', title: 'Product Manager', department: 'Product' }
];

export default function ScheduleInterviewPage() {
  const [selectedCandidate, setSelectedCandidate] = useState(candidates[0]);
  const [selectedInterviewer, setSelectedInterviewer] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [interviewType, setInterviewType] = useState<'ai' | 'realtime'>('realtime');
  const [interviewFormat, setInterviewFormat] = useState('in-person');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'busy':
        return <Badge className="bg-red-100 text-red-800">Busy</Badge>;
      case '24/7':
        return <Badge className="bg-blue-100 text-blue-800">24/7</Badge>;
      default:
        return <Badge variant="outline">{availability}</Badge>;
    }
  };

  const handleScheduleInterview = () => {
    const selectedAgentData = interviewType === 'ai'
      ? mockAgents.find(agent => agent.id === selectedInterviewer)
      : interviewers.find(interviewer => interviewer.id === selectedInterviewer);
      
    scheduleInterview({
      candidateId: selectedCandidate.id,
      candidateName: selectedCandidate.name,
      jobId: jobRoles.find(j => j.title === selectedCandidate.position)?.id || 'unknown-job',
      jobTitle: selectedCandidate.position,
      type: interviewType,
      agentId: selectedInterviewer,
      agentName: selectedAgentData?.name || 'Unknown',
      date: interviewType === 'realtime' ? selectedDate! : new Date(),
      time: interviewType === 'realtime' ? selectedTime : '',
      duration: parseInt(duration),
      notes,
    });
    
    const description = interviewType === 'ai' 
      ? `AI interview invitation sent to ${selectedCandidate.name}. They can complete it at their convenience.`
      : `Real-time interview scheduled for ${selectedCandidate.name} on ${selectedDate ? format(selectedDate, 'PPP') : 'the selected date'} at ${selectedTime}.`;
    
    toast({
      title: "✅ Interview Scheduled",
      description: description,
    });
  };

  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <CalendarIcon className="mr-3 h-8 w-8 text-primary" />
                Schedule Interview
              </h1>
              <p className="text-muted-foreground mt-1">
                Assign interviews to AI agents or human interviewers
              </p>
            </div>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= stepNumber ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > stepNumber ? <CheckCircle className="h-4 w-4" /> : stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`h-0.5 w-16 ${
                    step > stepNumber ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <div className="text-sm text-muted-foreground">
              Step {step} of 4: {
                step === 1 ? 'Select Candidate' :
                step === 2 ? 'Choose Interviewer' :
                step === 3 ? 'Schedule Details' :
                'Review & Confirm'
              }
            </div>
          </div>
        </div>

        <Tabs value={step.toString()} className="space-y-6">
          {/* Step 1: Select Candidate */}
          <TabsContent value="1" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Select Candidate
                </CardTitle>
                <CardDescription>Choose the candidate for the interview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search candidate by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {filteredCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCandidate?.id === candidate.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={candidate.avatar} />
                            <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{candidate.name}</h3>
                            <p className="text-sm text-muted-foreground">{candidate.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {candidate.aiInterviewCompleted && (
                            <div className="text-center">
                              <div className="text-sm font-medium">AI Score</div>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {candidate.aiScore}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!selectedCandidate}>
                Next: Choose Interviewer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Step 2: Choose Interviewer */}
          <TabsContent value="2" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="mr-2 h-5 w-5 text-primary" />
                  Choose Interviewer Type
                </CardTitle>
                <CardDescription>Select whether to schedule a real-time or AI-powered interview</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={interviewType} onValueChange={(value) => {
                  setInterviewType(value as any);
                  setSelectedInterviewer('');
                }} className="grid grid-cols-2 gap-4">
                  <Label htmlFor="realtime" className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                    <RadioGroupItem value="realtime" id="realtime" className="sr-only" />
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="font-medium">Real-time Interview</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">With a human interviewer</p>
                  </Label>
                  <Label htmlFor="ai" className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                    <RadioGroupItem value="ai" id="ai" className="sr-only" />
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      <span className="font-medium">AI Interview</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Automated AI assessment</p>
                  </Label>
                </RadioGroup>

                <div className="mt-6 space-y-4">
                  {(interviewType === 'realtime' ? interviewers : mockAgents).map((agent) => (
                    <div
                      key={agent.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedInterviewer === agent.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      } ${interviewType === 'realtime' && agent.availability === 'busy' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (interviewType === 'ai' || (interviewType === 'realtime' && agent.availability !== 'busy')) {
                          setSelectedInterviewer(agent.id)
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={agent.avatar} />
                            <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{agent.name}</h3>
                            <p className="text-sm text-muted-foreground">{agent.specialty}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{agent.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button onClick={() => setStep(3)} disabled={!selectedInterviewer}>
                Next: Schedule Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          {/* Step 3: Schedule Details */}
          <TabsContent value="3" className="space-y-6">
            {interviewType === 'realtime' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                        Date & Time
                      </CardTitle>
                      <CardDescription>Select interview date</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border"
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                      />
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Time Slots</CardTitle>
                      <CardDescription>
                        Select an available time for {selectedDate ? format(selectedDate, 'PPP') : 'the selected date'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        {availableTimeSlots.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Alert>
                <Bot className="h-4 w-4" />
                <AlertDescription>
                  AI interviews are sent to the candidate to complete at their convenience. No specific date or time is needed.
                </AlertDescription>
              </Alert>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Interview Details</CardTitle>
                <CardDescription>Configure interview type and format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {interviewType === 'realtime' && (
                  <>
                    <div className="space-y-2">
                      <Label>Interview Format</Label>
                      <Select value={interviewFormat} onValueChange={setInterviewFormat}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in-person">In-Person</SelectItem>
                          <SelectItem value="video">Video Call</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location / Meeting Link</Label>
                      <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                 <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes for Interviewer</Label>
                    <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                  </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button onClick={() => setStep(4)} disabled={interviewType === 'realtime' && (!selectedDate || !selectedTime)}>
                Next: Review & Confirm
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Step 4: Review & Confirm */}
          <TabsContent value="4" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                  Review Interview Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-semibold">Interview Type: {interviewType === 'ai' ? 'AI Interview' : 'Real-time Interview'}</div>
                <div>Interviewer/Agent: {(interviewType === 'ai' ? mockAgents : interviewers).find(i => i.id === selectedInterviewer)?.name}</div>
                {interviewType === 'realtime' && selectedDate && selectedTime && (
                  <div>Date & Time: {format(selectedDate, 'PPP')} at {selectedTime}</div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button onClick={handleScheduleInterview}>
                <Send className="mr-2 h-4 w-4" />
                Schedule Interview
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}
