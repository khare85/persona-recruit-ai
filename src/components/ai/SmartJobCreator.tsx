/**
 * Smart Job Creator Component
 * AI-powered job creation with intelligent suggestions
 */

'use client';

import React, { useState, useCallback, useEffect, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wand2, 
  Sparkles, 
  Target, 
  Users, 
  Briefcase,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useAIJobGeneration } from '@/hooks/useAIProcessing';

interface SmartJobCreatorProps {
  onJobCreated?: (jobData: any) => void;
  initialData?: any;
}

const SmartJobCreator = memo(({ onJobCreated, initialData }: SmartJobCreatorProps) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'full-time',
    experienceLevel: 'mid',
    department: '',
    salary: '',
    description: '',
    requirements: [] as string[],
    responsibilities: [] as string[],
    benefits: [] as string[],
    skills: [] as string[],
    ...initialData
  });

  const [suggestions, setSuggestions] = useState<{
    requirements: string[];
    responsibilities: string[];
    skills: string[];
    benefits: string[];
  }>({
    requirements: [],
    responsibilities: [],
    skills: [],
    benefits: []
  });

  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState('');
  
  const { 
    generateJobDescription, 
    generateJobRequirements, 
    generateSkills,
    isGenerating, 
    progress 
  } = useAIJobGeneration();

  /**
   * Generate AI suggestions based on job title and company
   */
  const generateSuggestions = useCallback(async () => {
    if (!formData.title || !formData.company) return;

    try {
      const [requirements, skills] = await Promise.all([
        generateJobRequirements({
          title: formData.title,
          company: formData.company,
          experienceLevel: formData.experienceLevel,
          department: formData.department
        }),
        generateSkills({
          title: formData.title,
          experienceLevel: formData.experienceLevel,
          department: formData.department
        })
      ]);

      setSuggestions(prev => ({
        ...prev,
        requirements: requirements.requirements || [],
        responsibilities: requirements.responsibilities || [],
        skills: skills || [],
        benefits: requirements.benefits || []
      }));
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  }, [formData.title, formData.company, formData.experienceLevel, formData.department, generateJobRequirements, generateSkills]);

  /**
   * Generate complete job description
   */
  const handleGenerateDescription = useCallback(async () => {
    setIsGeneratingDescription(true);
    
    try {
      const description = await generateJobDescription(formData);
      setGeneratedDescription(description);
      setFormData(prev => ({ ...prev, description }));
    } catch (error) {
      console.error('Failed to generate description:', error);
    } finally {
      setIsGeneratingDescription(false);
    }
  }, [formData, generateJobDescription]);

  /**
   * Add suggestion to form data
   */
  const addSuggestion = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field as keyof typeof prev] as string[]), value]
    }));
  }, []);

  /**
   * Remove item from array field
   */
  const removeItem = useCallback((field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (onJobCreated) {
      onJobCreated(formData);
    }
  }, [formData, onJobCreated]);

  /**
   * Generate suggestions when key fields change
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateSuggestions();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [generateSuggestions]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Information
          </CardTitle>
          <CardDescription>
            Basic job details. AI will suggest requirements and skills as you type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Senior Software Engineer"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="e.g., Tech Corp"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., San Francisco, CA"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="type">Job Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            <div>
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <select
                id="experienceLevel"
                value={formData.experienceLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Generated Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI-Generated Description
          </CardTitle>
          <CardDescription>
            Let AI create a comprehensive job description based on your inputs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleGenerateDescription}
              disabled={isGeneratingDescription || !formData.title || !formData.company}
              className="flex items-center gap-2"
            >
              {isGeneratingDescription ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate Description
            </Button>
            {isGeneratingDescription && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Generating...</span>
                <Progress value={progress} className="w-24" />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Job description will appear here..."
              className="mt-1 min-h-[200px]"
            />
            {generatedDescription && (
              <Alert className="mt-2">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  AI has generated a comprehensive job description. You can edit it above.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI Suggestions
            {isGenerating && (
              <RefreshCw className="h-4 w-4 animate-spin" />
            )}
          </CardTitle>
          <CardDescription>
            AI-powered suggestions based on your job title and company.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skills Suggestions */}
          <div>
            <Label className="text-sm font-medium">Suggested Skills</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestions.skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => addSuggestion('skills', skill)}
                >
                  + {skill}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="default"
                  className="cursor-pointer"
                  onClick={() => removeItem('skills', index)}
                >
                  {skill} ×
                </Badge>
              ))}
            </div>
          </div>

          {/* Requirements Suggestions */}
          <div>
            <Label className="text-sm font-medium">Suggested Requirements</Label>
            <div className="space-y-2 mt-2">
              {suggestions.requirements.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => addSuggestion('requirements', req)}
                >
                  <span className="text-sm">{req}</span>
                  <Button size="sm" variant="ghost">
                    Add
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-2 mt-2">
              {formData.requirements.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-primary/10 rounded"
                >
                  <span className="text-sm">{req}</span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => removeItem('requirements', index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Responsibilities Suggestions */}
          <div>
            <Label className="text-sm font-medium">Suggested Responsibilities</Label>
            <div className="space-y-2 mt-2">
              {suggestions.responsibilities.map((resp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                  onClick={() => addSuggestion('responsibilities', resp)}
                >
                  <span className="text-sm">{resp}</span>
                  <Button size="sm" variant="ghost">
                    Add
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-2 mt-2">
              {formData.responsibilities.map((resp, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-primary/10 rounded"
                >
                  <span className="text-sm">{resp}</span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => removeItem('responsibilities', index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          className="flex items-center gap-2"
          disabled={!formData.title || !formData.company || !formData.description}
        >
          <Users className="h-4 w-4" />
          Create Job
        </Button>
      </div>
    </form>
  );
});

SmartJobCreator.displayName = 'SmartJobCreator';

export default SmartJobCreator;