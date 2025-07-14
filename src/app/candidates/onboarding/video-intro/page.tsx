
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, 
  Camera, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  RotateCcw,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const VIDEO_DURATION_LIMIT = 10; // seconds
const VIDEO_COUNTDOWN = 3; // countdown before recording starts

export default function VideoIntroPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');

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

  useEffect(() => {
    requestCameraPermission();
    return () => {
      stopStream();
    };
  }, [requestCameraPermission]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
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

    return () => clearInterval(interval);
  }, [countdown, isRecording, recordingTime]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

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
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsPreviewing(false);
    setCountdown(0);
    requestCameraPermission(); // Re-request to show live feed
  };

  const uploadVideo = async () => {
    if (!recordedBlob) return;

    try {
      setIsUploading(true);
      
      const arrayBuffer = await recordedBlob.arrayBuffer();
      const base64Content = Buffer.from(arrayBuffer).toString('base64');
      
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

      toast({
        title: "🎉 Profile Complete!",
        description: "Your video introduction has been uploaded successfully."
      });
      router.push('/candidates/dashboard');
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  const skipVideoIntro = () => {
    if (confirm('Are you sure you want to skip the video introduction? You can always add it later from your profile.')) {
      router.push('/candidates/dashboard');
    }
  };

  return (
     <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Video className="h-12 w-12 text-primary" />
              {isPreviewing && recordedBlob && (
                <CheckCircle className="h-5 w-5 text-green-500 absolute -bottom-1 -right-1" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">Record Your Introduction</CardTitle>
          <CardDescription>
            Step 3 of 3: Record a quick 10-second video to introduce yourself
          </CardDescription>
          <div className="mt-4">
            <Progress value={66.67} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">Step 3 of 3</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Tips for a great introduction:</strong>
              <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
                <li>State your name and current role</li>
                <li>Mention your key skills or expertise</li>
                <li>Express what you're looking for</li>
                <li>Smile and maintain eye contact</li>
                <li>Ensure good lighting and clear audio</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {cameraPermission === 'denied' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">Camera access is required to record your introduction</p>
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
            {!isRecording && !isPreviewing && (
              <Button 
                onClick={startRecording} 
                size="lg"
                disabled={cameraPermission !== 'granted'}
              >
                <Camera className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && countdown === 0 && (
              <Button 
                onClick={stopRecording} 
                size="lg"
                variant="destructive"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {isPreviewing && recordedBlob && (
              <>
                <Button 
                  onClick={resetRecording} 
                  size="lg"
                  variant="outline"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Re-record
                </Button>
                <Button 
                  onClick={uploadVideo} 
                  size="lg"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Save & Complete Profile
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={skipVideoIntro}
              className="text-muted-foreground"
            >
              Skip for now (you can add it later)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
