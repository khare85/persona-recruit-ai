'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  X
} from 'lucide-react';
import { useAIProcessing } from '@/hooks/useAIProcessing';
import { AIProcessingStatus } from '@/components/ai/AIProcessingStatus';
import { toast } from '@/hooks/use-toast';

type OnboardingStep = 'basic' | 'experience' | 'resume' | 'preferences' | 'complete';

interface CandidateProfile {
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  
  // Experience
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
  { id: 'basic', title: 'Basic Information', description: 'Tell us about yourself' },
  { id: 'experience', title: 'Experience & Skills', description: 'Share your background' },
  { id: 'resume', title: 'Resume & Portfolio', description: 'Upload your documents' },
  { id: 'preferences', title: 'Job Preferences', description: 'What are you looking for?' },
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
  const { user } = useAuth();
  const { startResumeProcessing, isProcessing } = useAIProcessing();
  
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

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Redirect if user is not a candidate
  useEffect(() => {
    if (user && user.role !== 'candidate') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleNext = () => {
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

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      
      // Simulate file upload and AI processing
      try {
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('candidateId', user?.id || '');
        
        // Upload file first
        const uploadResponse = await fetch('/api/upload/resume', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) throw new Error('Upload failed');
        
        const uploadResult = await uploadResponse.json();
        const resumeUrl = uploadResult.data.url;
        
        // Start AI processing
        await startResumeProcessing(resumeUrl, user?.id || '');
        
        setProfile(prev => ({
          ...prev,
          resumeUrl
        }));
        
        toast({
          title: 'Resume uploaded successfully',
          description: 'AI is processing your resume to extract skills and experience...',
        });
        
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: 'Please try again',
          variant: 'destructive'
        });
      }
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Save profile
      const response = await fetch('/api/candidates/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });
      
      if (!response.ok) throw new Error('Failed to save profile');
      
      // Mark onboarding as complete
      await fetch('/api/candidates/onboarding/complete', {
        method: 'POST',
      });
      
      toast({
        title: 'Profile completed!',
        description: 'Welcome to PersonaRecruit. Let\'s find your perfect job!',
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
        );
        
      case 'experience':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="currentTitle">Current/Most Recent Job Title</Label>
              <Input
                id="currentTitle"
                value={profile.currentTitle}
                onChange={(e) => setProfile(prev => ({ ...prev, currentTitle: e.target.value }))}
                placeholder="e.g., Software Engineer, Product Manager"
              />
            </div>
            
            <div>
              <Label htmlFor="experience">Experience Level</Label>
              <Select 
                value={profile.experience} 
                onValueChange={(value) => setProfile(prev => ({ ...prev, experience: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="education">Education</Label>
              <Input
                id="education"
                value={profile.education}
                onChange={(e) => setProfile(prev => ({ ...prev, education: e.target.value }))}
                placeholder="e.g., Bachelor's in Computer Science, MBA"
              />
            </div>
            
            <div>
              <Label>Skills</Label>
              <p className="text-sm text-gray-600 mb-3">Select skills that match your experience</p>
              <div className="flex flex-wrap gap-2">
                {skillSuggestions.map(skill => (
                  <Badge
                    key={skill}
                    variant={profile.skills.includes(skill) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => handleSkillToggle(skill)}
                  >
                    {skill}
                    {profile.skills.includes(skill) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'resume':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="resume">Resume Upload</Label>
              <p className="text-sm text-gray-600 mb-3">
                Upload your resume for AI-powered analysis and skill extraction
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
                  <span className="font-medium text-blue-900">AI Processing Resume...</span>
                </div>
                <p className="text-sm text-blue-700">
                  Our AI is analyzing your resume to extract skills, experience, and create a professional summary.
                </p>
              </div>
            )}
            
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
        );
        
      case 'preferences':
        return (
          <div className="space-y-6">
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
                    <Label htmlFor={type.value}>{type.label}</Label>
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
        );
        
      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to PersonaRecruit!
              </h3>
              <p className="text-gray-600">
                Your profile is ready. Our AI will start matching you with perfect opportunities.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• AI will analyze your profile and suggest job matches</li>
                <li>• You'll receive real-time notifications for new opportunities</li>
                <li>• Start applying to jobs with one-click applications</li>
                <li>• Access AI-powered interview preparation tools</li>
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
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Help us understand your background to find perfect job matches
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
              {currentStep === 'experience' && <GraduationCap className="w-5 h-5" />}
              {currentStep === 'resume' && <FileText className="w-5 h-5" />}
              {currentStep === 'preferences' && <Target className="w-5 h-5" />}
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
                Complete Profile
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}