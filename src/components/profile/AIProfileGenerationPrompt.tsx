"use client";

import React, { useState } from 'react';
import { useAIProfileGeneration } from '@/hooks/useAIProfileGeneration';
import AIProfileGenerationModal from './AIProfileGenerationModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  User, 
  Star, 
  FileText, 
  ArrowRight, 
  Info,
  CheckCircle,
  Upload
} from 'lucide-react';

interface AIProfileGenerationPromptProps {
  showAsCard?: boolean;
  className?: string;
}

export default function AIProfileGenerationPrompt({ 
  showAsCard = true, 
  className = '' 
}: AIProfileGenerationPromptProps) {
  const { status, loading, hidePopup, refreshStatus } = useAIProfileGeneration();
  const [showModal, setShowModal] = useState(false);

  // Don't show if user doesn't need it
  if (loading || !status.showPopup) {
    return null;
  }

  const handleGenerateProfile = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    hidePopup();
    refreshStatus();
  };

  const handleDismiss = () => {
    hidePopup();
  };

  const content = (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          Generate Your Profile with AI
        </h3>
        <p className="text-muted-foreground">
          Upload your resume and let our AI create a comprehensive professional profile for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="font-medium text-sm mb-1">1. Upload Resume</p>
          <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="font-medium text-sm mb-1">2. AI Analysis</p>
          <p className="text-xs text-muted-foreground">Extract skills & experience</p>
        </div>
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <User className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="font-medium text-sm mb-1">3. Profile Ready</p>
          <p className="text-xs text-muted-foreground">Complete professional profile</p>
        </div>
      </div>

      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          <strong>AI will automatically extract:</strong>
          <ul className="list-disc ml-5 mt-2 space-y-1 text-sm">
            <li>Professional summary</li>
            <li>Skills and competencies</li>
            <li>Experience level</li>
            <li>Contact information</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          onClick={handleGenerateProfile}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Generate Profile with AI
        </Button>
        <Button 
          variant="outline" 
          onClick={handleDismiss}
          size="lg"
        >
          Maybe Later
        </Button>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          You can always generate your profile later from your dashboard
        </p>
      </div>
    </div>
  );

  if (showAsCard) {
    return (
      <>
        <Card className={`border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 ${className}`}>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Profile Generation
            </CardTitle>
            <CardDescription>
              Create your professional profile instantly with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            {content}
          </CardContent>
        </Card>

        <AIProfileGenerationModal 
          isOpen={showModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className={`p-6 rounded-lg border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 ${className}`}>
        {content}
      </div>

      <AIProfileGenerationModal 
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}