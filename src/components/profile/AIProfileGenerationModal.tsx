"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Loader2,
  Info,
  Sparkles,
  FileCheck,
  User,
  Award,
  MapPin,
  Briefcase,
  Star
} from 'lucide-react';

interface AIProfileGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type GenerationStep = 'upload' | 'processing' | 'complete';

export default function AIProfileGenerationModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: AIProfileGenerationModalProps) {
  const [currentStep, setCurrentStep] = useState<GenerationStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [generatedProfile, setGeneratedProfile] = useState<any>(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, getToken } = useAuth();
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setIsProcessing(false);
    setProcessingStage('');
    setProgress(0);
    setGeneratedProfile(null);
    setError('');
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a PDF, DOC, or DOCX file.');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 5MB.');
      return;
    }

    setSelectedFile(file);
    setError('');
  }, []);

  const handleGenerateProfile = useCallback(async () => {
    if (!selectedFile || !user) return;

    setIsProcessing(true);
    setCurrentStep('processing');
    setError('');

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('resume', selectedFile);

      // Step 1: Upload and process resume
      setProcessingStage('Uploading resume...');
      setProgress(20);

      const response = await fetch('/api/candidates/ai-profile-generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate profile');
      }

      const result = await response.json();

      // Simulate processing stages for UX
      setProcessingStage('Extracting text from resume...');
      setProgress(40);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStage('Generating professional summary...');
      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStage('Extracting skills and experience...');
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStage('Finalizing profile...');
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      setGeneratedProfile(result.data);
      setCurrentStep('complete');

      toast({
        title: 'Profile Generated Successfully!',
        description: 'Your AI-generated profile is ready to review.',
      });

      onSuccess?.();

    } catch (error) {
      console.error('Profile generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate profile');
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, user, getToken, toast, onSuccess]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Generate Your Profile with AI</h3>
        <p className="text-muted-foreground">
          Upload your resume and let our AI create a comprehensive profile with professional summary, skills, and experience.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="space-y-2">
              <FileCheck className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Change File
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Select Resume
              </Button>
              <p className="text-sm text-muted-foreground">
                PDF, DOC, or DOCX up to 5MB
              </p>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">AI will extract:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Professional summary</li>
                <li>• Skills and competencies</li>
                <li>• Experience level</li>
                <li>• Contact information</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleGenerateProfile}
          disabled={!selectedFile || isProcessing}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Profile
        </Button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Generating Your Profile</h3>
        <p className="text-muted-foreground">
          Our AI is analyzing your resume and creating your professional profile...
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{processingStage}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing may take 30-60 seconds...</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Profile Generated Successfully!</h3>
        <p className="text-muted-foreground">
          Your AI-generated profile is ready. You can review and edit it anytime.
        </p>
      </div>

      {generatedProfile && (
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            {generatedProfile.summary && (
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Professional Summary</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {generatedProfile.summary}
                  </p>
                </div>
              </div>
            )}
            
            {generatedProfile.skills && generatedProfile.skills.length > 0 && (
              <div className="flex items-start space-x-3">
                <Star className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Skills Extracted</p>
                  <p className="text-sm text-muted-foreground">
                    {generatedProfile.skills.length} skills identified
                  </p>
                </div>
              </div>
            )}
            
            {generatedProfile.currentTitle && (
              <div className="flex items-start space-x-3">
                <Briefcase className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Current Title</p>
                  <p className="text-sm text-muted-foreground">
                    {generatedProfile.currentTitle}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Your profile has been updated with AI-generated content. You can edit and customize it in your profile settings.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>
        <Button onClick={handleClose}>
          <CheckCircle className="w-4 h-4 mr-2" />
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Profile Generation</DialogTitle>
          <DialogDescription>
            Create your professional profile automatically using AI
          </DialogDescription>
        </DialogHeader>
        
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'processing' && renderProcessingStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </DialogContent>
    </Dialog>
  );
}