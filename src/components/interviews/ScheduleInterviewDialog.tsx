
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
import { Calendar as CalendarIcon, Clock, Video, Bot, Users, Loader2 } from 'lucide-react';
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
    id: 'ai-agent-tech',
    name: 'Alex - Technical Screener',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    specialty: 'Deep technical and coding assessments',
    availability: '24/7',
    rating: 4.7,
  },
  {
    id: 'ai-agent-behavioral',
    name: 'Jordan - Behavioral Analyst',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    specialty: 'Situational and behavioral questions',
    availability: '24/7',
    rating: 4.9,
  },
  {
    id: 'ai-agent-general',
    name: 'Casey - General Interviewer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey',
    specialty: 'Well-rounded initial screening',
    availability: '24/7',
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
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSchedule = async () => {
    if ((interviewType === 'realtime' && (!selectedDate || !selectedTime || !selectedTimezone)) || (interviewType === 'ai' && !selectedAgent)) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const selectedAgentData = mockAgents.find(agent => agent.id === selectedAgent);
      
      const interviewData = {
        candidateId,
        candidateName,
        jobId,
        jobTitle,
        type: interviewType,
        agentId: selectedAgent,
        agentName: selectedAgentData?.name || 'Unknown Agent',
        date: selectedDate!,
        time: selectedTime,
        timezone: selectedTimezone,
        duration: parseInt(duration),
        notes,
      };

      scheduleInterview(interviewData);
      
      console.log('Interview scheduled:', interviewData);

      toast({
        title: 'Interview Scheduled Successfully',
        description: `${interviewType === 'ai' ? 'AI' : 'Real-time'} interview scheduled for ${candidateName} on ${selectedDate ? format(selectedDate, 'PPP') : 'anytime'} at ${selectedTime}`,
      });

      onOpenChange(false);
      
      // Reset form
      setInterviewType('realtime');
      setSelectedAgent('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setSelectedTimezone('');
      setDuration('60');
      setNotes('');
      
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
    ? mockAgents
    : []; // Assuming human interviewers are not in mockAgents

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
          <div className="space-y-3">
            <Label>Interview Type</Label>
            <RadioGroup
              value={interviewType}
              onValueChange={(value) => {
                setInterviewType(value as 'ai' | 'realtime');
                setSelectedAgent('');
              }}
            >
              <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
                <RadioGroupItem value="realtime" id="dialog-realtime" />
                <Label htmlFor="dialog-realtime" className="flex-1 cursor-pointer">Real-time Interview</Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
                <RadioGroupItem value="ai" id="dialog-ai" />
                <Label htmlFor="dialog-ai" className="flex-1 cursor-pointer">AI Interview</Label>
              </div>
            </RadioGroup>
          </div>

          {interviewType === 'ai' && (
            <div className="space-y-3">
              <Label>Select AI Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an AI agent..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredAgents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} - {agent.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {interviewType === 'realtime' && (
            <>
              {/* Add human interviewer selection here if needed */}
            </>
          )}

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
                  disabled={interviewType === 'ai'}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : (interviewType === 'ai' ? 'Candidate can take anytime' : 'Select date')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <Label>Timezone</Label>
            <Select value={selectedTimezone} onValueChange={setSelectedTimezone} disabled={interviewType === 'ai'}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Interview Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime} disabled={interviewType === 'ai'}>
              <SelectTrigger>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
          
          <div className="space-y-3">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Add any special instructions or topics..."
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

