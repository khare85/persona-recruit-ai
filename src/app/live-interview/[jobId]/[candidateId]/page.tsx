
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

  const [isLoading, setIsLoading] = useState(true); // For initial data load
  const [isProcessing, setIsProcessing] = useState(false); // For post-recording processing
  const [interviewData, setInterviewData] = useState<typeof MOCK_INTERVIEW_DATA | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [interviewFinished, setInterviewFinished] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedBlobs = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);


  useEffect(() => {
    const fetchInterviewData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); 
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
          // Ensure mic is initially on if permission granted
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = true;
            setIsMicOn(true);
          }
        } catch (error) {
          console.error('Error accessing camera/mic:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Device Access Denied',
            description: 'Please enable camera and microphone permissions in your browser settings, then refresh the page.',
            duration: 10000,
          });
        }
      } else {
        setHasCameraPermission(false);
         toast({
            variant: 'destructive',
            title: 'Unsupported Browser',
            description: 'Your browser does not support the necessary features for video interviews.',
            duration: 10000,
          });
      }
    };

    getCameraPermission();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
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
    if (!hasCameraPermission || !streamRef.current) {
        toast({ variant: "destructive", title: "Cannot Start Interview", description: "Camera and microphone permissions are required. Please grant access and refresh."});
        return;
    }
    if (!isCameraOn || !isMicOn) {
        toast({ variant: "destructive", title: "Camera/Mic Off", description: "Please turn on your camera and microphone to start the interview."});
        return;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        toast({ title: "Already Recording", description: "The interview session is already being recorded." });
        return;
    }

    recordedBlobs.current = [];
    try {
      // Attempt to use a common, well-supported codec combination
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.warn(`${options.mimeType} not supported, trying default`);
        // Fallback to default if specific codec is not supported
        mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      } else {
        mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      }
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedBlobs.current.push(event.data);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setCurrentQuestionIndex(0);
      toast({ title: "Recording Started!", description: "The interview session is now being recorded. Please answer the questions clearly." });
    } catch (e) {
        console.error("MediaRecorder error:", e);
        toast({ variant: "destructive", title: "Recording Error", description: "Could not start recording. Please check browser console for details."});
        setIsRecording(false);
    }
  };

  const stopRecordingAndProcess = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsProcessing(true); 
    
    toast({ 
        title: "Processing Interview...", 
        description: "Your interview recording is being processed. This may take a moment.",
        duration: 5000,
    });
    
    // Simulate processing and report generation
    // In a real app, you'd upload recordedBlobs.current (combined into a single video file)
    // and the transcript (from Gemini Live Stream) to your backend/AI flow.
    const recordedVideoBlob = new Blob(recordedBlobs.current, { type: mediaRecorderRef.current?.mimeType || 'video/webm' });
    console.log("Simulated: Recorded video blob created, size:", recordedVideoBlob.size, "type:", recordedVideoBlob.type);
    // const mockTranscript = "This is a mock transcript of the interview...";
    // console.log("Simulated transcript:", mockTranscript);
    
    // Here, you would convert recordedVideoBlob to data URI if needed by the AI flow
    // and then call an AI flow like `generateVideoInterviewAnalysisReport`.

    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate AI processing time
    
    setIsProcessing(false);
    setInterviewFinished(true);
    // Toast for success is now handled by the interviewFinished screen
  };

  const nextQuestion = () => {
    if (interviewData && currentQuestionIndex < interviewData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      stopRecordingAndProcess();
    }
  };

  if (isLoading && !interviewData && !interviewFinished) {
    return (
      <Container className="flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Preparing your interview session...</p>
      </Container>
    );
  }

  if (!interviewData && !isLoading && !interviewFinished && !isProcessing) {
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
        <h1 className="text-3xl font-headline font-semibold mb-3">Interview Submitted Successfully!</h1>
        <p className="text-lg text-muted-foreground mb-2 max-w-md">
            Thank you, {interviewData?.candidateName || "Candidate"}. Your AI-assisted interview for the {interviewData?.jobTitle || "role"} has been recorded.
        </p>
        <p className="text-md text-muted-foreground mb-8 max-w-lg">
            Our AI will now analyze your responses to generate a comprehensive report for the recruitment team. They will be in touch regarding the next steps.
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
            Live AI Interview: {interviewData?.jobTitle}
          </CardTitle>
          <CardDescription>
            Candidate: {interviewData?.candidateName || "N/A"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted // Mute local playback to avoid echo
              playsInline 
            />
            {hasCameraPermission === null && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Initializing camera and microphone...</p>
                </div>
            )}
            {hasCameraPermission && !isCameraOn && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                    <VideoOff className="h-16 w-16 mb-2" />
                    <p>Camera is Off</p>
                </div>
            )}
            {hasCameraPermission && !isMicOn && isCameraOn && (
                 <div className="absolute top-4 left-4 p-2 bg-black/50 rounded-md text-white text-sm flex items-center">
                    <MicOff className="h-4 w-4 mr-1" /> Mic Muted
                </div>
            )}
          </div>

          {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Camera & Microphone Access Denied</AlertTitle>
              <AlertDescription>
                AI Talent Stream requires access to your camera and microphone for the interview. Please enable permissions in your browser settings and refresh this page.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center space-x-3">
            <Button 
              variant="outline" 
              onClick={toggleCamera} 
              disabled={hasCameraPermission !== true || isRecording || isProcessing}
              aria-pressed={isCameraOn}
            >
              {isCameraOn ? <VideoIcon className="mr-2" /> : <VideoOff className="mr-2" />}
              {isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
            </Button>
            <Button 
              variant="outline" 
              onClick={toggleMic} 
              disabled={hasCameraPermission !== true || isRecording || isProcessing}
              aria-pressed={isMicOn}
            >
              {isMicOn ? <Mic className="mr-2" /> : <MicOff className="mr-2" />}
              {isMicOn ? "Mute Mic" : "Unmute Mic"}
            </Button>
          </div>
          
          <hr className="my-4 border-border" />

          {!isRecording && !interviewFinished && !isProcessing && (
            <div className="text-center p-6 bg-secondary/30 rounded-md">
                <h3 className="text-xl font-semibold mb-2">Ready to start your AI Interview?</h3>
                <p className="text-muted-foreground mb-4">
                    Ensure your camera and microphone are enabled and working. When you begin, the first question will be displayed. Answer clearly, then click "Next Question" to proceed. The entire session will be recorded.
                </p>
                <Button 
                  onClick={startRecording} 
                  size="lg" 
                  disabled={hasCameraPermission !== true || isLoading || !isCameraOn || !isMicOn}
                >
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
                  Start Interview
                </Button>
                {hasCameraPermission === true && (!isCameraOn || !isMicOn) && (
                    <p className="text-xs text-destructive mt-2">Please turn on your camera and microphone to start.</p>
                )}
            </div>
          )}
          
          {isProcessing && (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-semibold text-foreground">Processing Your Interview...</p>
              <p className="text-muted-foreground">Please wait while we prepare your submission for AI analysis.</p>
            </div>
          )}


          {isRecording && interviewData && (
            <Card className="bg-background/70 border-primary/50">
              <CardHeader>
                <CardTitle className="text-xl text-center">
                  Question {currentQuestionIndex + 1} of {interviewData.questions.length}
                </CardTitle>
                 <div className="flex items-center justify-center mt-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-red-500 font-medium text-sm">RECORDING</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-center font-medium p-4 min-h-[100px] flex items-center justify-center bg-muted rounded-md">
                  {interviewData.questions[currentQuestionIndex]}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-center gap-4">
                <Button onClick={nextQuestion} size="lg" className="w-full md:w-2/3">
                  {currentQuestionIndex === interviewData.questions.length - 1 ? "Finish & Submit Interview" : "Next Question"}
                </Button>
                {currentQuestionIndex < interviewData.questions.length - 1 && (
                     <Button onClick={stopRecordingAndProcess} variant="destructive" size="sm">
                        <Square className="mr-2 h-4 w-4" />
                        Stop and End Interview Early
                    </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground pt-4 border-t">
            This is an AI-assisted interview. Your responses will be recorded and analyzed to provide insights to the recruitment team. <br /> Ensure you are in a quiet, well-lit environment for the best results.
          </CardFooter>
      </Card>
    </Container>
  );
};

export default LiveInterviewPage;

    