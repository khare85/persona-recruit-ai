'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarIcon, Clock, Video, Bot, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { scheduleInterview } from '@/services/mockDataService';

interface Agent {
  id: string;
  name: string;
  avatar?: string;
  specialty: string;
  availability: string;
  rating: number;
}

interface ScheduleInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
}

// Mock agents data
const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Alex Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    specialty: 'Technical Interviews',
    availability: 'Mon-Fri, 9AM-5PM',
    rating: 4.8,
  },
  {
    id: 'agent-2',
    name: 'Sarah Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    specialty: 'Behavioral Interviews',
    availability: 'Mon-Thu, 10AM-6PM',
    rating: 4.9,
  },
  {
    id: 'agent-3',
    name: 'Michael Rodriguez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    specialty: 'Leadership & Management',
    availability: 'Tue-Fri, 8AM-4PM',
    rating: 4.7,
  },
  {
    id: 'ai-agent',
    name: 'AI Interviewer',
    specialty: 'All Interview Types',
    availability: '24/7 Available',
    rating: 4.6,
  },
];

const timeSlots = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
];

export function ScheduleInterviewDialog({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  jobId,
  jobTitle,
}: ScheduleInterviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [interviewType, setInterviewType] = useState<'ai' | 'realtime'>('realtime');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<string>('60');
  const [notes, setNotes] = useState<string>('');

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedAgent) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get the selected agent details
      const selectedAgentData = mockAgents.find(agent => agent.id === selectedAgent);
      
      const interviewData = {
        candidateId,
        candidateName,
        jobId,
        jobTitle,
        type: interviewType,
        agentId: selectedAgent,
        agentName: selectedAgentData?.name || 'Unknown Agent',
        date: selectedDate,
        time: selectedTime,
        duration: parseInt(duration),
        notes,
      };

      // Schedule the interview
      const scheduledInterview = scheduleInterview(interviewData);
      
      console.log('Interview scheduled:', scheduledInterview);

      toast({
        title: 'Interview Scheduled Successfully',
        description: `${interviewType === 'ai' ? 'AI' : 'Real-time'} interview scheduled for ${candidateName} on ${format(selectedDate, 'PPP')} at ${selectedTime}`,
      });

      onOpenChange(false);
      
      // Reset form
      setInterviewType('realtime');
      setSelectedAgent('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setDuration('60');
      setNotes('');
      
      // Reload the page to show updated data
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule interview. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAgents = interviewType === 'ai' 
    ? mockAgents.filter(agent => agent.id === 'ai-agent')
    : mockAgents.filter(agent => agent.id !== 'ai-agent');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Schedule an interview for <span className="font-semibold">{candidateName}</span> for the position of <span className="font-semibold">{jobTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Interview Type Selection */}
          <div className="space-y-3">
            <Label>Interview Type</Label>
            <RadioGroup
              value={interviewType}
              onValueChange={(value) => {
                setInterviewType(value as 'ai' | 'realtime');
                setSelectedAgent(''); // Reset agent selection when type changes
              }}
            >
              <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
                <RadioGroupItem value="realtime" id="realtime" />
                <Label htmlFor="realtime" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Real-time Interview</div>
                      <div className="text-sm text-muted-foreground">
                        Live video interview with a human interviewer
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
                <RadioGroupItem value="ai" id="ai" />
                <Label htmlFor="ai" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">AI Interview</div>
                      <div className="text-sm text-muted-foreground">
                        Automated interview with AI-powered assessment
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Agent Selection */}
          <div className="space-y-3">
            <Label>Select {interviewType === 'ai' ? 'AI Agent' : 'Interviewer'}</Label>
            <div className="grid gap-3">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={cn(
                    "flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                    selectedAgent === agent.id && "border-primary bg-accent/50"
                  )}
                  onClick={() => setSelectedAgent(agent.id)}
                >
                  <Avatar className="h-10 w-10">
                    {agent.avatar ? (
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                    ) : (
                      <AvatarFallback>
                        {agent.id === 'ai-agent' ? <Bot className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-muted-foreground">{agent.specialty}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {agent.availability}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {agent.rating}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <Label>Interview Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) => {
                    // Disable past dates and weekends for real-time interviews
                    if (interviewType === 'realtime') {
                      return date < new Date() || date.getDay() === 0 || date.getDay() === 6;
                    }
                    // AI interviews can be scheduled anytime
                    return date < new Date();
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <Label>Interview Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {slot}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-3">
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

          {/* Notes */}
          <div className="space-y-3">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Add any special instructions or topics to cover..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Schedule Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}