
"use client";

import { type NextPage } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Container } from "@/components/shared/Container";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mic, Video as VideoIcon, AlertTriangle, Zap, Square, CheckCircle, Info, MessageSquare, Volume2, ShieldAlert, Copy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { conductConversationTurn, LiveInterviewInput, LiveInterviewOutput } from "@/ai/flows/live-interview-flow";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";


// Mock data - in a real app, this would come from an API
const MOCK_INTERVIEW_CONTEXT_DATA = {
  job1: {
    candidate1: {
      jobTitle: "Senior Software Engineer",
      candidateName: "John Doe",
      jobDescription: "Seeking a Senior Software Engineer with experience in Next.js, TypeScript, and cloud platforms. Responsibilities include leading frontend development, mentoring junior engineers, and collaborating with product teams on new features. Strong problem-solving skills and a passion for creating high-quality user experiences are essential.",
      candidateResumeSummary: "Experienced Senior Software Engineer (8+ years) specializing in full-stack development with a focus on JavaScript frameworks (React, Next.js, Node.js) and cloud solutions (AWS). Proven track record of delivering complex projects and leading teams.",
    }
  },
};

type ConversationEntry = {
  speaker: 'ai' | 'user';
  text: string;
  timestamp: Date;
};

const LiveInterviewPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const jobId = params.jobId as string;
  const candidateId = params.candidateId as string;

  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false);
  const [interviewContext, setInterviewContext] = useState<typeof MOCK_INTERVIEW_CONTEXT_DATA.job1.candidate1 | null>(null);
  
  const [showConsent, setShowConsent] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isAiTurn, setIsAiTurn] = useState(false); // True when AI is "thinking" or TTS is speaking
  const [isListeningToUser, setIsListeningToUser] = useState(false);
  
  const [conversationLog, setConversationLog] = useState<ConversationEntry[]>([]);
  const [currentAiUtterance, setCurrentAiUtterance] = useState<string | null>(null);

  const [hasDevicePermissions, setHasDevicePermissions] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedBlobs = useRef<Blob[]>([]);
  
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fetch interview context (job title, candidate name, etc.)
  useEffect(() => {
    const fetchContext = async () => {
      setIsLoadingContext(true);
      await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API
      const contextData = MOCK_INTERVIEW_CONTEXT_DATA[jobId as keyof typeof MOCK_INTERVIEW_CONTEXT_DATA]?.[candidateId as keyof typeof MOCK_INTERVIEW_CONTEXT_DATA.job1];
      if (contextData) {
        setInterviewContext(contextData);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Interview context not found."});
        router.push('/'); // Or some error page
      }
      setIsLoadingContext(false);
    };
    if (jobId && candidateId) fetchContext();
  }, [jobId, candidateId, toast, router]);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = false; // Process after each pause
      speechRecognitionRef.current.interimResults = false;

      speechRecognitionRef.current.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        if (transcript) {
          setConversationLog(prev => [...prev, { speaker: 'user', text: transcript, timestamp: new Date() }]);
          handleUserResponse(transcript);
        }
        setIsListeningToUser(false); // Stop listening animation
      };

      speechRecognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        toast({ variant: "destructive", title: "Speech Error", description: `Could not understand: ${event.error}. Try again.` });
        setIsListeningToUser(false);
        // Optionally, re-prompt or allow text input as fallback
      };
      
      speechRecognitionRef.current.onend = () => {
        if (isInterviewActive && !isAiTurn && speechRecognitionRef.current && speechRecognitionRef.current.continuous === false) { // Check if still active and not AI's turn
             // If ended prematurely (e.g. short silence) and AI isn't speaking, re-enable listening or prompt user
        }
      };
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
      toast({ variant: "destructive", title: "Unsupported Browser", description: "Live speech input is not supported here. Consider a different browser."});
    }

    return () => {
        speechRecognitionRef.current?.abort();
        if (window.speechSynthesis?.speaking) {
            window.speechSynthesis.cancel();
        }
    };
  }, [isInterviewActive, isAiTurn]); // Re-check dependencies

  const requestPermissionsAndSetup = useCallback(async () => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasDevicePermissions(true);
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        
        // Setup MediaRecorder for video
        recordedBlobs.current = [];
        const options = { mimeType: 'video/webm;codecs=vp9,opus' };
        mediaRecorderRef.current = MediaRecorder.isTypeSupported(options.mimeType)
          ? new MediaRecorder(stream, options)
          : new MediaRecorder(stream);
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) recordedBlobs.current.push(event.data);
        };
        
        return true;
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setHasDevicePermissions(false);
        toast({ variant: 'destructive', title: 'Device Access Denied', description: 'Enable camera/mic permissions and refresh.', duration: 7000 });
        return false;
      }
    }
    return false;
  }, [toast]);

  const startInterview = async () => {
    if (!consentGiven || !interviewContext) return;
    
    const permissionsGranted = await requestPermissionsAndSetup();
    if (!permissionsGranted) return;

    setIsInterviewActive(true);
    setShowConsent(false);
    mediaRecorderRef.current?.start();
    toast({ title: "Interview Started!", description: "The AI interviewer will begin shortly."});
    
    // Initial call to AI
    setIsAiTurn(true);
    try {
      const aiResult = await conductConversationTurn({
        jobTitle: interviewContext.jobTitle,
        jobDescription: interviewContext.jobDescription,
        candidateName: interviewContext.candidateName,
        candidateResumeSummary: interviewContext.candidateResumeSummary,
        conversationHistory: [],
      });
      handleAiResponse(aiResult);
    } catch (error) {
        console.error("Error starting AI conversation:", error);
        toast({variant: "destructive", title: "AI Error", description: "Could not start conversation with AI."});
        setIsAiTurn(false);
        // Consider ending interview or retrying
    }
  };

  const speakAiResponse = (text: string) => {
    if (!text || typeof window.speechSynthesis === 'undefined') {
        setIsAiTurn(false); // Ensure state is reset
        if (isInterviewActive) setTimeout(listenToUser, 500); // Try listening after a small delay
        return;
    }
    
    window.speechSynthesis.cancel(); // Cancel any previous speech
    synthesisUtteranceRef.current = new SpeechSynthesisUtterance(text);
    synthesisUtteranceRef.current.onstart = () => {
      setCurrentAiUtterance(text); // Show text when AI starts speaking
    };
    synthesisUtteranceRef.current.onend = () => {
      setCurrentAiUtterance(null);
      setIsAiTurn(false);
      if (isInterviewActive) { // Only listen if interview is still ongoing
        listenToUser();
      }
    };
    synthesisUtteranceRef.current.onerror = (event) => {
      console.error("SpeechSynthesis Error:", event);
      toast({variant: "destructive", title: "TTS Error", description: "Could not speak AI response."});
      setCurrentAiUtterance(null); // Clear text on error
      setIsAiTurn(false);
      if (isInterviewActive) setTimeout(listenToUser, 500);
    };
    window.speechSynthesis.speak(synthesisUtteranceRef.current);
  };

  const listenToUser = () => {
    if (speechRecognitionRef.current && !isListeningToUser && isInterviewActive && !isAiTurn) {
      try {
        speechRecognitionRef.current.start();
        setIsListeningToUser(true);
      } catch (e) {
        console.error("Error starting speech recognition:", e);
        // Already handled by onerror usually, but good to catch specific start errors
      }
    }
  };
  
  const handleAiResponse = (aiOutput: LiveInterviewOutput) => {
    setConversationLog(prev => [...prev, { speaker: 'ai', text: aiOutput.aiResponse, timestamp: new Date() }]);
    speakAiResponse(aiOutput.aiResponse);
    if (aiOutput.isInterviewOver) {
      // AI decided to end interview
      finishInterview(aiOutput.reasonForEnding || "The AI has concluded the interview.");
    }
  };

  const handleUserResponse = async (userText: string) => {
    if (!interviewContext) return;
    setIsAiTurn(true); // AI's turn to process and respond
    try {
      const aiResult = await conductConversationTurn({
        jobTitle: interviewContext.jobTitle,
        jobDescription: interviewContext.jobDescription,
        candidateName: interviewContext.candidateName,
        candidateResumeSummary: interviewContext.candidateResumeSummary,
        conversationHistory: conversationLog.map(entry => ({speaker: entry.speaker, text: entry.text})), // Pass simplified history
      });
      handleAiResponse(aiResult);
    } catch (error) {
        console.error("Error getting AI response:", error);
        toast({variant: "destructive", title: "AI Error", description: "Could not get response from AI."});
        setIsAiTurn(false); // Allow user to try again or end
    }
  };

  const finishInterview = async (reason?: string) => {
    setIsInterviewActive(false);
    setIsListeningToUser(false);
    setIsAiTurn(false);
    speechRecognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    
    setIsSubmittingInterview(true);
    const finalToastMessage = reason || "Interview session ended.";
    toast({ title: "Interview Concluded", description: finalToastMessage });

    // Simulate processing and submission
    // In a real app, upload recordedBlobs.current and conversationLog
    const videoBlob = new Blob(recordedBlobs.current, { type: mediaRecorderRef.current?.mimeType || 'video/webm' });
    console.log("Final video blob size:", videoBlob.size);
    console.log("Final conversation log:", conversationLog);
    // Here you would call another flow, e.g., the existing videoInterviewAnalysis.ts,
    // passing the video (as data URI or uploaded file ID) and the conversationLog as a structured transcript.

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload/processing
    setIsSubmittingInterview(false);
    
    // Navigate away or show a thank you message
    router.push(`/candidates/dashboard?interviewComplete=true&jobTitle=${interviewContext?.jobTitle || 'Role'}`);
  };
  
  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  if (isLoadingContext) {
    return (
      <Container className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading interview details...</p>
      </Container>
    );
  }

  if (!interviewContext) {
    return (
      <Container className="text-center py-20">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive">Interview Details Not Found</h1>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/')}>Back to Homepage</Button>
      </Container>
    );
  }
  
  const videoAreaClass = isInterviewActive && currentAiUtterance ? "md:col-span-2" : "md:col-span-3";


  return (
    <Container className="max-w-5xl mx-auto py-8">
      {showConsent && (
        <Dialog open={showConsent} onOpenChange={(open) => { if(!open && !consentGiven) setShowConsent(true)}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center text-2xl">
                <ShieldAlert className="h-7 w-7 mr-3 text-primary"/> Interview Recording Consent
              </DialogTitle>
              <DialogDescription className="pt-2">
                Please read the following carefully before proceeding with your AI-assisted interview for the <strong>{interviewContext.jobTitle}</strong> role.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 text-sm text-muted-foreground">
              <p>By starting this interview, you acknowledge and agree to the following:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>This interview session will be <strong>video and audio recorded</strong>.</li>
                <li>Your responses and the recording will be processed by <strong>Artificial Intelligence (AI)</strong> to generate an analysis report.</li>
                <li>This report, including insights from the AI, will be used by the recruitment team at Persona Recruit AI and the hiring company to evaluate your suitability for the role.</li>
                <li>Your data will be handled in accordance with our <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a>.</li>
              </ul>
              <p>You must have a working camera and microphone to participate.</p>
            </div>
             <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="consent-checkbox" checked={consentGiven} onCheckedChange={(checked) => setConsentGiven(checked as boolean)} />
                <Label htmlFor="consent-checkbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I have read, understood, and agree to the terms and consent to the recording and AI processing of my interview.
                </Label>
            </div>
            <DialogFooter className="pt-5">
              <Button type="button" onClick={startInterview} disabled={!consentGiven}>
                Agree & Start Interview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!showConsent && (
        <Card className="shadow-xl">
          <CardHeader className="text-center border-b pb-4">
            <Zap className="mx-auto h-10 w-10 text-primary mb-2" />
            <CardTitle className="text-2xl md:text-3xl font-headline">
              AI Interview: {interviewContext.jobTitle}
            </CardTitle>
            <CardDescription>
              Candidate: {interviewContext.candidateName}
            </CardDescription>
             {isInterviewActive && (
                <div className="mt-2 flex items-center justify-center gap-2 text-red-500 font-medium">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div> RECORDING IN PROGRESS
                </div>
              )}
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className={`grid grid-cols-1 ${isInterviewActive && currentAiUtterance ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4 items-start`}>
              <div className={`aspect-video bg-muted rounded-lg overflow-hidden relative shadow-md ${isInterviewActive && currentAiUtterance ? 'md:col-span-2' : 'col-span-1 md:max-w-3xl mx-auto'}`}>
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                {hasDevicePermissions === false && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
                    <AlertTriangle className="h-12 w-12 mb-2 text-destructive" />
                    <p className="font-semibold">Permissions Required</p>
                    <p className="text-xs text-center">Please enable camera & microphone access in your browser and refresh.</p>
                  </div>
                )}
              </div>

              {isInterviewActive && currentAiUtterance && (
                <div className="md:col-span-1 p-4 bg-primary/10 rounded-lg shadow-md h-full flex flex-col justify-center animate-fadeIn">
                  <div className="flex items-center mb-2">
                    <Volume2 className="h-6 w-6 text-primary mr-2 animate-pulse" />
                    <h3 className="text-lg font-semibold text-primary">Alex (AI Interviewer) says:</h3>
                  </div>
                  <p className="text-md text-foreground leading-relaxed">{currentAiUtterance}</p>
                </div>
              )}
            </div>
            
            {!isInterviewActive && !isSubmittingInterview && hasDevicePermissions && (
              <Alert variant="default" className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Ready to Begin?</AlertTitle>
                <AlertDescription>
                  The AI interviewer, Alex, will start the conversation once you click "Start AI Conversation". Ensure you are in a quiet, well-lit environment.
                </AlertDescription>
              </Alert>
            )}
            
            {isListeningToUser && (
              <div className="my-4 p-3 text-center bg-accent/20 rounded-md border border-accent animate-pulse">
                <Mic className="h-6 w-6 mx-auto text-accent mb-1" />
                <p className="text-sm font-medium text-accent-foreground">Listening for your response...</p>
              </div>
            )}

          </CardContent>
          
          <CardFooter className="border-t pt-6 flex flex-col items-center">
            {isInterviewActive ? (
              <Button onClick={() => finishInterview("Candidate ended the interview.")} variant="destructive" size="lg" disabled={isSubmittingInterview || isAiTurn}>
                {isSubmittingInterview ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Square className="mr-2 h-5 w-5" />}
                End Interview
              </Button>
            ) : (
              <Button onClick={startInterview} size="lg" disabled={!consentGiven || !hasDevicePermissions || isSubmittingInterview}>
                {isSubmittingInterview ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MessageSquare className="mr-2 h-5 w-5" />}
                Start AI Conversation
              </Button>
            )}
             <p className="text-xs text-muted-foreground mt-4 text-center">
              This is an AI-assisted interview. Your responses are recorded and analyzed.
            </p>
          </CardFooter>
        </Card>
      )}
      
      {/* Conversation Log for Debugging/Review (Optional Display) */}
      {/*
      {conversationLog.length > 0 && (
        <Card className="mt-8">
          <CardHeader><CardTitle>Conversation Log</CardTitle></CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-2">
            {conversationLog.map((entry, index) => (
              <div key={index} className={`p-2 rounded-md ${entry.speaker === 'ai' ? 'bg-blue-100' : 'bg-green-100'}`}>
                <strong>{entry.speaker.toUpperCase()}:</strong> {entry.text} <em className="text-xs">({entry.timestamp.toLocaleTimeString()})</em>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      */}
    </Container>
  );
};

export default LiveInterviewPage;
