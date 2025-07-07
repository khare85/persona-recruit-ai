
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Briefcase, 
  Star, 
  Link,
  X,
  Plus,
  FileText,
  Video,
  CheckCircle,
  Upload,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';

const candidateRegistrationSchema = z.object({
  // Step 1: Basic Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  phone: z.string().optional(),
  location: z.string().min(2, 'Location is required'),
  
  // Step 2: Resume Upload (optional initially, will be required)
  resumeFile: z.instanceof(File).optional(),
  
  // Step 3: Video Recording & Terms
  videoRecording: z.instanceof(Blob).optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type CandidateRegistrationData = z.infer<typeof candidateRegistrationSchema>;


export default function CandidateRegistrationPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const form = useForm<CandidateRegistrationData>({
    resolver: zodResolver(candidateRegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      location: '',
      termsAccepted: false
    }
  });

  // File upload handler
  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.includes('word')) {
        setResumeFile(file);
        toast({
          title: "Resume uploaded!",
          description: "Your resume will be processed to extract your profile information."
        });
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document.",
          variant: "destructive"
        });
      }
    }
  };

  // Video recording functions
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const startRecording = async () => {
    try {
      console.log('Starting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      console.log('Camera stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        console.log('Setting video element srcObject');
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to load metadata before playing
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, attempting to play');
          videoRef.current?.play().catch(e => {
            console.error('Video play error:', e);
          });
        };
        
        // Force play attempt after a short delay
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(e => {
              console.error('Delayed video play error:', e);
            });
          }
        }, 100);
      }
      
      // Don't start recording immediately, just show the camera feed
      console.log('Camera stream is ready, not starting recording yet');
      
    } catch (error) {
      console.error('Recording error:', error);
      let errorMessage = "Please allow camera access to record your video introduction.";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera access was denied. Please check your browser permissions.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found. Please ensure your device has a camera.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Camera is being used by another application.";
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  
  const actuallyStartRecording = () => {
    if (!stream) {
      console.error('No stream available for recording');
      return;
    }
    
    try {
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          stopRecording();
        }
      }, 10000);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      console.log('Recording stopped');
    }
  };
  
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      console.log('Camera stopped');
    }
  };
  
  const resetRecording = () => {
    setVideoBlob(null);
    setRecordingTime(0);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };
  
  // Timer for recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Handle video element setup when stream changes
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log('Setting up video element with stream');
      videoRef.current.srcObject = stream;
      
      // Force play
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
          console.log('Video playing successfully');
        } catch (error) {
          console.error('Failed to play video:', error);
        }
      };
      
      playVideo();
    }
  }, [stream]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        console.log('Cleaning up video stream');
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
      }
    };
  }, [stream]);

  const handleRegistration = async (data: CandidateRegistrationData) => {
    try {
      setIsRegistering(true);
      
      // Create user with Firebase Auth
      await signUp(data.email, data.password, `${data.firstName} ${data.lastName}`, 'candidate');
      
      // Firebase Auth handles authentication automatically
      console.log('User registered successfully with Firebase Auth');
      
      // TODO: Create candidate profile in Firestore (should be handled by Cloud Function on user creation)
      // TODO: Upload resume and video to Firebase Storage
      // TODO: Process resume with Document AI to update profile
      
      toast({
        title: "🎉 Registration Successful!",
        description: redirectUrl ? "Welcome to the platform! Redirecting you to apply for the job." : "Welcome to the platform! Your profile will be created from your resume."
      });

      // Redirect to provided URL or dashboard
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/candidate/dashboard');
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      // Validate basic info
      const basicFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'location'];
      const hasErrors = basicFields.some(field => {
        const error = form.formState.errors[field as keyof CandidateRegistrationData];
        return error !== undefined;
      });
      
      if (hasErrors) {
        toast({
          title: "Please fix the errors",
          description: "Complete all required fields before proceeding.",
          variant: "destructive"
        });
        return;
      }
    } else if (currentStep === 2) {
      // Check if resume is uploaded
      if (!resumeFile) {
        toast({
          title: "Resume required",
          description: "Please upload your resume to continue.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const canProceedToFinal = () => {
    return videoBlob !== null && form.getValues('termsAccepted');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <User className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join as a Candidate</CardTitle>
          <CardDescription>
            Create your profile to discover amazing job opportunities
          </CardDescription>
          
          {/* Progress Steps */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step <= currentStep 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step < currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-0.5 ml-2 ${
                      step < currentStep ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground mt-2">
            Step {currentStep} of 3: {
              currentStep === 1 ? 'Basic Information' :
              currentStep === 2 ? 'Resume Upload' :
              'Video Introduction & Terms'
            }
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRegistration)} className="space-y-6">
              
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="john.doe@example.com" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input type="password" placeholder="Enter password" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input type="password" placeholder="Confirm password" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="+1 (555) 123-4567" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="San Francisco, CA" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Resume Upload */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Upload Your Resume</h3>
                    <p className="text-muted-foreground">
                      Upload your resume and we'll use AI to extract your professional information
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                    <div className="text-center">
                      {resumeFile ? (
                        <div className="space-y-4">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                          <div>
                            <p className="font-medium">{resumeFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setResumeFile(null)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                          <div>
                            <p className="font-medium">Drop your resume here or click to upload</p>
                            <p className="text-sm text-muted-foreground">
                              PDF or Word documents only, up to 10MB
                            </p>
                          </div>
                          <div>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleResumeUpload}
                              className="hidden"
                              id="resume-upload"
                            />
                            <Button type="button" asChild>
                              <label htmlFor="resume-upload" className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                Choose File
                              </label>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {resumeFile && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-blue-900">Resume uploaded successfully!</p>
                          <p className="text-blue-700">
                            Our AI will process your resume to automatically fill your profile with your experience, skills, and education.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Step 3: Video Introduction & Terms */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Record Your Video Introduction</h3>
                    <p className="text-muted-foreground">
                      Record a 10-second video introduction to help employers get to know you
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <div className="text-center space-y-4">
                      {!videoBlob ? (
                        <div className="space-y-4">
                          {stream ? (
                            <div className="relative">
                              <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                controls={false}
                                className="w-full max-w-md mx-auto rounded-lg"
                                style={{ 
                                  height: '300px', 
                                  width: '400px',
                                  objectFit: 'cover',
                                  backgroundColor: '#000',
                                  border: '2px solid #ccc'
                                }}
                                onLoadedMetadata={() => console.log('Video element metadata loaded')}
                                onCanPlay={() => console.log('Video can play')}
                                onPlay={() => console.log('Video started playing')}
                                onError={(e) => console.error('Video element error:', e)}
                              />
                              {isRecording && (
                                <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                                  REC {recordingTime}s
                                </div>
                              )}
                            </div>
                          ) : (
                            <Video className="h-16 w-16 text-muted-foreground mx-auto" />
                          )}
                          
                          <div>
                            <p className="font-medium mb-2">
                              {stream ? (
                                isRecording ? `Recording... ${recordingTime}s` : 'Camera is ready - Click "Start Recording" below'
                              ) : (
                                'Click "Start Recording" to access your camera'
                              )}
                            </p>
                            {stream && (
                              <p className="text-xs text-green-600 mb-2">
                                ✓ Camera access granted. You should see your video above.
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Introduce yourself briefly in 10 seconds
                            </p>
                          </div>

                          <div className="flex gap-2 justify-center flex-wrap">
                            {!stream ? (
                              <>
                                <Button type="button" onClick={startRecording}>
                                  <Video className="h-4 w-4 mr-2" />
                                  Start Recording
                                </Button>
                                <Button type="button" variant="outline" onClick={async () => {
                                  try {
                                    console.log('Testing camera access...');
                                    const testStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                                    console.log('Camera test successful:', testStream);
                                    if (videoRef.current) {
                                      videoRef.current.srcObject = testStream;
                                      await videoRef.current.play();
                                    }
                                    setTimeout(() => {
                                      testStream.getTracks().forEach(track => track.stop());
                                    }, 3000);
                                  } catch (e) {
                                    console.error('Camera test failed:', e);
                                    alert('Camera test failed: ' + (e as Error).message);
                                  }
                                }}>
                                  Test Camera
                                </Button>
                              </>
                            ) : isRecording ? (
                              <Button type="button" variant="destructive" onClick={stopRecording}>
                                <Square className="h-4 w-4 mr-2" />
                                Stop Recording
                              </Button>
                            ) : (
                              <div className="flex gap-2">
                                <Button type="button" onClick={actuallyStartRecording}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Start Recording
                                </Button>
                                <Button type="button" variant="outline" onClick={() => {
                                  stopCamera();
                                  setVideoBlob(null);
                                }}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Reset Camera
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                          <div>
                            <p className="font-medium">Video recorded successfully!</p>
                            <p className="text-sm text-muted-foreground">
                              You can re-record if you'd like to make changes
                            </p>
                          </div>
                          <Button type="button" variant="outline" onClick={resetRecording}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Record Again
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to the Terms of Service and Privacy Policy
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                  >
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isRegistering || !canProceedToFinal()}>
                    {isRegistering ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>

          <div className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/auth')}>
              Sign in here
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
