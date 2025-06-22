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
  Zap
} from 'lucide-react';

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
    specializations: ['Frontend Development', 'System Design'],
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
    specializations: ['Product Strategy', 'User Research'],
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
    specializations: ['Backend Development', 'DevOps'],
    rating: 4.9,
    availability: 'available',
    totalInterviews: 203
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
  const [interviewType, setInterviewType] = useState('technical');
  const [interviewFormat, setInterviewFormat] = useState('in-person');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1);

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
      case 'limited':
        return <Badge className="bg-yellow-100 text-yellow-800">Limited</Badge>;
      default:
        return <Badge variant="outline">{availability}</Badge>;
    }
  };

  const handleScheduleInterview = () => {
    // Handle interview scheduling logic
    console.log('Scheduling interview:', {
      candidate: selectedCandidate,
      interviewer: selectedInterviewer,
      date: selectedDate,
      time: selectedTime,
      type: interviewType,
      format: interviewFormat,
      duration,
      location,
      notes
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
                Assign face-to-face interviews to available interviewers
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
                <div className="space-y-4">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCandidate.id === candidate.id 
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
                            <p className="text-xs text-muted-foreground">{candidate.email}</p>
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
                          <div className="flex flex-col space-y-1">
                            <Button variant="outline" size="sm">
                              <Eye className="mr-1 h-3 w-3" />
                              View Profile
                            </Button>
                            {candidate.aiInterviewCompleted && (
                              <Button variant="outline" size="sm">
                                <Video className="mr-1 h-3 w-3" />
                                AI Interview
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>
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
                  Choose Interviewer
                </CardTitle>
                <CardDescription>Select an available interviewer for {selectedCandidate.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interviewers.map((interviewer) => (
                    <div
                      key={interviewer.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedInterviewer === interviewer.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      } ${interviewer.availability === 'busy' ? 'opacity-50' : ''}`}
                      onClick={() => interviewer.availability !== 'busy' && setSelectedInterviewer(interviewer.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={interviewer.avatar} />
                            <AvatarFallback>{interviewer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{interviewer.name}</h3>
                            <p className="text-sm text-muted-foreground">{interviewer.department}</p>
                            <p className="text-xs text-muted-foreground">{interviewer.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs">{interviewer.rating}/5</span>
                              <span className="text-xs text-muted-foreground">
                                • {interviewer.totalInterviews} interviews
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div>
                            {getAvailabilityBadge(interviewer.availability)}
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {interviewer.specializations.slice(0, 2).map((spec) => (
                                  <Badge key={spec} variant="secondary" className="text-xs">
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
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
              <Button 
                onClick={() => setStep(3)}
                disabled={!selectedInterviewer}
              >
                Next: Schedule Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Step 3: Schedule Details */}
          <TabsContent value="3" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                    Date & Time
                  </CardTitle>
                  <CardDescription>Select interview date and time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                      disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                    />
                  </div>
                  
                  <div>
                    <Label>Select Time</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
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
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interview Details</CardTitle>
                  <CardDescription>Configure interview type and format</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Interview Type</Label>
                    <RadioGroup value={interviewType} onValueChange={setInterviewType}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="technical" id="technical" />
                        <Label htmlFor="technical">Technical Interview</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="behavioral" id="behavioral" />
                        <Label htmlFor="behavioral">Behavioral Interview</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="final" id="final" />
                        <Label htmlFor="final">Final Round</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="portfolio" id="portfolio" />
                        <Label htmlFor="portfolio">Portfolio Review</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Interview Format</Label>
                    <RadioGroup value={interviewFormat} onValueChange={setInterviewFormat}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in-person" id="in-person" />
                        <Label htmlFor="in-person" className="flex items-center">
                          <MapPin className="mr-1 h-4 w-4" />
                          In-Person
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="virtual" id="virtual" />
                        <Label htmlFor="virtual" className="flex items-center">
                          <Video className="mr-1 h-4 w-4" />
                          Virtual Meeting
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="phone" id="phone" />
                        <Label htmlFor="phone" className="flex items-center">
                          <Phone className="mr-1 h-4 w-4" />
                          Phone Call
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
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
                    <Label htmlFor="location">Location/Meeting Link</Label>
                    <Input 
                      id="location"
                      placeholder={
                        interviewFormat === 'in-person' ? 'Conference Room A, Floor 3' :
                        interviewFormat === 'virtual' ? 'Zoom/Teams meeting link' :
                        'Phone number'
                      }
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Interview Notes</Label>
                    <Textarea 
                      id="notes"
                      placeholder="Special instructions, focus areas, or notes for the interviewer..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button 
                onClick={() => setStep(4)}
                disabled={!selectedDate || !selectedTime || !location}
              >
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
                <CardDescription>Please review all details before scheduling the interview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Candidate</h3>
                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <Avatar>
                          <AvatarImage src={selectedCandidate.avatar} />
                          <AvatarFallback>{selectedCandidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{selectedCandidate.name}</div>
                          <div className="text-sm text-muted-foreground">{selectedCandidate.position}</div>
                          <div className="text-xs text-muted-foreground">{selectedCandidate.email}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Interviewer</h3>
                      {selectedInterviewer && (
                        <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                          <Avatar>
                            <AvatarImage src={interviewers.find(i => i.id === selectedInterviewer)?.avatar} />
                            <AvatarFallback>
                              {interviewers.find(i => i.id === selectedInterviewer)?.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{interviewers.find(i => i.id === selectedInterviewer)?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {interviewers.find(i => i.id === selectedInterviewer)?.department}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {interviewers.find(i => i.id === selectedInterviewer)?.email}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Schedule Details</h3>
                      <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Date:</span>
                          <span className="text-sm">{selectedDate?.toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Time:</span>
                          <span className="text-sm">{selectedTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Duration:</span>
                          <span className="text-sm">{duration} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Type:</span>
                          <span className="text-sm capitalize">{interviewType.replace('-', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Format:</span>
                          <span className="text-sm capitalize">{interviewFormat.replace('-', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Location:</span>
                          <span className="text-sm">{location}</span>
                        </div>
                      </div>
                    </div>

                    {notes && (
                      <div>
                        <h3 className="font-semibold mb-2">Notes</h3>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm">{notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Both the candidate and interviewer will receive email notifications about this scheduled interview.
                  </AlertDescription>
                </Alert>
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