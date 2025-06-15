
"use client";

import { type NextPage } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Container } from "@/components/shared/Container";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, AlertTriangle, Zap, Square, Play, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock data - in a real app, this would come from an API
const MOCK_INTERVIEW_DATA = {
  jobTitle: "Senior Software Engineer",
  candidateName: "John Doe",
  questions: [
    "Tell me about a challenging project you worked on and how you overcame the obstacles.",
    "Describe your experience with microservices architecture.",
    "How do you approach debugging a complex issue in a large codebase?",
    "Where do you see yourself in 5 years?",
    "Why are you interested in this role at OurCompany?",
  ],
};

const LiveInterviewPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const jobId = params.jobId as string;
  const candidateId = params.candidateId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [interviewData, setInterviewData] = useState<typeof MOCK_INTERVIEW_DATA | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [interviewFinished, setInterviewFinished] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);


  useEffect(() => {
    // Simulate fetching interview details
    const fetchInterviewData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      // In a real app, fetch based on jobId and candidateId
      setInterviewData(MOCK_INTERVIEW_DATA);
      setIsLoading(false);
    };

    if (jobId && candidateId) {
      fetchInterviewData();
    }
  }, [jobId, candidateId]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setHasCameraPermission(true);
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera/mic:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Device Access Denied',
            description: 'Please enable camera and microphone permissions in your browser settings.',
          });
        }
      } else {
        setHasCameraPermission(false);
         toast({
            variant: 'destructive',
            title: 'Unsupported Browser',
            description: 'Your browser does not support the necessary features for video interviews.',
          });
      }
    };

    getCameraPermission();

    return () => {
      // Cleanup: stop media stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
     if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const startRecording = () => {
    if (!hasCameraPermission) {
        toast({ variant: "destructive", title: "Cannot Start", description: "Camera/mic permission is required."});
        return;
    }
    setIsRecording(true);
    setCurrentQuestionIndex(0); // Start from the first question
    toast({ title: "Recording Started", description: "The interview session is now being recorded." });
  };

  const stopRecording = async () => {
    setIsRecording(false);
    // Here you would typically stop the actual recording and send data to Gemini Live Stream AI
    // For demo purposes, we'll just simulate this
    toast({ title: "Recording Stopped", description: "Interview data is being processed..." });
    
    setIsLoading(true); // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI processing
    setIsLoading(false);
    setInterviewFinished(true);
    toast({ title: "Interview Complete!", description: "Your interview has been submitted for review.", action: <CheckCircle className="text-green-500" /> });
  };

  const nextQuestion = () => {
    if (interviewData && currentQuestionIndex < interviewData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Last question answered, automatically stop recording or offer to finish
      stopRecording();
    }
  };

  if (isLoading && !interviewData) {
    return (
      <Container className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Preparing your interview session...</p>
      </Container>
    );
  }

  if (!interviewData) {
    return (
      <Container className="text-center py-20">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive">Interview Not Found</h1>
        <p className="text-muted-foreground mt-2">
          The interview session details could not be loaded. Please check the link or contact support.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/')}>
          Back to Homepage
        </Button>
      </Container>
    );
  }
  
  if (interviewFinished) {
    return (
       <Container className="flex flex-col items-center justify-center min-h-[80vh] text-center">
        <CheckCircle className="h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-3xl font-headline font-semibold mb-3">Interview Submitted!</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
            Thank you, {interviewData.candidateName}. Your interview for the {interviewData.jobTitle} role has been successfully recorded and sent for review.
        </p>
        <Button onClick={() => router.push('/')} size="lg">
            Return to Dashboard
        </Button>
      </Container>
    );
  }


  return (
    <Container className="max-w-4xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <Zap className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-3xl font-headline">
            Live AI Interview: {interviewData.jobTitle}
          </CardTitle>
          <CardDescription>
            Candidate: {interviewData.candidateName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted // Mute local playback to avoid echo
              playsInline // Important for iOS
            />
            {!isCameraOn && hasCameraPermission && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                    <VideoOff className="h-16 w-16 mb-2" />
                    <p>Camera is Off</p>
                </div>
            )}
          </div>

          {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Camera/Microphone Access Required</AlertTitle>
              <AlertDescription>
                Please enable camera and microphone permissions in your browser settings to participate in the interview. Then, refresh this page.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center space-x-3">
            <Button variant="outline" onClick={toggleCamera} disabled={hasCameraPermission === null || hasCameraPermission === false}>
              {isCameraOn ? <VideoIcon className="mr-2" /> : <VideoOff className="mr-2" />}
              {isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
            </Button>
            <Button variant="outline" onClick={toggleMic} disabled={hasCameraPermission === null || hasCameraPermission === false}>
              {isMicOn ? <Mic className="mr-2" /> : <MicOff className="mr-2" />}
              {isMicOn ? "Mute Mic" : "Unmute Mic"}
            </Button>
          </div>
          
          <Separator />

          {!isRecording && !interviewFinished && (
            <div className="text-center p-6 bg-secondary/30 rounded-md">
                <h3 className="text-xl font-semibold mb-2">Ready to start?</h3>
                <p className="text-muted-foreground mb-4">
                    When you begin, the first question will be displayed. Answer it, then click "Next Question".
                </p>
                <Button onClick={startRecording} size="lg" disabled={hasCameraPermission === false || isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
                    Start Interview
                </Button>
            </div>
          )}

          {isRecording && (
            <Card className="bg-background/70">
              <CardHeader>
                <CardTitle className="text-xl text-center">
                  Question {currentQuestionIndex + 1} of {interviewData.questions.length}
                </CardTitle>
                 <div className="flex items-center justify-center mt-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-red-500 font-medium">Recording...</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-center font-medium p-4 min-h-[100px] flex items-center justify-center">
                  {interviewData.questions[currentQuestionIndex]}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-center gap-4">
                <Button onClick={nextQuestion} size="lg" className="w-full md:w-auto" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {currentQuestionIndex === interviewData.questions.length - 1 ? "Finish & Submit Interview" : "Next Question"}
                </Button>
                {currentQuestionIndex < interviewData.questions.length - 1 && (
                     <Button onClick={stopRecording} variant="destructive" size="sm" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
                        Stop and End Interview Early
                    </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground pt-4">
            This is an AI-assisted interview. Your responses will be analyzed to provide insights to the recruitment team.
          </CardFooter>
      </Card>
    </Container>
  );
};

export default LiveInterviewPage;

// Basic Separator component if not available globally
const Separator = () => <hr className="my-4 border-border" />;

