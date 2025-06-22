'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ElevenLabsConversationService, 
  DemoConversationService,
  ConversationMessage, 
  ConversationState,
  getDefaultElevenLabsConfig 
} from '@/lib/elevenlabs';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  Brain,
  Circle,
  MessageCircle,
  Clock,
  User,
  Building,
  FileText,
  Loader2,
  Waves,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';

// Use ConversationMessage from ElevenLabs service
type TranscriptEntry = ConversationMessage;

interface InterviewState {
  isRecording: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  duration: number;
  aiSpeaking: boolean;
  aiListening: boolean;
}

function LiveInterviewContent() {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const elevenLabsServiceRef = useRef<ElevenLabsConversationService | DemoConversationService | null>(null);

  // Interview details from URL
  const interviewId = searchParams.get('id') || 'demo-interview-001';
  const candidateName = searchParams.get('candidate') || 'John Doe';
  const position = searchParams.get('position') || 'Senior Software Engineer';
  const company = searchParams.get('company') || 'TechCorp Inc.';

  // Interview state
  const [state, setState] = useState<InterviewState>({
    isRecording: false,
    isConnected: false,
    isMuted: false,
    isVideoEnabled: true,
    duration: 0,
    aiSpeaking: false,
    aiListening: false
  });

  // Transcript and conversation
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentAiMessage, setCurrentAiMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState('');

  // Timer for interview duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.isRecording) {
      interval = setInterval(() => {
        setState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.isRecording]);

  // Initialize media devices
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize MediaRecorder for video recording
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      setState(prev => ({ ...prev, isConnected: true }));
      setIsInitializing(false);
    } catch (error) {
      console.error('Media initialization error:', error);
      setError('Failed to access camera or microphone. Please check your permissions.');
      setIsInitializing(false);
    }
  }, []);

  // Initialize ElevenLabs conversation
  const initializeElevenLabsConversation = useCallback(async () => {
    try {
      const config = getDefaultElevenLabsConfig();
      
      // Check if ElevenLabs is properly configured
      const isConfigured = config.apiKey !== 'demo-key' && config.agentId !== 'demo-agent';
      
      if (isConfigured) {
        elevenLabsServiceRef.current = new ElevenLabsConversationService(config);
      } else {
        console.log('Using demo conversation service - ElevenLabs not configured');
        elevenLabsServiceRef.current = new DemoConversationService();
      }
      
      // Set up event handlers
      elevenLabsServiceRef.current.onMessage((message: ConversationMessage) => {
        setTranscript(prev => [...prev, message]);
        if (message.speaker === 'ai') {
          setCurrentAiMessage(message.text);
        }
      });
      
      elevenLabsServiceRef.current.onStateChange((conversationState: ConversationState) => {
        setState(prev => ({
          ...prev,
          isConnected: conversationState.isConnected,
          aiSpeaking: conversationState.isSpeaking,
          aiListening: conversationState.isListening
        }));
        
        if (conversationState.error) {
          setError(conversationState.error);
        }
      });
      
      // Initialize session
      await elevenLabsServiceRef.current.initializeSession({
        candidateName,
        position,
        company,
        jobDescription: `Interview for ${position} position at ${company}`
      });
      
      // Start conversation
      await elevenLabsServiceRef.current.startConversation();
      
    } catch (error) {
      console.error('ElevenLabs initialization error:', error);
      setError('Using demo mode - could not connect to ElevenLabs. Check configuration.');
      
      // Fallback to demo service
      elevenLabsServiceRef.current = new DemoConversationService();
      await elevenLabsServiceRef.current.initializeSession({ candidateName, position, company });
      await elevenLabsServiceRef.current.startConversation();
    }
  }, [candidateName, position, company]);

  // Start interview recording
  const startInterview = useCallback(async () => {
    if (!mediaRecorderRef.current || !streamRef.current) {
      setError('Media not initialized');
      return;
    }

    try {
      // Start video recording
      const chunks: BlobPart[] = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        // Here you would upload the blob to your server
        console.log('Interview recording completed:', blob);
      };

      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      
      setState(prev => ({ ...prev, isRecording: true }));
      
      // Initialize AI conversation
      await initializeElevenLabsConversation();
      
    } catch (error) {
      console.error('Start interview error:', error);
      setError('Failed to start interview recording.');
    }
  }, [initializeElevenLabsConversation]);

  // End interview
  const endInterview = useCallback(async () => {
    try {
      // Stop video recording
      if (mediaRecorderRef.current && state.isRecording) {
        mediaRecorderRef.current.stop();
      }
      
      // Stop camera/microphone
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // End ElevenLabs conversation
      if (elevenLabsServiceRef.current) {
        await elevenLabsServiceRef.current.endConversation();
      }

      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isConnected: false,
        aiSpeaking: false,
        aiListening: false
      }));

      // Redirect to analysis or completion page
      setTimeout(() => {
        window.location.href = `/interviews/analysis/${interviewId}`;
      }, 2000);
      
    } catch (error) {
      console.error('Error ending interview:', error);
      setError('Error ending interview. Please try again.');
    }
  }, [state.isRecording, interviewId]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = state.isMuted;
        setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
      }
    }
  }, [state.isMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !state.isVideoEnabled;
        setState(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
      }
    }
  }, [state.isVideoEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (elevenLabsServiceRef.current) {
        elevenLabsServiceRef.current.endConversation().catch(console.error);
      }
    };
  }, []);

  // Initialize on component mount
  useEffect(() => {
    initializeMedia();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeMedia]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Initializing interview session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-400" />
              <span className="font-semibold">AI Interview</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span>{candidateName}</span>
              <span>•</span>
              <span>{position}</span>
              <span>•</span>
              <span>{company}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatDuration(state.duration)}</span>
            </div>
            {state.isRecording && (
              <div className="flex items-center gap-2">
                <Circle className="h-3 w-3 fill-red-500 text-red-500 animate-pulse" />
                <span className="text-red-400 text-sm">RECORDING</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {/* Candidate Video */}
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* AI Interviewer Overlay */}
            <div className="absolute top-4 left-4 w-48 h-36 bg-gray-800 rounded-lg border-2 border-blue-400 overflow-hidden">
              <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                {/* AI Avatar Animation */}
                <div className={`relative ${state.aiSpeaking ? 'animate-pulse' : ''}`}>
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <Brain className="h-8 w-8 text-blue-600" />
                  </div>
                  {state.aiSpeaking && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <Waves className="h-4 w-4 text-white animate-bounce" />
                    </div>
                  )}
                  {state.aiListening && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                
                {/* AI Status */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="text-xs text-white text-center">
                    {state.aiSpeaking ? 'Speaking...' : state.aiListening ? 'Listening...' : 'AI Interviewer'}
                  </div>
                </div>
              </div>
            </div>

            {/* Current AI Message Overlay */}
            {currentAiMessage && state.aiSpeaking && (
              <div className="absolute bottom-20 left-4 right-4">
                <Card className="bg-gray-900/90 border-blue-400">
                  <CardContent className="p-4">
                    <p className="text-white text-sm">{currentAiMessage}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Controls Overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-3 bg-gray-900/80 rounded-full p-3">
                <Button
                  variant={state.isMuted ? "destructive" : "secondary"}
                  size="sm"
                  onClick={toggleMute}
                  className="rounded-full p-3"
                >
                  {state.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant={!state.isVideoEnabled ? "destructive" : "secondary"}
                  size="sm"
                  onClick={toggleVideo}
                  className="rounded-full p-3"
                >
                  {!state.isVideoEnabled ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                </Button>

                {!state.isRecording ? (
                  <Button
                    onClick={startInterview}
                    className="bg-green-600 hover:bg-green-700 rounded-full px-6"
                  >
                    Start Interview
                  </Button>
                ) : (
                  <Button
                    onClick={endInterview}
                    variant="destructive"
                    className="rounded-full px-6"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    End Interview
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Live Transcript */}
        <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-400" />
              Live Transcript
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Real-time conversation transcription
            </p>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {transcript.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg ${
                    entry.speaker === 'ai' 
                      ? 'bg-blue-900/50 border-l-4 border-blue-400' 
                      : 'bg-gray-800 border-l-4 border-green-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={entry.speaker === 'ai' ? 'default' : 'secondary'} className="text-xs">
                      {entry.speaker === 'ai' ? 'AI Interviewer' : 'You'}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-white">{entry.text}</p>
                  {entry.confidence && (
                    <div className="mt-1 text-xs text-gray-500">
                      Confidence: {Math.round(entry.confidence * 100)}%
                    </div>
                  )}
                </div>
              ))}
              
              {transcript.length === 0 && !state.isRecording && (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Start the interview to see live transcription</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Transcript Status */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Transcript entries:</span>
              <span className="text-white">{transcript.length}</span>
            </div>
            {state.isRecording && (
              <div className="flex items-center gap-2 mt-2 text-xs text-green-400">
                <Circle className="h-2 w-2 fill-current animate-pulse" />
                <span>Recording and transcribing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="absolute top-20 left-4 right-4 mx-auto max-w-md" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default function LiveInterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading interview...</div>}>
      <LiveInterviewContent />
    </Suspense>
  );
}