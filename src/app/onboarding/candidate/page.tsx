'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  User, 
  Brain, 
  Target, 
  CheckCircle,
  FileText,
  Video,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  X,
  AlertCircle
} from 'lucide-react';
import { useAIProcessing } from '@/hooks/useAIProcessing';
import { AIProcessingStatus } from '@/components/ai/AIProcessingStatus';
import { toast } from '@/hooks/use-toast';

type OnboardingStep = 'basic' | 'resume' | 'video' | 'complete';

interface CandidateProfile {
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  
  // Experience (will be filled by AI from resume)
  currentTitle: string;
  experience: string;
  skills: string[];
  education: string;
  
  // Resume & Portfolio
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  videoIntroUrl?: string;
  
  // Preferences
  jobTypes: string[];
  preferredLocations: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  availableFrom: string;
  remotePreference: string;
  
  // AI Generated
  aiSummary?: string;
  aiSkills?: string[];
  profileCompleteness: number;
}

const steps: { id: OnboardingStep; title: string; description: string }[] = [
  { id: 'basic', title: 'Basic Information & Preferences', description: 'Tell us about yourself and job preferences' },
  { id: 'resume', title: 'Resume Upload', description: 'Upload your resume for AI analysis' },
  { id: 'video', title: 'Video Introduction', description: 'Record a 10-second introduction' },
  { id: 'complete', title: 'Complete', description: 'All set!' }
];

const skillSuggestions = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'Go',
  'AWS', 'Docker', 'Kubernetes', 'Git', 'MongoDB', 'PostgreSQL', 'Redis',
  'Machine Learning', 'Data Analysis', 'UI/UX Design', 'Product Management',
  'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication'
];

const experienceLevels = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior Level (5-10 years)' },
  { value: 'lead', label: 'Lead/Principal (10+ years)' },
  { value: 'executive', label: 'Executive Level' }
];

const jobTypes = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' }
];

const remotePreferences = [
  { value: 'remote', label: 'Remote Only' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site Only' },
  { value: 'flexible', label: 'Flexible' }
];

export default function CandidateOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { startResumeProcessing, isProcessing, activeProcessing } = useAIProcessing();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('basic');
  const [profile, setProfile] = useState<CandidateProfile>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    location: '',
    currentTitle: '',
    experience: '',
    skills: [],
    education: '',
    jobTypes: [],
    preferredLocations: [],
    salaryRange: {
      min: 50000,
      max: 100000,
      currency: 'USD'
    },
    availableFrom: '',
    remotePreference: '',
    profileCompleteness: 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [resumeProcessed, setResumeProcessed] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('idle');
  const [aiProfileData, setAiProfileData] = useState<any>(null);

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Handle URL parameter to start at specific step
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam && ['basic', 'resume', 'video', 'complete'].includes(stepParam)) {
      setCurrentStep(stepParam as OnboardingStep);
    }
  }, [searchParams]);

  // Monitor AI processing completion
  useEffect(() => {
    const resumeProcessings = Array.from(activeProcessing.values())
      .filter(p => p.type === 'resume_processing');
    
    const completedProcessing = resumeProcessings.find(p => p.status === 'completed');
    if (completedProcessing && !resumeProcessed) {
      setResumeProcessed(true);
      setProcessingStage('completed');
    }
    
    const failedProcessing = resumeProcessings.find(p => p.status === 'failed');
    if (failedProcessing) {
      setProcessingStage('failed');
    }
  }, [activeProcessing, resumeProcessed]);

  // Redirect if user is not a candidate (but allow if role is undefined for new users)
  useEffect(() => {
    if (user && user.role && user.role !== 'candidate') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleNext = () => {
    // Don't allow moving to video step until resume is processed
    if (currentStep === 'resume' && !resumeProcessed) {
      toast({
        title: 'Please wait',
        description: 'Let our AI finish processing your resume before continuing.',
        variant: 'default'
      });
      return;
    }
    
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };
  
  const handleVideoUpload = async () => {
    try {
      // Simulate video upload to existing API
      const formData = new FormData();
      
      // Create a placeholder video blob (in real implementation, this would be from MediaRecorder)
      const videoBlob = new Blob(['placeholder video data'], { type: 'video/webm' });
      formData.append('video', videoBlob, 'intro-video.webm');
      formData.append('candidateId', user?.id || '');
      
      const response = await fetch('/api/candidates/video-intro', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Video upload failed');
      
      const result = await response.json();
      setVideoUrl(result.data.videoUrl);
      
      toast({
        title: 'Video recorded successfully!',
        description: 'Your introduction video has been saved.',
      });
      
    } catch (error) {
      console.error('Video upload error:', error);
      toast({
        title: 'Video upload failed',
        description: 'Please try recording again',
        variant: 'destructive'
      });
      setVideoUrl(null);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      
      try {
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('candidateId', user?.id || '');
        
        // Start AI processing using existing infrastructure
        await startResumeProcessing(file, user?.id || '');
        
        // Call the existing resume processing API
        const processingResponse = await fetch('/api/candidates/resume-process', {
          method: 'POST',
          body: formData
        });
        
        if (!processingResponse.ok) throw new Error('Resume processing failed');
        
        const result = await processingResponse.json();
        
        if (result.success) {
          // Update profile with AI-extracted data
          setProfile(prev => ({
            ...prev,
            resumeUrl: result.data.resumeUrl,
            aiSummary: result.data.summary,
            aiSkills: result.data.skills,
            // AI will fill these from resume
            currentTitle: result.data.currentTitle || prev.currentTitle,
            experience: result.data.experience || prev.experience,
            education: result.data.education || prev.education,
            skills: result.data.skills || prev.skills
          }));
          
          // Mark resume as processed
          setResumeProcessed(true);
          setProcessingStage('completed');
        }
        
        toast({
          title: 'Resume processed successfully!',
          description: 'AI has extracted your skills and experience. Your profile is being created...',
        });
        
      } catch (error) {
        console.error('Resume processing error:', error);
        toast({
          title: 'Processing failed',
          description: 'Please try uploading your resume again',
          variant: 'destructive'
        });
      }
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Save profile with AI-enhanced data
      const profileData = {
        ...profile,
        // Include video intro URL if recorded
        videoIntroUrl: videoUrl,
        // Mark as AI-processed
        aiProcessed: true,
        profileCompleteness: 95 // High completeness due to AI processing
      };
      
      const response = await fetch('/api/candidates/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) throw new Error('Failed to save profile');
      
      // Mark onboarding as complete
      await fetch('/api/candidates/onboarding/complete', {
        method: 'POST',
      });
      
      // Trigger AI profile generation if not already done
      if (profile.resumeUrl && !profile.aiSummary) {
        fetch('/api/candidates/ai-profile-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ candidateId: user?.id }),
        }).catch(console.error); // Don't block completion on this
      }
      
      toast({
        title: '🎉 Welcome to PersonaRecruit!',
        description: 'Your account and AI-enhanced profile are ready. Let\'s find your perfect job!',
      });
      
      router.push('/candidates/dashboard');
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Basic Information</h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, State/Country"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="currentTitle">Current Job Title</Label>
                  <Input
                    id="currentTitle"
                    value={profile.currentTitle}
                    onChange={(e) => setProfile(prev => ({ ...prev, currentTitle: e.target.value }))}
                    placeholder="e.g., Software Engineer, Product Manager"
                  />
                </div>
              </div>
            </div>
            
            {/* Job Preferences */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Job Preferences</h3>
              <div className="space-y-4">
                <div>
                  <Label>Job Types</Label>
                  <p className="text-sm text-gray-600 mb-3">Select all that apply</p>
                  <div className="grid grid-cols-2 gap-3">
                    {jobTypes.map(type => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.value}
                          checked={profile.jobTypes.includes(type.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setProfile(prev => ({ ...prev, jobTypes: [...prev.jobTypes, type.value] }));
                            } else {
                              setProfile(prev => ({ ...prev, jobTypes: prev.jobTypes.filter(t => t !== type.value) }));
                            }
                          }}
                        />
                        <Label htmlFor={type.value} className="text-sm">{type.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Remote Work Preference</Label>
                  <Select 
                    value={profile.remotePreference} 
                    onValueChange={(value) => setProfile(prev => ({ ...prev, remotePreference: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {remotePreferences.map(pref => (
                        <SelectItem key={pref.value} value={pref.value}>
                          {pref.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Salary Range (USD)</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="minSalary" className="text-sm">Minimum</Label>
                      <Input
                        id="minSalary"
                        type="number"
                        value={profile.salaryRange.min}
                        onChange={(e) => setProfile(prev => ({ 
                          ...prev, 
                          salaryRange: { ...prev.salaryRange, min: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxSalary" className="text-sm">Maximum</Label>
                      <Input
                        id="maxSalary"
                        type="number"
                        value={profile.salaryRange.max}
                        onChange={(e) => setProfile(prev => ({ 
                          ...prev, 
                          salaryRange: { ...prev.salaryRange, max: parseInt(e.target.value) || 0 }
                        }))}
                        placeholder="100000"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="availableFrom">Available From</Label>
                  <Input
                    id="availableFrom"
                    type="date"
                    value={profile.availableFrom}
                    onChange={(e) => setProfile(prev => ({ ...prev, availableFrom: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
        
      case 'resume':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Upload Your Resume
              </h3>
              <p className="text-gray-600">
                Our AI will analyze your resume and automatically create your candidate profile with extracted skills, experience, and professional summary.
              </p>
            </div>
            
            <div>
              <Label htmlFor="resume">Resume Upload</Label>
              <p className="text-sm text-gray-600 mb-3">
                Upload your resume for AI-powered Document AI analysis
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="resume"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <label htmlFor="resume" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700">
                    {resumeFile ? resumeFile.name : 'Click to upload resume'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, DOC, DOCX files
                  </p>
                </label>
              </div>
            </div>
            
            {isProcessing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
                  <span className="font-medium text-blue-900">AI Document AI Processing...</span>
                </div>
                <p className="text-sm text-blue-700">
                  Our AI is analyzing your resume using Google Document AI to extract skills, experience, education, and create a professional summary for your profile.
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  Processing pipeline: Document AI → Skill Extraction → Profile Generation → Vector Embeddings
                </div>
              </div>
            )}
            
            {resumeFile && !isProcessing && resumeProcessed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Resume Processed Successfully!</span>
                </div>
                <p className="text-sm text-green-700">
                  Your resume has been analyzed and your profile information has been extracted.
                </p>
              </div>
            )}
            
            {processingStage === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-900">Processing Failed</span>
                </div>
                <p className="text-sm text-red-700">
                  Something went wrong while processing your resume. Please try uploading again.
                </p>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">🤖 AI Processing Pipeline:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Document AI extracts text from your resume</li>
                <li>• Gemini AI analyzes and categorizes your experience</li>
                <li>• Skills are automatically identified and tagged</li>
                <li>• Professional summary is generated (3-5 sentences)</li>
                <li>• Vector embeddings enable smart job matching</li>
                <li>• Your profile is created and ready for employers</li>
              </ul>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="portfolio">Portfolio URL (Optional)</Label>
                <Input
                  id="portfolio"
                  value={profile.portfolioUrl}
                  onChange={(e) => setProfile(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                  placeholder="https://your-portfolio.com"
                />
              </div>
              
              <div>
                <Label htmlFor="linkedin">LinkedIn Profile (Optional)</Label>
                <Input
                  id="linkedin"
                  value={profile.linkedinUrl}
                  onChange={(e) => setProfile(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  placeholder="https://linkedin.com/in/your-profile"
                />
              </div>
            </div>
          </div>
        );
        
      case 'video':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Record Your Video Introduction
              </h3>
              <p className="text-gray-600">
                Record a 10-second video introduction to help employers get to know you better.
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex flex-col items-center space-y-4">
                {!videoUrl ? (
                  <div className="w-full max-w-md">
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Camera preview will appear here</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      {!isRecording ? (
                        <Button
                          onClick={() => {
                            setIsRecording(true);
                            setRecordingTime(0);
                            // Start recording timer
                            const timer = setInterval(() => {
                              setRecordingTime(prev => {
                                if (prev >= 9) {
                                  clearInterval(timer);
                                  setIsRecording(false);
                                  // Simulate video upload to /api/candidates/video-intro
                                  handleVideoUpload();
                                  return 10;
                                }
                                return prev + 1;
                              });
                            }, 1000);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Start Recording
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-red-600">
                            {10 - recordingTime}s
                          </div>
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                            <span className="text-red-600 font-medium">Recording...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-md">
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                      <div className="text-center">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                        <p className="text-green-600 font-medium">Video recorded successfully!</p>
                        <p className="text-gray-500 text-sm mt-1">10 seconds</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center space-x-2">
                      <Button
                        onClick={() => {
                          setVideoUrl(null);
                          setRecordingTime(0);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Record Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Tips for a Great Video Introduction:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Look directly at the camera and smile</li>
                <li>• Introduce yourself and mention your current role</li>
                <li>• Keep it concise - you have 10 seconds</li>
                <li>• Record in a quiet, well-lit environment</li>
                <li>• Be authentic and let your personality shine</li>
              </ul>
            </div>
          </div>
        );
        
      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                🎉 Welcome to PersonaRecruit!
              </h3>
              <p className="text-gray-600">
                Your account and AI-enhanced profile are complete! Our AI has processed your resume and created a comprehensive profile for employers to view.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-2">Your Profile Includes:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• AI-generated professional summary from your resume</li>
                <li>• Extracted skills and experience levels</li>
                <li>• Job preferences and salary expectations</li>
                <li>• Video introduction for employers</li>
                <li>• Contact information and availability</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-green-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• AI will start matching you with relevant job opportunities</li>
                <li>• You'll receive notifications for new job matches</li>
                <li>• Access your dashboard to manage applications</li>
                <li>• Start applying to jobs with one-click applications</li>
                <li>• Use AI-powered interview preparation tools</li>
              </ul>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {currentStep === 'resume' || currentStep === 'video' ? 'Complete Your Profile' : 'Complete Your Account Setup'}
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            {currentStep === 'resume' || currentStep === 'video'
              ? 'Upload your resume and record a video introduction to complete your profile'
              : 'Finish setting up your account and let our AI create your perfect candidate profile'
            }
          </p>
        </div>
        
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-8">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className={`flex items-center space-x-2 ${
                  index <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStepIndex 
                    ? 'bg-blue-600 text-white' 
                    : index === currentStepIndex 
                      ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' 
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {index < currentStepIndex ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 'basic' && <User className="w-5 h-5" />}
              {currentStep === 'resume' && <FileText className="w-5 h-5" />}
              {currentStep === 'video' && <Video className="w-5 h-5" />}
              {currentStep === 'complete' && <CheckCircle className="w-5 h-5" />}
              {steps.find(s => s.id === currentStep)?.title}
            </CardTitle>
            <p className="text-gray-600">
              {steps.find(s => s.id === currentStep)?.description}
            </p>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>
        
        {/* AI Processing Status */}
        {isProcessing && (
          <div className="mt-6">
            <AIProcessingStatus />
          </div>
        )}
        
        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex space-x-4">
            {currentStep !== 'complete' && (
              <Button 
                variant="outline"
                onClick={() => setCurrentStep('complete')}
              >
                Skip for now
              </Button>
            )}
            
            {currentStep === 'complete' ? (
              <Button 
                onClick={handleComplete}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Complete Account Setup
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                disabled={currentStep === 'resume' && !resumeProcessed}
                className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 ${
                  currentStep === 'resume' && !resumeProcessed ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {currentStep === 'resume' && !resumeProcessed ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}