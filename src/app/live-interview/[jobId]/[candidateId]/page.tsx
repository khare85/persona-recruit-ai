
"use client";

import { type NextPage } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video as VideoIcon, AlertTriangle, Zap, Square, CheckCircle, Info, MessageSquare, ShieldAlert, Mic } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Mock data - in a real app, this would come from an API
const MOCK_INTERVIEW_CONTEXT_DATA = {
  "1": {
    "1": {
      jobTitle: "Senior Software Engineer (SAP Basis)",
      candidateName: "John Doe",
    }
  },
  "2": {
    "2": {
      jobTitle: "Cloud Security Architect",
      candidateName: "Dr. Khan Noonien Singh",
    }
  }
};

type CandidateContext = { jobTitle: string; candidateName: string; };

const LiveInterviewPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const jobId = params.jobId as string;
  const candidateId = params.candidateId as string;

  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false); // For navigation logic
  const [interviewContext, setInterviewContext] = useState<CandidateContext | null>(null);

  const [showConsent, setShowConsent] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);

  const [isInterviewActive, setIsInterviewActive] = useState(false); // General state for UI, not ElevenLabs specific now

  const [hasDevicePermissions, setHasDevicePermissions] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userVideoStreamRef = useRef<MediaStream | null>(null);

  // Fetch interview context
  useEffect(() => {
    const fetchContext = async () => {
      setIsLoadingContext(true);
      await new Promise(resolve => setTimeout(resolve, 700));

      const jobData = MOCK_INTERVIEW_CONTEXT_DATA[jobId as keyof typeof MOCK_INTERVIEW_CONTEXT_DATA];
      const contextData = jobData ? jobData[candidateId as keyof typeof jobData] : null;

      if (contextData) {
        setInterviewContext(contextData as CandidateContext);
      } else {
        toast({ variant: "destructive", title: "Error", description: `Interview context not found for Job ID: ${jobId}, Candidate ID: ${candidateId}.`});
        router.push('/candidates/my-interviews');
      }
      setIsLoadingContext(false);
    };
    if (jobId && candidateId) fetchContext();
  }, [jobId, candidateId, toast, router]);

  const requestPermissionsAndSetupVideo = useCallback(async () => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); // Keep audio for potential future use/local recording test
        setHasDevicePermissions(true);
        userVideoStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        return true;
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setHasDevicePermissions(false);
        toast({ variant: 'destructive', title: 'Device Access Denied', description: 'Please enable camera and microphone permissions in your browser settings and refresh the page.', duration: 7000 });
        return false;
      }
    }
    return false;
  }, [toast]);


  const handleStartAttempt = async () => {
    if (!consentGiven || !interviewContext) return;

    const permissionsGranted = await requestPermissionsAndSetupVideo();
    if (!permissionsGranted) return;

    setIsInterviewActive(true); // Indicate an "active" state for UI purposes (e.g. showing recording banner)
    // For now, this doesn't start any AI, just sets up video and shows message
    toast({ title: "Camera & Mic Check", description: "Your camera and microphone are active for this session." });
  };

  const finishInterview = async (reason?: string) => {
    setIsInterviewActive(false);

    if (userVideoStreamRef.current) {
        userVideoStreamRef.current.getTracks().forEach(track => track.stop());
        userVideoStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    setIsSubmittingInterview(true);
    const finalToastMessage = reason || "Interview session concluded.";
    toast({ title: "Session Ended", description: finalToastMessage });

    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmittingInterview(false);

    router.push(`/candidates/dashboard?interviewComplete=true&jobTitle=${interviewContext?.jobTitle || 'Role'}`);
  };

  useEffect(() => {
    // Cleanup stream on component unmount
    return () => {
      if (userVideoStreamRef.current) {
          userVideoStreamRef.current.getTracks().forEach(track => track.stop());
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
    // This case should be handled by the redirect in useEffect, but as a fallback:
    return (
      <Container className="text-center py-20">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive">Interview Details Not Found</h1>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/candidates/my-interviews')}>Back to My Interviews</Button>
      </Container>
    );
  }

  return (
    <Container className="max-w-5xl mx-auto py-8">
      {showConsent && (
        <Dialog open={showConsent} onOpenChange={(open) => { if(!open && !consentGiven) setShowConsent(true); else if (!open && consentGiven) setShowConsent(false); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center text-2xl">
                <ShieldAlert className="h-7 w-7 mr-3 text-primary"/> Interview Session Consent
              </DialogTitle>
              <DialogDescription className="pt-2">
                For the <strong>{interviewContext.jobTitle}</strong> role with Persona Recruit AI.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 text-sm text-muted-foreground max-h-[50vh] overflow-y-auto">
              <p>By proceeding, you acknowledge and agree:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>This session may involve displaying your video feed.</li>
                <li>Data handled per our <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a>.</li>
                <li>A working camera and microphone are recommended for full participation in potential future interactive features. Please ensure you are in a quiet, well-lit environment.</li>
              </ul>
              <p className="font-semibold">You can end the session at any time.</p>
            </div>
             <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="consent-checkbox" checked={consentGiven} onCheckedChange={(checked) => setConsentGiven(checked as boolean)} />
                <Label htmlFor="consent-checkbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I acknowledge these terms.
                </Label>
            </div>
            <DialogFooter className="pt-5">
              <Button type="button" onClick={() => { if(consentGiven) setShowConsent(false); handleStartAttempt(); }} disabled={!consentGiven || isLoadingContext}>
                Proceed to Session
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
              Interview Session: {interviewContext.jobTitle}
            </CardTitle>
            <CardDescription>
              Candidate: {interviewContext.candidateName}
            </CardDescription>
             {isInterviewActive && (
                <div className="mt-2 flex items-center justify-center gap-2 text-red-500 font-medium">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div> VIDEO ACTIVE
                </div>
              )}
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden relative shadow-md col-span-1 md:max-w-3xl mx-auto">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              {hasDevicePermissions === null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
                    <Loader2 className="h-10 w-10 mb-2 animate-spin" />
                    <p className="text-sm">Checking camera/mic...</p>
                </div>
              )}
              {hasDevicePermissions === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4">
                  <AlertTriangle className="h-12 w-12 mb-2 text-destructive" />
                  <p className="font-semibold">Permissions Required</p>
                  <p className="text-xs text-center">Please enable camera & microphone access in your browser and refresh.</p>
                </div>
              )}
            </div>

            <Alert variant="default" className="mt-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Live AI Interview Feature Update</AlertTitle>
              <AlertDescription>
                The AI-powered live voice interview feature is currently undergoing improvements. We appreciate your patience and will have it back up and running soon!
                For now, your camera and microphone are active for this session. You can test your setup.
              </AlertDescription>
            </Alert>

          </CardContent>

          <CardFooter className="border-t pt-6 flex flex-col items-center">
            {isInterviewActive ? (
              <Button onClick={() => finishInterview("Candidate ended the session.")} variant="destructive" size="lg" disabled={isSubmittingInterview}>
                {isSubmittingInterview ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Square className="mr-2 h-5 w-5" />}
                End Session
              </Button>
            ) : (
              <Button onClick={handleStartAttempt} size="lg" disabled={!consentGiven || hasDevicePermissions === false || isSubmittingInterview || isLoadingContext}>
                {isLoadingContext || isSubmittingInterview ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mic className="mr-2 h-5 w-5" />}
                {hasDevicePermissions === null ? "Initializing..." : "Start Camera/Mic Check"}
              </Button>
            )}
             <p className="text-xs text-muted-foreground mt-4 text-center">
              {isInterviewActive ? "Session is active. Click 'End Session' when done." : "Click above to activate your camera/mic for this session."}
            </p>
          </CardFooter>
        </Card>
      )}

    </Container>
  );
};

export default LiveInterviewPage;
