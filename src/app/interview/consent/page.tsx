'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Video, 
  Mic, 
  Shield, 
  Clock, 
  User, 
  Building, 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  Camera,
  Users,
  FileText,
  Lock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

function InterviewConsentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [consents, setConsents] = useState({
    recording: false,
    analysis: false,
    storage: false,
    terms: false
  });
  const [isAllConsented, setIsAllConsented] = useState(false);
  const [deviceAccess, setDeviceAccess] = useState({ camera: false, microphone: false });
  const [isTestingDevices, setIsTestingDevices] = useState(false);

  // Extract interview details from URL params
  const interviewId = searchParams.get('id') || 'demo-interview-001';
  const candidateName = searchParams.get('candidate') || 'John Doe';
  const position = searchParams.get('position') || 'Senior Software Engineer';
  const company = searchParams.get('company') || 'TechCorp Inc.';
  const duration = searchParams.get('duration') || '30 minutes';

  useEffect(() => {
    setIsAllConsented(Object.values(consents).every(consent => consent));
  }, [consents]);

  const handleConsentChange = (key: keyof typeof consents) => {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const testDeviceAccess = async () => {
    setIsTestingDevices(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setDeviceAccess({ camera: true, microphone: true });
      
      // Stop the stream after testing
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Device access error:', error);
      setDeviceAccess({ camera: false, microphone: false });
    } finally {
      setIsTestingDevices(false);
    }
  };

  const startInterview = () => {
    if (isAllConsented && deviceAccess.camera && deviceAccess.microphone) {
      // Open interview in new tab
      const interviewUrl = `/interview/live?id=${interviewId}&candidate=${encodeURIComponent(candidateName)}&position=${encodeURIComponent(position)}&company=${encodeURIComponent(company)}`;
      window.open(interviewUrl, '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Interview Setup
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Prepare for your AI-powered interview session
          </p>
        </div>

        {/* Interview Details */}
        <Card className="mb-6 border-blue-200 dark:border-blue-800">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/50">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Interview Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Candidate:</span>
                  <span className="font-medium">{candidateName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Company:</span>
                  <span className="font-medium">{company}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Position:</span>
                  <span className="font-medium">{position}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                  <Badge variant="outline">{duration}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Access Test */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-green-600" />
              Device Access Check
            </CardTitle>
            <CardDescription>
              We need access to your camera and microphone for the interview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-blue-600" />
                  <span>Camera Access</span>
                  {deviceAccess.camera && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <Badge variant={deviceAccess.camera ? "default" : "secondary"}>
                  {deviceAccess.camera ? "Granted" : "Not Tested"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mic className="h-5 w-5 text-blue-600" />
                  <span>Microphone Access</span>
                  {deviceAccess.microphone && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <Badge variant={deviceAccess.microphone ? "default" : "secondary"}>
                  {deviceAccess.microphone ? "Granted" : "Not Tested"}
                </Badge>
              </div>

              <Button 
                onClick={testDeviceAccess} 
                disabled={isTestingDevices}
                variant="outline" 
                className="w-full"
              >
                {isTestingDevices ? "Testing..." : "Test Camera & Microphone"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Consent Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              Consent & Privacy
            </CardTitle>
            <CardDescription>
              Please review and consent to the following before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="recording-consent"
                  checked={consents.recording}
                  onCheckedChange={() => handleConsentChange('recording')}
                />
                <label htmlFor="recording-consent" className="text-sm leading-relaxed cursor-pointer">
                  <span className="font-medium">Video & Audio Recording:</span> I consent to having my video and audio recorded during this interview session for analysis purposes.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  id="analysis-consent"
                  checked={consents.analysis}
                  onCheckedChange={() => handleConsentChange('analysis')}
                />
                <label htmlFor="analysis-consent" className="text-sm leading-relaxed cursor-pointer">
                  <span className="font-medium">AI Analysis:</span> I consent to having my interview analyzed using AI technology to evaluate my responses, communication skills, and other relevant metrics.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  id="storage-consent"
                  checked={consents.storage}
                  onCheckedChange={() => handleConsentChange('storage')}
                />
                <label htmlFor="storage-consent" className="text-sm leading-relaxed cursor-pointer">
                  <span className="font-medium">Data Storage:</span> I consent to secure storage of my interview recording and analysis results for recruitment evaluation purposes.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  id="terms-consent"
                  checked={consents.terms}
                  onCheckedChange={() => handleConsentChange('terms')}
                />
                <label htmlFor="terms-consent" className="text-sm leading-relaxed cursor-pointer">
                  <span className="font-medium">Terms & Conditions:</span> I agree to the terms and conditions of the AI interview process and understand that this is part of the recruitment evaluation.
                </label>
              </div>
            </div>

            <Separator />

            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <strong>Privacy Assurance:</strong> Your interview data is encrypted and stored securely. It will only be used for recruitment evaluation purposes and will be handled in accordance with privacy regulations.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* What to Expect */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              What to Expect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">During the Interview:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• AI interviewer will ask relevant questions</li>
                  <li>• Real-time transcription will be displayed</li>
                  <li>• Natural conversation with AI agent</li>
                  <li>• Visual feedback during the session</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">After the Interview:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Comprehensive analysis report</li>
                  <li>• Skills and communication assessment</li>
                  <li>• Video recording with transcript</li>
                  <li>• Feedback and recommendations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="min-w-32"
          >
            Go Back
          </Button>
          
          <Button 
            onClick={startInterview}
            disabled={!isAllConsented || !deviceAccess.camera || !deviceAccess.microphone}
            className="min-w-48 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            {!deviceAccess.camera || !deviceAccess.microphone ? (
              "Test Devices First"
            ) : !isAllConsented ? (
              "Complete Consent"
            ) : (
              <>
                Start AI Interview
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {(!isAllConsented || !deviceAccess.camera || !deviceAccess.microphone) && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please complete device testing and provide all required consents to proceed with the interview.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

export default function InterviewConsentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <InterviewConsentContent />
    </Suspense>
  );
}