
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function ResumeUploadContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      
      const formData = new FormData();
      formData.append('resume', selectedFile);

      setUploadProgress(30);

      const token = await user?.getIdToken();
      if (!token) throw new Error("Authentication failed");

      const response = await fetch('/api/candidates/resume-process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress(70);

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadProgress(100);

      toast({
        title: "✅ Resume Processed!",
        description: "Your resume has been uploaded and analyzed."
      });

      setTimeout(() => {
        router.push('/candidates/onboarding/video-intro');
      }, 1500);

    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
      setIsUploading(false);
    }
  };

  const skipResumeUpload = () => {
    if (confirm('Are you sure you want to skip resume upload? You can add it later, but AI profile generation will be limited.')) {
      router.push('/candidates/onboarding/video-intro');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <FileText className="h-12 w-12 text-primary" />
              {selectedFile && (
                <CheckCircle className="h-5 w-5 text-green-500 absolute -bottom-1 -right-1" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">Upload Your Resume</CardTitle>
          <CardDescription>
            Step 2 of 3: Upload your resume for AI-powered profile generation
          </CardDescription>
          <div className="mt-4">
            <Progress value={33.33} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">Step 2 of 3</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
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
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Your Resume</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your resume here, or click to browse
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
              <p className="text-xs text-muted-foreground mt-2">
                Supports PDF, DOC, and DOCX files (max 5MB)
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-6">
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
                <span>Processing Resume...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <div className="flex gap-3 justify-between">
            <Button 
              variant="outline" 
              onClick={skipResumeUpload}
              disabled={isUploading}
            >
              Skip for Now
            </Button>
            
            <Button 
              onClick={uploadResume} 
              disabled={!selectedFile || isUploading}
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Upload & Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResumeUploadPage() {
  return (
    <ProtectedRoute requiredRole="candidate" redirectTo="/auth/login">
      <ResumeUploadContent />
    </ProtectedRoute>
  );
}
