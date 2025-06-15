
"use client";

import { type NextPage } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mic, Video as VideoIcon, AlertTriangle, Zap, Square, CheckCircle, Info, MessageSquare, Volume2, ShieldAlert, Copy, MicOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { GoogleGenAI, type LiveServerMessage, Modality, type Session, type Content, MediaResolution } from '@google/genai';
import mime from 'mime';

// Mock data - in a real app, this would come from an API
const MOCK_INTERVIEW_CONTEXT_DATA = {
  job1: {
    candidate1: {
      jobTitle: "Senior Software Engineer (SAP Basis)",
      candidateName: "John Doe",
      jobDescription: "Seeking a Senior Software Engineer with expertise in SAP Basis administration, performance tuning, and cloud integration. Responsibilities include managing complex SAP landscapes, leading system upgrades, and ensuring high availability. Strong problem-solving skills and a proactive approach are essential.",
      candidateResumeSummary: "Experienced SAP Basis Consultant (10+ years) specializing in end-to-end SAP system management, HANA, S/4HANA, and cloud migrations (AWS/Azure). Proven ability to handle critical situations and deliver robust solutions.",
      systemInstruction: `You are Alex, a professional and friendly AI technical interviewer for Persona Recruit AI. You are interviewing John Doe for a Senior Software Engineer (SAP Basis) role.
      Your goal is to assess the candidate's technical skills, problem-solving abilities, and communication.
      - Start with a brief greeting and introduce yourself.
      - Ask a mix of conceptual, scenario-based, and behavioral questions relevant to SAP Basis, performance tuning, system upgrades, cloud integration, and HANA/S4HANA.
      - Keep your responses concise and conversational.
      - Listen carefully to the candidate's answers and ask relevant follow-up questions.
      - If the candidate seems to be struggling, you can gently guide them or rephrase the question.
      - If the candidate is cheating or reading answers, you can subtly note this and try to steer them back to genuine conversation, but do not be accusatory. Focus on conversational engagement.
      - Aim for an interview duration of about 5-7 turns from your side (excluding initial greeting and closing).
      - Conclude the interview professionally, thank the candidate, and mention that the recruitment team will be in touch.
      - Do NOT output markdown or special formatting in your text responses.
      `,
    }
  },
  job2: { // New job ID for Khan
    khan: { // Candidate ID "khan"
      jobTitle: "Cloud Security Architect",
      candidateName: "Dr. Khan Noonien Singh",
      jobDescription: "Seeking an experienced Cloud Security Architect to design and implement robust security solutions for our multi-cloud environment (AWS, Azure, GCP). Responsibilities include threat modeling, vulnerability management, and ensuring compliance with industry standards. Must have deep knowledge of cloud-native security services and best practices.",
      candidateResumeSummary: "Cloud Security expert with 15+ years in architecting secure and resilient enterprise systems. Strong background in network security, IAM, and data protection across AWS, Azure, and GCP. CISSP, CISM certified. Proven leader in developing security strategies and incident response plans.",
      systemInstruction: `You are Alex, a professional and friendly AI technical interviewer for Persona Recruit AI. You are interviewing Dr. Khan Noonien Singh for a Cloud Security Architect role.
      Your goal is to assess the candidate's technical expertise in cloud security, risk management, and their ability to design secure architectures.
      - Start with a brief greeting and introduce yourself.
      - Ask a mix of conceptual, scenario-based, and behavioral questions relevant to AWS, Azure, GCP security, threat modeling, IAM, data encryption, and compliance frameworks like ISO 27001 or SOC 2.
      - Keep your responses concise and conversational.
      - Listen carefully to the candidate's answers and ask relevant follow-up questions.
      - If the candidate seems to be struggling, you can gently guide them or rephrase the question.
      - Aim for an interview duration of about 5-7 turns from your side (excluding initial greeting and closing).
      - Conclude the interview professionally, thank the candidate, and mention that the recruitment team will be in touch.
      - Do NOT output markdown or special formatting in your text responses.
      `,
    }
  }
};

type CandidateContext = typeof MOCK_INTERVIEW_CONTEXT_DATA.job1.candidate1;

const LiveInterviewPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const jobId = params.jobId as string;
  const candidateId = params.candidateId as string;

  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false);
  const [interviewContext, setInterviewContext] = useState<CandidateContext | null>(null);
  
  const [showConsent, setShowConsent] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false); 
  const [isUserSpeaking, setIsUserSpeaking] = useState(false); 
  
  const [conversationLog, setConversationLog] = useState<Array<{ speaker: 'ai' | 'user', text?: string, timestamp: Date }>>([]);
  const [currentAiText, setCurrentAiText] = useState<string | null>(null);

  const [hasDevicePermissions, setHasDevicePermissions] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userVideoStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedVideoBlobs = useRef<Blob[]>([]);
  const userAudioChunksRef = useRef<Blob[]>([]);

  const genAiSessionRef = useRef<Session | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const responseQueueRef = useRef<LiveServerMessage[]>([]);
  const processingQueueRef = useRef<boolean>(false);
  
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // Fetch interview context
  useEffect(() => {
    const fetchContext = async () => {
      setIsLoadingContext(true);
      await new Promise(resolve => setTimeout(resolve, 700)); 
      // More robust way to access nested mock data
      const jobData = MOCK_INTERVIEW_CONTEXT_DATA[jobId as keyof typeof MOCK_INTERVIEW_CONTEXT_DATA];
      const contextData = jobData ? jobData[candidateId as keyof typeof jobData] : null;

      if (contextData) {
        setInterviewContext(contextData as CandidateContext); // Cast as CandidateContext
      } else {
        toast({ variant: "destructive", title: "Error", description: `Interview context not found for Job ID: ${jobId}, Candidate ID: ${candidateId}.`});
        router.push('/'); 
      }
      setIsLoadingContext(false);
    };
    if (jobId && candidateId) fetchContext();
  }, [jobId, candidateId, toast, router]);

  const requestPermissionsAndSetup = useCallback(async () => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasDevicePermissions(true);
        userVideoStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        
        recordedVideoBlobs.current = [];
        const videoOptions = { mimeType: 'video/webm;codecs=vp9,opus' };
        const videoRecorder = MediaRecorder.isTypeSupported(videoOptions.mimeType)
          ? new MediaRecorder(stream, videoOptions)
          : new MediaRecorder(stream); // Fallback if specific codecs aren't supported
        
        videoRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) recordedVideoBlobs.current.push(event.data);
        };
        videoRecorder.start(1000); 
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

  const initializeAudioContext = useCallback(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const processResponseQueue = useCallback(async () => {
    if (processingQueueRef.current || responseQueueRef.current.length === 0) return;
    processingQueueRef.current = true;

    const message = responseQueueRef.current.shift();
    if (message && interviewContext) {
      if (message.serverContent?.modelTurn?.parts) {
        for (const part of message.serverContent.modelTurn.parts) {
          if (part.text) {
            setCurrentAiText(prev => (prev || "") + part.text);
          }
          if (part.inlineData?.data && audioContextRef.current) {
            setIsAiSpeaking(true);
            try {
              const audioData = part.inlineData.data;
              // The audio data from Gemini is already in the correct format (e.g., Opus in WebM or as specified)
              // We need to create an AudioBufferSourceNode and play it.
              // Assuming the data is base64 encoded raw audio or a container format the browser can decode.
              // For direct PCM or if specific decoding is needed, this part might get more complex.
              // Gemini usually sends audio that AudioContext can handle directly after base64 decoding.
              const audioBuffer = Buffer.from(audioData, 'base64');
              const decodedAudio = await audioContextRef.current.decodeAudioData(audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength));
              const source = audioContextRef.current.createBufferSource();
              source.buffer = decodedAudio;
              source.connect(audioContextRef.current.destination);
              source.start();
              source.onended = () => {
                // Check if this was the last audio part of the current AI turn
                 const stillProcessingAudio = responseQueueRef.current.some(m => m.serverContent?.modelTurn?.parts?.some(p => p.inlineData?.data)) ||
                                          message.serverContent?.modelTurn?.parts?.slice(message.serverContent.modelTurn.parts.indexOf(part) + 1).some(p => p.inlineData?.data);

                if (!stillProcessingAudio) {
                    setIsAiSpeaking(false);
                }
              };
            } catch (e) {
              console.error("Error playing AI audio:", e);
              setIsAiSpeaking(false);
            }
          }
        }
      }
      if (message.serverContent?.turnComplete) {
        setConversationLog(prev => [...prev, { speaker: 'ai', text: currentAiText || undefined, timestamp: new Date() }]);
        setCurrentAiText(null); 
        setIsAiSpeaking(false); 
        startUserAudioRecording(); // Now automatically start user recording
      }
    }
    processingQueueRef.current = false;
    if (responseQueueRef.current.length > 0) {
      processResponseQueue(); 
    }
  }, [currentAiText, interviewContext]); // Added startUserAudioRecording here

  useEffect(() => {
    if (responseQueueRef.current.length > 0 && !processingQueueRef.current) {
      processResponseQueue();
    }
  }, [responseQueueRef.current.length, processResponseQueue]);


  const initializeGenAiSession = useCallback(async () => {
    if (!apiKey || !interviewContext) {
      toast({ variant: "destructive", title: "Initialization Error", description: "API Key or interview context missing." });
      return;
    }
    initializeAudioContext();

    const ai = new GoogleGenAI({ apiKey });
    const modelConfig = {
      responseModalities: [Modality.AUDIO, Modality.TEXT_TRANSCRIPT],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' }}}, 
      contextWindowCompression: { triggerTokens: '25600', slidingWindow: { targetTokens: '12800' }},
      systemInstruction: { parts: [{ text: interviewContext.systemInstruction }] },
    };

    try {
      const session = await ai.live.connect({
        model: 'models/gemini-2.5-flash-preview-native-audio-dialog',
        callbacks: {
          onopen: () => { 
            console.debug('Gemini Live Session Opened');
            toast({title: "AI Interviewer Connected", description: "Alex is ready to start."});
             if(genAiSessionRef.current?.sendClientContent) {
                 // Send an initial empty content to trigger the AI's first response (greeting)
                genAiSessionRef.current.sendClientContent({ turns: [ { text: "" } ] });
             } else {
                console.error("sendClientContent not available on session during onopen");
             }
          },
          onmessage: (message: LiveServerMessage) => {
            responseQueueRef.current.push(message);
            processResponseQueue();
          },
          onerror: (e: any) => { 
            console.error('Gemini Live Session Error:', e.message || e);
            toast({ variant: "destructive", title: "AI Connection Error", description: e.message || "An unknown error occurred." });
            setIsInterviewActive(false);
          },
          onclose: (e: CloseEvent) => {
            console.debug('Gemini Live Session Close:', e.reason);
            if(isInterviewActive) { 
                toast({ title: "AI Connection Closed", description: e.reason || "The session ended." });
            }
            setIsInterviewActive(false);
          },
        },
        config: modelConfig,
      });
      genAiSessionRef.current = session;
      
    } catch (error) {
      console.error("Failed to connect Gemini Live Session:", error);
      toast({ variant: "destructive", title: "Connection Failed", description: "Could not establish AI interview session." });
    }
  }, [apiKey, interviewContext, toast, initializeAudioContext, processResponseQueue, isInterviewActive]);

  const startInterview = async () => {
    if (!consentGiven || !interviewContext) return;
    
    const permissionsGranted = await requestPermissionsAndSetup();
    if (!permissionsGranted) return;

    setIsInterviewActive(true);
    setShowConsent(false);
    toast({ title: "Interview Starting...", description: "Connecting to AI interviewer."});
    await initializeGenAiSession();
  };

  const startUserAudioRecording = useCallback(() => {
    if (!userVideoStreamRef.current || !isInterviewActive || isUserSpeaking || isAiSpeaking) return;
    userAudioChunksRef.current = [];
    try {
      const streamToRecord = new MediaStream(userVideoStreamRef.current.getAudioTracks());
      mediaRecorderRef.current = new MediaRecorder(streamToRecord, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) userAudioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        // setIsUserSpeaking(false); // This will be set when AI starts speaking or manually stopped
        if (userAudioChunksRef.current.length > 0 && genAiSessionRef.current) {
          const audioBlob = new Blob(userAudioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64AudioData = reader.result?.toString().split(',')[1];
            if (base64AudioData) {
              const userTextForLog = `[User Audio - ${new Date().toLocaleTimeString()}]`; // Placeholder for log
              setConversationLog(prev => [...prev, { speaker: 'user', text: userTextForLog, timestamp: new Date() }]);
              
              const clientContent : Content = { audio: { data: base64AudioData, mimeType: 'audio/webm;codecs=opus' } };
              genAiSessionRef.current?.sendClientContent({ turns: [clientContent]});
            }
          };
        }
        userAudioChunksRef.current = []; 
      };
      mediaRecorderRef.current.start();
      setIsUserSpeaking(true);
      toast({title: "Your turn", description: "AI is listening. Speak clearly.", duration: 3000});
    } catch (error) {
        console.error("Error starting user audio recording:", error);
        toast({variant: "destructive", title: "Mic Error", description: "Could not start microphone."});
        setIsUserSpeaking(false);
    }
  }, [isInterviewActive, toast, isUserSpeaking, isAiSpeaking]);
  
  const stopUserAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsUserSpeaking(false);
  }, []);


  const finishInterview = async (reason?: string) => {
    setIsInterviewActive(false);
    if (isUserSpeaking) stopUserAudioRecording(); // Stop user recording if active
    setIsUserSpeaking(false);
    setIsAiSpeaking(false);
    
    genAiSessionRef.current?.close();
    genAiSessionRef.current = null;

    if (userVideoStreamRef.current) { 
        userVideoStreamRef.current.getTracks().forEach(track => track.stop());
        userVideoStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    setIsSubmittingInterview(true);
    const finalToastMessage = reason || "Interview session ended.";
    toast({ title: "Interview Concluded", description: finalToastMessage });

    if (recordedVideoBlobs.current.length > 0) {
        const videoBlob = new Blob(recordedVideoBlobs.current, { type: 'video/webm' });
        console.log("Final video blob for upload:", videoBlob);
        // In a real app, you would upload this videoBlob along with `conversationLog`
        // For demo, we might convert videoBlob to data URI for other flows if needed
    } else {
        console.log("No video data recorded.");
    }
    console.log("Final conversation log:", conversationLog);
    
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    setIsSubmittingInterview(false);
    
    router.push(`/candidates/dashboard?interviewComplete=true&jobTitle=${interviewContext?.jobTitle || 'Role'}`);
  };
  
  useEffect(() => {
    return () => { 
      genAiSessionRef.current?.close();
      if (userVideoStreamRef.current) {
          userVideoStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
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
   if (!apiKey) {
    return (
      <Container className="text-center py-20">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-xl font-bold text-destructive">Configuration Error</h1>
        <p className="text-muted-foreground">Gemini API Key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY.</p>
      </Container>
    );
  }
  
  const videoAreaClass = isInterviewActive && (isAiSpeaking || currentAiText) ? "md:col-span-2" : "md:col-span-3";

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
                Please read the following carefully before proceeding with your AI-assisted interview for the <strong>{interviewContext.jobTitle}</strong> role with Persona Recruit AI.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 text-sm text-muted-foreground max-h-[50vh] overflow-y-auto">
              <p>By starting this interview, you acknowledge and agree to the following:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>This interview session, including your video and audio, will be <strong>recorded</strong>.</li>
                <li>Your responses (audio and transcribed text) and the recording will be processed by <strong>Artificial Intelligence (AI)</strong>, specifically Google Gemini, to conduct the interview and generate an analysis report.</li>
                <li>This report, including insights from the AI, may be used by the recruitment team at Persona Recruit AI and the hiring company to evaluate your suitability for the role.</li>
                <li>Your data will be handled in accordance with our <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a>.</li>
                <li>You must have a working camera and microphone to participate. Ensure you are in a quiet, well-lit environment for the best experience.</li>
              </ul>
              <p className="font-semibold">You can end the interview at any time.</p>
            </div>
             <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="consent-checkbox" checked={consentGiven} onCheckedChange={(checked) => setConsentGiven(checked as boolean)} />
                <Label htmlFor="consent-checkbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I have read, understood, and agree to these terms and consent to the recording and AI processing of my interview.
                </Label>
            </div>
            <DialogFooter className="pt-5">
              <Button type="button" onClick={startInterview} disabled={!consentGiven || isLoadingContext}>
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
            <div className={`grid grid-cols-1 ${isInterviewActive && (isAiSpeaking || currentAiText) ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4 items-start`}>
              <div className={`aspect-video bg-muted rounded-lg overflow-hidden relative shadow-md ${isInterviewActive && (isAiSpeaking || currentAiText) ? 'md:col-span-2' : 'col-span-1 md:max-w-3xl mx-auto'} transition-all duration-300 ease-in-out`}>
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                {hasDevicePermissions === false && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
                    <AlertTriangle className="h-12 w-12 mb-2 text-destructive" />
                    <p className="font-semibold">Permissions Required</p>
                    <p className="text-xs text-center">Please enable camera & microphone access in your browser and refresh.</p>
                  </div>
                )}
                 {isUserSpeaking && (
                    <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center animate-pulse">
                        <Mic className="h-3 w-3 mr-1" /> LIVE
                    </div>
                )}
                 {isAiSpeaking && (
                     <div className="absolute bottom-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full flex items-center animate-pulse">
                        <Volume2 className="h-3 w-3 mr-1" /> AI SPEAKING
                    </div>
                 )}
              </div>

              {isInterviewActive && (isAiSpeaking || currentAiText) && (
                <div className="md:col-span-1 p-4 bg-primary/10 rounded-lg shadow-md h-full flex flex-col justify-center animate-fadeIn min-h-[150px]">
                  <div className="flex items-center mb-2">
                    <Volume2 className={`h-6 w-6 text-primary mr-2 ${isAiSpeaking ? 'animate-pulse' : ''}`} />
                    <h3 className="text-lg font-semibold text-primary">Alex (AI) says:</h3>
                  </div>
                  <p className="text-md text-foreground leading-relaxed">{currentAiText || (isAiSpeaking ? "..." : "Thinking...")}</p>
                </div>
              )}
            </div>
            
            {!isInterviewActive && !isSubmittingInterview && hasDevicePermissions === true && (
              <Alert variant="default" className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Ready to Begin?</AlertTitle>
                <AlertDescription>
                  The AI interviewer, Alex, will start the conversation once the session is established. Ensure you are in a quiet, well-lit environment.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          
          <CardFooter className="border-t pt-6 flex flex-col items-center">
            {isInterviewActive && (
              <div className="flex items-center space-x-4 mb-4">
                <Button 
                  onClick={startUserAudioRecording} 
                  disabled={isUserSpeaking || isAiSpeaking}
                  size="lg"
                  variant="outline"
                  className={isUserSpeaking || isAiSpeaking ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Mic className="mr-2 h-5 w-5" /> Start Speaking
                </Button>
                <Button 
                  onClick={stopUserAudioRecording} 
                  disabled={!isUserSpeaking || isAiSpeaking}
                  size="lg"
                  variant="secondary"
                  className={!isUserSpeaking || isAiSpeaking ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <MicOff className="mr-2 h-5 w-5" /> Done Speaking
                </Button>
              </div>
            )}

            {isInterviewActive ? (
              <Button onClick={() => finishInterview("Candidate ended the interview.")} variant="destructive" size="lg" disabled={isSubmittingInterview}>
                {isSubmittingInterview ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Square className="mr-2 h-5 w-5" />}
                End Interview
              </Button>
            ) : (
              <Button onClick={startInterview} size="lg" disabled={!consentGiven || hasDevicePermissions === null || isSubmittingInterview || isLoadingContext}>
                {isLoadingContext || isSubmittingInterview ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MessageSquare className="mr-2 h-5 w-5" />}
                {hasDevicePermissions === null ? "Checking Permissions..." : "Start AI Conversation"}
              </Button>
            )}
             <p className="text-xs text-muted-foreground mt-4 text-center">
              This is an AI-assisted interview. Your responses are recorded and analyzed.
            </p>
          </CardFooter>
        </Card>
      )}
      
      {conversationLog.length > 0 && process.env.NODE_ENV === 'development' && (
        <Card className="mt-8">
          <CardHeader><CardTitle>Dev: Conversation Log</CardTitle></CardHeader>
          <CardContent className="max-h-60 overflow-y-auto space-y-1 text-xs">
            {conversationLog.map((entry, index) => (
              <div key={index} className={`p-1 rounded ${entry.speaker === 'ai' ? 'bg-blue-50' : 'bg-green-50'}`}>
                <strong>{entry.speaker.toUpperCase()} ({entry.timestamp.toLocaleTimeString()}):</strong> {entry.text || "[AUDIO ONLY]"}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default LiveInterviewPage;

    