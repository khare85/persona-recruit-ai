'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Bot, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Download,
  Zap
} from 'lucide-react';

interface ProcessingStep {
  name: string;
  icon: React.ElementType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  description: string;
}

interface ResumeUploadProps {
  onUploadComplete?: (result: any) => void;
}

export function ResumeUploadWithProcessing({ onUploadComplete }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    {
      name: 'File Upload',
      icon: Upload,
      status: 'pending',
      description: 'Uploading resume to secure storage with UUID'
    },
    {
      name: 'Text Extraction',
      icon: FileText,
      status: 'pending',
      description: 'Extracting text content using Google Document AI'
    },
    {
      name: 'AI Embeddings',
      icon: Bot,
      status: 'pending',
      description: 'Generating vector embeddings with Vertex AI'
    },
    {
      name: 'Vector Search',
      icon: Search,
      status: 'pending',
      description: 'Enabling AI-powered candidate matching'
    }
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setWarnings([]);
      setUploadResult(null);
      // Reset processing steps
      setProcessingSteps(steps => steps.map(step => ({ ...step, status: 'pending' })));
    }
  };

  const updateStepStatus = (stepName: string, status: ProcessingStep['status']) => {
    setProcessingSteps(steps => 
      steps.map(step => 
        step.name === stepName ? { ...step, status } : step
      )
    );
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setWarnings([]);

    try {
      // Start file upload step
      updateStepStatus('File Upload', 'processing');

      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/candidates/resume', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update steps based on result
      updateStepStatus('File Upload', 'completed');
      
      if (result.data?.aiFeatures?.textExtraction) {
        updateStepStatus('Text Extraction', 'completed');
      } else {
        updateStepStatus('Text Extraction', 'failed');
      }

      if (result.data?.aiFeatures?.embeddingGeneration) {
        updateStepStatus('AI Embeddings', 'completed');
      } else {
        updateStepStatus('AI Embeddings', 'failed');
      }

      if (result.data?.aiFeatures?.vectorSearch) {
        updateStepStatus('Vector Search', 'completed');
      } else {
        updateStepStatus('Vector Search', 'failed');
      }

      setUploadResult(result.data);
      setWarnings(result.warnings || []);
      
      if (onUploadComplete) {
        onUploadComplete(result.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      updateStepStatus('File Upload', 'failed');
    } finally {
      setIsUploading(false);
    }
  };

  const getStepIcon = (step: ProcessingStep) => {
    const IconComponent = step.icon;
    
    switch (step.status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <IconComponent className="h-4 w-4 text-gray-400" />;
    }
  };

  const getOverallProgress = () => {
    const completed = processingSteps.filter(step => step.status === 'completed').length;
    return (completed / processingSteps.length) * 100;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          AI-Powered Resume Upload
        </CardTitle>
        <CardDescription>
          Upload your resume for AI-powered text extraction, embedding generation, and vector search capabilities
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Select your resume (PDF, DOC, DOCX - max 5MB)
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="resume-upload"
                disabled={isUploading}
              />
              <label htmlFor="resume-upload">
                <Button variant="outline" disabled={isUploading} asChild>
                  <span className="cursor-pointer">Choose File</span>
                </Button>
              </label>
            </div>
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
              <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        {/* Upload Button */}
        {file && !uploadResult && (
          <Button 
            onClick={handleUpload} 
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Resume...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Process Resume
              </>
            )}
          </Button>
        )}

        {/* Processing Steps */}
        {isUploading && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing Progress</span>
                <span>{Math.round(getOverallProgress())}%</span>
              </div>
              <Progress value={getOverallProgress()} className="w-full" />
            </div>

            <div className="space-y-3">
              {processingSteps.map((step, index) => (
                <div key={step.name} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{step.name}</span>
                      {step.status === 'completed' && (
                        <Badge variant="secondary" className="text-xs">
                          Completed
                        </Badge>
                      )}
                      {step.status === 'failed' && (
                        <Badge variant="destructive" className="text-xs">
                          Failed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {uploadResult && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Resume uploaded successfully! AI features status:
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Text Extraction</span>
                  {uploadResult.aiFeatures?.textExtraction ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">AI Embeddings</span>
                  {uploadResult.aiFeatures?.embeddingGeneration ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Vector Search</span>
                  {uploadResult.vectorSearchEnabled ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">File Storage</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>

            {uploadResult.resumeUrl && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Resume URL:</strong> {uploadResult.fileName}
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Storage:</strong> Secure Firebase Storage with UUID
                </p>
              </div>
            )}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Some AI features may be limited:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}