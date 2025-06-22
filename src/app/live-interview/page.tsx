
"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Bot, Loader2, Send, User, PartyPopper } from 'lucide-react';
import { conductConversationTurn, LiveInterviewInput } from '@/ai/flows/live-interview-flow';
import { useToast } from '@/hooks/use-toast';

interface ConversationTurn {
  speaker: 'user' | 'ai';
  text: string;
}

const MOCK_JOB_CONTEXT = {
    title: "Senior Software Engineer",
    description: "Seeking a highly skilled Senior Software Engineer with expertise in cloud technologies, distributed systems, and modern JavaScript frameworks like React and Next.js. The ideal candidate will have a strong background in designing scalable solutions and a passion for innovation."
};

export default function LiveInterviewPage() {
  const [isStarted, setIsStarted] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInterviewOver, setIsInterviewOver] = useState(false);
  const [finalMessage, setFinalMessage] = useState('');

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [conversationHistory]);

  const startInterview = async (e: FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) {
        toast({
            variant: "destructive",
            title: "Name Required",
            description: "Please enter your name to begin the interview.",
        });
        return;
    }
    setIsStarted(true);
    setIsLoading(true);

    const initialInput: LiveInterviewInput = {
      candidateName,
      jobTitle: MOCK_JOB_CONTEXT.title,
      jobDescription: MOCK_JOB_CONTEXT.description,
      conversationHistory: [],
    };
    
    try {
      const response = await conductConversationTurn(initialInput);
      setConversationHistory([{ speaker: 'ai', text: response.aiResponse }]);
    } catch (error) {
      console.error("Error starting interview:", error);
      toast({
        variant: "destructive",
        title: "Interview Start Failed",
        description: "Could not connect to the AI interviewer. Please try again later.",
      });
      setIsStarted(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading || isInterviewOver) return;

    const newUserTurn: ConversationTurn = { speaker: 'user', text: userInput };
    const newHistory = [...conversationHistory, newUserTurn];
    setConversationHistory(newHistory);
    setUserInput('');
    setIsLoading(true);

    const input: LiveInterviewInput = {
      candidateName,
      jobTitle: MOCK_JOB_CONTEXT.title,
      jobDescription: MOCK_JOB_CONTEXT.description,
      conversationHistory: newHistory,
    };
    
    try {
      const response = await conductConversationTurn(input);
      setConversationHistory(prev => [...prev, { speaker: 'ai', text: response.aiResponse }]);
      
      if (response.isInterviewOver) {
        setIsInterviewOver(true);
        setFinalMessage(response.reasonForEnding || "The interview has concluded. Thank you for your time!");
      }
    } catch (error) {
       console.error("Error during conversation turn:", error);
       toast({
        variant: "destructive",
        title: "Connection Error",
        description: "There was an error communicating with the AI. Please try sending your message again.",
       });
       setConversationHistory(conversationHistory); // Revert history on error
    } finally {
      setIsLoading(false);
    }
  };

  if (!isStarted) {
    return (
       <DashboardLayout>
            <Container className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">Live AI Interview</CardTitle>
                        <CardDescription className="text-center">
                            You are about to start a live interview for the role of **{MOCK_JOB_CONTEXT.title}**.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={startInterview}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="candidateName">Please enter your name</Label>
                                <Input 
                                    id="candidateName" 
                                    placeholder="e.g., Jane Doe" 
                                    value={candidateName}
                                    onChange={(e) => setCandidateName(e.target.value)}
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This is a simulated interview. Your responses will be used to generate a conversational flow.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Start Interview'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </Container>
       </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-full w-full flex-col">
        <Container className="flex-1 flex flex-col p-0 h-full">
          <Card className="flex flex-col h-full w-full rounded-none border-0">
             <CardHeader className="flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle>Live Interview: {MOCK_JOB_CONTEXT.title}</CardTitle>
                <CardDescription>with Alex, your AI Interviewer</CardDescription>
              </div>
              <Badge variant={isInterviewOver ? "destructive" : "default"}>
                {isInterviewOver ? "Interview Over" : "In Progress"}
              </Badge>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                    <div className="space-y-6">
                    {conversationHistory.map((turn, index) => (
                        <div key={index} className={`flex items-start gap-3 ${turn.speaker === 'user' ? 'justify-end' : ''}`}>
                        {turn.speaker === 'ai' && (
                            <Avatar className="w-8 h-8">
                                <AvatarFallback><Bot /></AvatarFallback>
                            </Avatar>
                        )}
                        <div className={`max-w-md rounded-lg p-3 ${turn.speaker === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                            <p className="text-sm">{turn.text}</p>
                        </div>
                         {turn.speaker === 'user' && (
                            <Avatar className="w-8 h-8">
                                <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                        )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <Avatar className="w-8 h-8">
                                <AvatarFallback><Bot /></AvatarFallback>
                            </Avatar>
                            <div className="max-w-md rounded-lg p-3 bg-muted">
                                <Loader2 className="w-5 h-5 animate-spin" />
                            </div>
                        </div>
                    )}
                    </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t pt-4">
              {isInterviewOver ? (
                <div className="w-full text-center p-4 bg-green-100 text-green-800 rounded-lg flex items-center justify-center gap-2">
                    <PartyPopper className="h-5 w-5"/>
                    <p className="font-medium">{finalMessage}</p>
                </div>
              ) : (
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
                    className="flex w-full items-center space-x-2"
                >
                    <Input 
                        placeholder="Type your response..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={isLoading}
                        autoFocus
                    />
                    <Button type="submit" disabled={isLoading || !userInput.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
              )}
            </CardFooter>
          </Card>
        </Container>
      </div>
    </DashboardLayout>
  );
}
