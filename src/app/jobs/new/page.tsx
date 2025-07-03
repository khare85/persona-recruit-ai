
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Container } from '@/components/shared/Container';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2, CheckCircle, X, Plus, Sparkles, Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';

// Simple initial form for AI generation
const aiGenerationSchema = z.object({
  jobTitle: z.string().min(3, "Job title must be at least 3 characters"),
  yearsOfExperience: z.string().min(1, "Please specify years of experience"),
  companyId: z.string().min(1, "Please select a company"),
  department: z.string().optional(),
  location: z.string().optional(),
  jobType: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote']).optional()
});

// Complete job form schema
const jobFormSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote']),
  department: z.string().min(2, "Department must be at least 2 characters"),
  experience: z.string().min(1, "Experience requirement is required"),
  salary: z.string().optional(),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.array(z.string()).min(1, "At least one requirement is needed"),
  mustHaveRequirements: z.array(z.string()).min(1, "At least one must-have requirement is needed"),
  benefits: z.array(z.string()).min(1, "At least one benefit is needed"),
  skills: z.array(z.string()).min(1, "At least one skill is needed"),
  responsibilities: z.array(z.string()).optional(),
  urgency: z.enum(['Low', 'Medium', 'High']).default('Medium')
});

type AIGenerationValues = z.infer<typeof aiGenerationSchema>;
type JobFormValues = z.infer<typeof jobFormSchema>;

interface GeneratedJobData {
  description: string;
  requirements: string[];
  mustHaveRequirements: string[];
  benefits: string[];
  skills: string[];
  responsibilities: string[];
}

interface Company {
  id: string;
  name: string;
}

function NewJobContent() {
  const [step, setStep] = useState<'ai-generation' | 'job-form'>('ai-generation');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedJobData | null>(null);
  const { toast } = useToast();
  const { getToken } = useAuth();
  const router = useRouter();
  const authenticatedFetch = useAuthenticatedFetch();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const result = await authenticatedFetch('/api/admin/companies?limit=1000');
        setCompanies(result.data.companies || []);
      } catch (error) {
        toast({
          title: "Error fetching companies",
          description: "Could not load company list. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, [authenticatedFetch, toast]);

  // AI Generation Form
  const aiForm = useForm<AIGenerationValues>({
    resolver: zodResolver(aiGenerationSchema),
    defaultValues: {
      jobTitle: '',
      yearsOfExperience: '',
      companyId: '',
      department: '',
      location: '',
      jobType: undefined
    }
  });

  // Job Creation Form
  const jobForm = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      location: '',
      type: 'Full-time',
      department: '',
      experience: '',
      salary: '',
      description: '',
      requirements: [],
      mustHaveRequirements: [],
      benefits: [],
      skills: [],
      responsibilities: [],
      urgency: 'Medium'
    }
  });

  const handleGenerateJobDescription = async (data: AIGenerationValues) => {
    setIsGenerating(true);
    try {
      const token = await getToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to create job postings",
          variant: "destructive"
        });
        router.push('/auth');
        return;
      }
      
      const selectedCompany = companies.find(c => c.id === data.companyId);
      const companyName = selectedCompany ? selectedCompany.name : '';

      const response = await fetch('/api/jobs/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          company: companyName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate job description');
      }

      const result = await response.json();
      const generated = result.data;

      setGeneratedData(generated);

      // Pre-populate the job form
      jobForm.setValue('title', data.jobTitle);
      jobForm.setValue('experience', data.yearsOfExperience);
      jobForm.setValue('location', data.location || '');
      jobForm.setValue('department', data.department || '');
      jobForm.setValue('type', data.jobType || 'Full-time');
      jobForm.setValue('description', generated.description);
      jobForm.setValue('requirements', generated.requirements);
      jobForm.setValue('mustHaveRequirements', generated.mustHaveRequirements);
      jobForm.setValue('benefits', generated.benefits);
      jobForm.setValue('skills', generated.skills);
      jobForm.setValue('responsibilities', generated.responsibilities || []);

      setStep('job-form');
      
      toast({
        title: "✨ Job Description Generated!",
        description: "AI has created a comprehensive job description. You can now review and customize it.",
      });
    } catch (error: any) {
      console.error('Job generation error:', error);
      toast({
        title: "Generation Failed",
        description: error?.message || "Failed to generate job description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveJob = async (data: JobFormValues) => {
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to create job postings",
          variant: "destructive"
        });
        router.push('/auth');
        return;
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          isRemote: data.type === 'Remote',
          status: 'active'
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create job';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          if (errorData.details) {
            console.error('Validation errors:', errorData.details);
          }
        } catch (e) {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast({
        title: "✅ Job Created Successfully!",
        description: "The job posting has been created and is now active.",
      });

      // Redirect to jobs list
      router.push('/recruiter/jobs');
      
    } catch (error: any) {
      console.error('Job creation error:', error);
      toast({
        title: "Save Failed",
        description: error?.message || "Failed to save job. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addArrayItem = (fieldName: keyof JobFormValues, value: string) => {
    if (!value.trim()) return;
    const currentValues = jobForm.getValues(fieldName) as string[];
    jobForm.setValue(fieldName, [...currentValues, value.trim()]);
  };

  const removeArrayItem = (fieldName: keyof JobFormValues, index: number) => {
    const currentValues = jobForm.getValues(fieldName) as string[];
    jobForm.setValue(fieldName, currentValues.filter((_, i) => i !== index));
  };

  const ArrayFieldEditor = ({ 
    fieldName, 
    label, 
    placeholder,
    description 
  }: { 
    fieldName: keyof JobFormValues;
    label: string;
    placeholder: string;
    description?: string;
  }) => {
    const [inputValue, setInputValue] = useState('');
    const values = jobForm.watch(fieldName) as string[];

    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold">{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addArrayItem(fieldName, inputValue);
                setInputValue('');
              }
            }}
          />
          <Button 
            type="button"
            variant="outline"
            onClick={() => {
              addArrayItem(fieldName, inputValue);
              setInputValue('');
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {values.map((item, index) => (
            <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
              {item}
              <button
                type="button"
                onClick={() => removeArrayItem(fieldName, index)}
                className="ml-2 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  if (step === 'ai-generation') {
    return (
      <Container>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Brain className="h-10 w-10 text-primary" />
              AI Job Description Generator
            </h1>
            <p className="text-xl text-muted-foreground">
              Just provide the job title and experience level - our AI will create a comprehensive job description for you!
            </p>
          </div>

          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generate with AI
              </CardTitle>
              <CardDescription>
                Fill in the basic details and let AI create the perfect job description
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...aiForm}>
                <form onSubmit={aiForm.handleSubmit(handleGenerateJobDescription)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={aiForm.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Job Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Senior Software Engineer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aiForm.control}
                      name="yearsOfExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Years of Experience *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 3-5 years" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                      control={aiForm.control}
                      name="companyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Company *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingCompanies}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={isLoadingCompanies ? "Loading companies..." : "Select a company"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {!isLoadingCompanies && companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aiForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Engineering" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aiForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., San Francisco, CA" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={aiForm.control}
                      name="jobType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Type (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select job type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Full-time">Full-time</SelectItem>
                              <SelectItem value="Part-time">Part-time</SelectItem>
                              <SelectItem value="Contract">Contract</SelectItem>
                              <SelectItem value="Remote">Remote</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Magic...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-5 w-5" />
                        Generate Job Description with AI
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              Review & Customize Job
            </h1>
            <p className="text-muted-foreground mt-2">
              AI has generated your job description. Review and customize as needed.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setStep('ai-generation')}
          >
            ← Back to Generator
          </Button>
        </div>

        <Form {...jobForm}>
          <form onSubmit={jobForm.handleSubmit(handleSaveJob)} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={jobForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={jobForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={jobForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={jobForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Remote">Remote</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={jobForm.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Required</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={jobForm.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary Range (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., $80,000 - $120,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={jobForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={6}
                          placeholder="Comprehensive job description..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Technologies</CardTitle>
                <CardDescription>Skills will be displayed as badges on the job posting</CardDescription>
              </CardHeader>
              <CardContent>
                <ArrayFieldEditor
                  fieldName="skills"
                  label="Skills"
                  placeholder="Add a skill (e.g., React, Python, Leadership)"
                  description="Press Enter or click + to add skills"
                />
              </CardContent>
            </Card>

            {/* Must-Have Requirements */}
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="text-orange-800">Must-Have Requirements</CardTitle>
                <CardDescription className="text-orange-700">
                  Critical requirements used for candidate scoring and filtering. These are non-negotiable.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ArrayFieldEditor
                  fieldName="mustHaveRequirements"
                  label="Must-Have Requirements"
                  placeholder="Add a critical requirement"
                  description="These will be used to score and filter candidates"
                />
              </CardContent>
            </Card>

            {/* General Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>General Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ArrayFieldEditor
                  fieldName="requirements"
                  label="Requirements"
                  placeholder="Add a requirement"
                />
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-green-800">Benefits & Perks</CardTitle>
                <CardDescription className="text-green-700">
                  Attractive benefits to showcase your company culture and compensation package
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ArrayFieldEditor
                  fieldName="benefits"
                  label="Benefits"
                  placeholder="Add a benefit or perk"
                  description="What makes your company great to work for?"
                />
              </CardContent>
            </Card>

            {/* Responsibilities */}
            <Card>
              <CardHeader>
                <CardTitle>Key Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ArrayFieldEditor
                  fieldName="responsibilities"
                  label="Responsibilities"
                  placeholder="Add a key responsibility"
                />
              </CardContent>
            </Card>

            {/* Urgency */}
            <Card>
              <CardHeader>
                <CardTitle>Job Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={jobForm.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low Priority</SelectItem>
                          <SelectItem value="Medium">Medium Priority</SelectItem>
                          <SelectItem value="High">High Priority</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setStep('ai-generation')}
              >
                ← Regenerate with AI
              </Button>
              <Button 
                type="submit" 
                size="lg"
                disabled={isSaving}
                className="min-w-[150px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create Job Posting
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Container>
  );
}

export default function NewJobPage() {
  return (
    <ProtectedRoute requiredRole={['recruiter', 'company_admin']} redirectTo="/auth">
      <NewJobContent />
    </ProtectedRoute>
  );
}
