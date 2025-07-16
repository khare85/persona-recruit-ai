"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Video, 
  Camera, 
  Play, 
  Square, 
  RotateCcw,
  Loader2,
  Info,
  Shield,
  Eye,
  AlertCircle
} from 'lucide-react';

type OnboardingStep = 'resume' | 'video-consent' | 'video-record' | 'complete';

const VIDEO_DURATION_LIMIT = 10; // seconds
const VIDEO_COUNTDOWN = 3; // countdown before recording starts

export default function OnboardingModal() {
  const { showOnboardingModal, setShowOnboardingModal } = useOnboarding();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('resume');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [hasConsented, setHasConsented] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const getStepProgress = () => {
    switch (currentStep) {
      case 'resume': return 25;
      case 'video-consent': return 50;
      case 'video-record': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOC, or DOCX file.",
        variant: "destructive"
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  };

  const uploadResume = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);
      
      console.log('OnboardingModal: Starting resume upload for file:', selectedFile.name);
      
      const formData = new FormData();
      formData.append('resume', selectedFile);

      setUploadProgress(30);

      const token = await user?.getIdToken();
      if (!token) throw new Error("Authentication failed");

      console.log('OnboardingModal: Got auth token, making API call');

      const response = await fetch('/api/candidates/resume-process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress(70);

      console.log('OnboardingModal: API response status:', response.status);
      const result = await response.json();
      console.log('OnboardingModal: API response:', result);

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadProgress(100);

      toast({
        title: "✅ Resume Uploaded!",
        description: "Your resume has been uploaded successfully."
      });

      // Move to video consent step
      setTimeout(() => {
        setCurrentStep('video-consent');
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      console.error('OnboardingModal: Resume upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraPermission('granted');
    } catch (err) {
      console.error('Camera permission denied:', err);
      setCameraPermission('denied');
      toast({
        title: "Camera Access Required",
        description: "Please allow camera and microphone access to record your introduction.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const startRecording = async () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setRecordedBlob(null);
    setRecordingTime(0);
    setCountdown(VIDEO_COUNTDOWN);
    setIsPreviewing(false);

    const options = { mimeType: 'video/webm;codecs=vp8,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm';
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: options.mimeType });
        setRecordedBlob(blob);
        setIsPreviewing(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = URL.createObjectURL(blob);
        }
      };

      setTimeout(() => {
        mediaRecorder.start();
        setIsRecording(true);
      }, VIDEO_COUNTDOWN * 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      toast({
        title: "Recording Failed",
        description: "Failed to start recording. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    if (videoRef.current && videoRef.current.src && videoRef.current.src.startsWith('blob:')) {
      URL.revokeObjectURL(videoRef.current.src);
    }
    
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsPreviewing(false);
    setCountdown(0);
    chunksRef.current = [];
    
    requestCameraPermission();
  };

  const uploadVideo = async () => {
    if (!recordedBlob) return;

    try {
      setIsUploading(true);
      
      const arrayBuffer = await recordedBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Content = buffer.toString('base64');
      
      const token = await user?.getIdToken();
      if (!token) throw new Error("Authentication failed");
      
      const response = await fetch('/api/upload/video-intro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ videoBlob: base64Content })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setCurrentStep('complete');
      setIsUploading(false);

      toast({
        title: "🎉 Profile Complete!",
        description: "Your profile has been created successfully."
      });

      // Complete onboarding after showing success
      setTimeout(() => {
        setShowOnboardingModal(false);
        router.push('/candidates/profile');
      }, 2000);

    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  // Recording timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isRecording && recordingTime < VIDEO_DURATION_LIMIT) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= VIDEO_DURATION_LIMIT) {
            stopRecording();
            return VIDEO_DURATION_LIMIT;
          }
          return prev + 0.1;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown, isRecording, recordingTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current?.src && videoRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(videoRef.current.src);
      }
    };
  }, []);

  const renderResumeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Upload Your Resume</h3>
        <p className="text-muted-foreground">
          Help us understand your background and experience
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Our AI will automatically:</strong>
          <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
            <li>Extract and analyze your experience</li>
            <li>Generate a professional summary</li>
            <li>Identify your key skills</li>
          </ul>
        </AlertDescription>
      </Alert>

      {!selectedFile ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium mb-2">Choose Your Resume</h4>
          <p className="text-muted-foreground mb-4">
            Upload a PDF, DOC, or DOCX file (max 5MB)
          </p>
          <input
            type="file"
            id="resume-upload"
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
          />
          <label htmlFor="resume-upload" className="cursor-pointer">
            <Button asChild>
              <span>Choose File</span>
            </Button>
          </label>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <h4 className="font-medium">{selectedFile.name}</h4>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Uploading Resume...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      <div className="flex justify-between">
        <Button 
          variant="outline"
          onClick={() => setCurrentStep('video-consent')}
          disabled={isUploading}
        >
          Skip for now
        </Button>
        <Button 
          onClick={uploadResume} 
          disabled={!selectedFile || isUploading}
          size="lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              Upload Resume
              <CheckCircle className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderVideoConsentStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Video Introduction Consent</h3>
        <p className="text-muted-foreground">
          We'd like to record a brief video introduction for AI analysis
        </p>
      </div>

      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription>
          <strong>How we use your video:</strong>
          <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
            <li>AI analysis of communication skills and confidence</li>
            <li>Matching you with suitable job opportunities</li>
            <li>Helping recruiters understand your personality</li>
            <li>Stored securely and only shared with your consent</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">What to include in your 10-second introduction:</h4>
        <ul className="text-sm space-y-1">
          <li>• Your name and current role</li>
          <li>• Key skills or expertise</li>
          <li>• What you're looking for</li>
          <li>• Keep it natural and confident</li>
        </ul>
      </div>

      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="consent-checkbox"
          checked={hasConsented}
          onChange={(e) => setHasConsented(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="consent-checkbox" className="text-sm">
          I consent to recording and AI analysis of my video introduction for job matching purposes
        </label>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={() => setCurrentStep('video-record')}
          disabled={!hasConsented}
          size="lg"
        >
          Continue to Recording
          <Video className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderVideoRecordStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Video className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Record Your Introduction</h3>
        <p className="text-muted-foreground">
          Record a 10-second video introduction
        </p>
      </div>

      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {cameraPermission === 'denied' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Camera access is required</p>
              <Button onClick={requestCameraPermission}>
                Grant Camera Access
              </Button>
            </div>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef}
              autoPlay
              muted={!isPreviewing}
              playsInline
              className="w-full h-full object-cover"
            />
            
            {countdown > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-6xl font-bold animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {isRecording && countdown === 0 && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">Recording</span>
              </div>
            )}
          </>
        )}
      </div>

      {(isRecording || recordingTime > 0) && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Recording Progress</span>
            <span>{recordingTime.toFixed(1)}s / {VIDEO_DURATION_LIMIT}s</span>
          </div>
          <Progress value={(recordingTime / VIDEO_DURATION_LIMIT) * 100} />
        </div>
      )}

      <div className="flex gap-3 justify-center">
        {cameraPermission === 'pending' && (
          <Button onClick={requestCameraPermission} size="lg">
            <Camera className="h-5 w-5 mr-2" />
            Enable Camera
          </Button>
        )}

        {!isRecording && !isPreviewing && cameraPermission === 'granted' && (
          <Button onClick={startRecording} size="lg">
            <Camera className="h-5 w-5 mr-2" />
            Start Recording
          </Button>
        )}

        {isRecording && countdown === 0 && (
          <Button onClick={stopRecording} size="lg" variant="destructive">
            <Square className="h-5 w-5 mr-2" />
            Stop Recording
          </Button>
        )}

        {isPreviewing && recordedBlob && (
          <>
            <Button onClick={resetRecording} size="lg" variant="outline">
              <RotateCcw className="h-5 w-5 mr-2" />
              Re-record
            </Button>
            <Button onClick={uploadVideo} size="lg" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Complete Profile
                </>
              )}
            </Button>
          </>
        )}
      </div>

      <div className="text-center mt-4">
        <Button 
          variant="link" 
          onClick={() => {
            setCurrentStep('complete');
            setShowOnboardingModal(false);
            router.push('/candidates/profile');
          }}
          className="text-muted-foreground"
        >
          Skip video introduction (you can add it later)
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
      <h3 className="text-2xl font-semibold text-green-600">Profile Complete!</h3>
      <p className="text-muted-foreground">
        Your profile has been created successfully. You'll be redirected to your profile page.
      </p>
      <div className="animate-pulse">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    </div>
  );

  return (
    <Dialog open={showOnboardingModal} onOpenChange={setShowOnboardingModal}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-center">
            Step {currentStep === 'resume' ? '1' : currentStep === 'video-consent' ? '2' : currentStep === 'video-record' ? '3' : '4'} of 4
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Progress value={getStepProgress()} className="w-full" />
          
          {currentStep === 'resume' && renderResumeStep()}
          {currentStep === 'video-consent' && renderVideoConsentStep()}
          {currentStep === 'video-record' && renderVideoRecordStep()}
          {currentStep === 'complete' && renderCompleteStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}