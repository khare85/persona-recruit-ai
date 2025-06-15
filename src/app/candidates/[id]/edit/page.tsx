
"use client";

import { useState, useRef, type ChangeEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Container } from '@/components/shared/Container';
import { useToast } from '@/hooks/use-toast';
import { extractSkillsFromResume, ExtractSkillsFromResumeInput } from '@/ai/flows/resume-skill-extractor';
import { UploadCloud, UserCog, Loader2, FileText, Video, CheckCircle, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const MAX_STEPS = 4;

// Mock candidate data - in a real app, this would come from a database or API
const MOCK_CANDIDATE = {
  id: '1',
  fullName: 'Alice Wonderland',
  email: 'alice.w@example.com',
  phone: '(555) 123-4567',
  currentTitle: 'Senior Software Engineer',
  linkedinProfile: 'https://linkedin.com/in/alicewonderland',
  portfolioUrl: 'https://alicew.dev',
  experienceSummary: "Highly skilled and innovative Senior Software Engineer with 8+ years of experience in developing and implementing cutting-edge web applications. Proven ability to lead projects, mentor junior developers, and collaborate effectively in agile environments. Passionate about creating intuitive user experiences and leveraging new technologies to solve complex problems. Seeking a challenging remote role where I can contribute to meaningful projects and continue to grow professionally.",
  skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'System Design', 'Agile Methodologies'],
  avatarUrl: 'https://placehold.co/150x150.png?a=1',
  videoIntroUrl: 'https://placehold.co/320x180.mp4', // Placeholder for video,
  resumeUrl: '#', // Placeholder for resume download
};


const candidateFormSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  currentTitle: z.string().min(2, "Current title is required."),
  linkedinProfile: z.string().url("Invalid LinkedIn URL (e.g., https://linkedin.com/in/yourprofile)").optional().or(z.literal('')),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional().or(z.literal('')),
  experienceSummary: z.string().min(50, "Summary must be at least 50 characters.").max(1000, "Summary cannot exceed 1000 characters."),
  // Files are optional for update, they might not change them
  resume: z.custom<File>((val) => val instanceof File, "Resume file is required.").optional(),
  profilePicture: z.custom<File>((val) => val instanceof File, "Profile picture is required.").optional(),
  videoIntroduction: z.custom<File>((val) => val instanceof File, "10-second video intro is required.").optional(),
});

type CandidateFormValues = z.infer<typeof candidateFormSchema>;

export default function EditCandidatePage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>(MOCK_CANDIDATE.id === candidateId ? MOCK_CANDIDATE.skills : []);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(MOCK_CANDIDATE.id === candidateId ? MOCK_CANDIDATE.avatarUrl : null);
  const [videoIntroFileName, setVideoIntroFileName] = useState<string | null>(null);


  const resumeFileRef = useRef<HTMLInputElement>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);
  const videoIntroRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: async () => {
        // In a real app, fetch candidate data here based on candidateId
        if (candidateId === MOCK_CANDIDATE.id) {
            return {
                fullName: MOCK_CANDIDATE.fullName,
                email: MOCK_CANDIDATE.email,
                phone: MOCK_CANDIDATE.phone,
                currentTitle: MOCK_CANDIDATE.currentTitle,
                linkedinProfile: MOCK_CANDIDATE.linkedinProfile,
                portfolioUrl: MOCK_CANDIDATE.portfolioUrl,
                experienceSummary: MOCK_CANDIDATE.experienceSummary,
            };
        }
        // Fallback for non-existent mock ID or if data fetch fails
        return {
            fullName: '',
            email: '',
            phone: '',
            currentTitle: '',
            linkedinProfile: '',
            portfolioUrl: '',
            experienceSummary: '',
        };
    },
    mode: "onChange",
  });
  
  // Effect to load candidate data if not using async defaultValues (some React Hook Form versions have issues with it)
  useEffect(() => {
    if (candidateId === MOCK_CANDIDATE.id) {
      form.reset({
        fullName: MOCK_CANDIDATE.fullName,
        email: MOCK_CANDIDATE.email,
        phone: MOCK_CANDIDATE.phone,
        currentTitle: MOCK_CANDIDATE.currentTitle,
        linkedinProfile: MOCK_CANDIDATE.linkedinProfile,
        portfolioUrl: MOCK_CANDIDATE.portfolioUrl,
        experienceSummary: MOCK_CANDIDATE.experienceSummary,
      });
      setProfilePicPreview(MOCK_CANDIDATE.avatarUrl);
      setExtractedSkills(MOCK_CANDIDATE.skills);
    } else {
        // Handle candidate not found - redirect or show error
        toast({ variant: "destructive", title: "Error", description: "Candidate data not found."});
        router.push('/candidates');
    }
  }, [candidateId, form, router, toast]);


  const handleResumeUpload = async (file: File | null) => {
    if (file) {
      setResumeFileName(file.name);
      form.setValue('resume', file, { shouldValidate: true });
      setIsParsingResume(true);
      // setExtractedSkills([]); // Don't clear old skills immediately unless a new parse is successful
      try {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = async (e) => {
          const resumeText = e.target?.result as string;
          if (resumeText) {
            const input: ExtractSkillsFromResumeInput = { resumeText };
            const result = await extractSkillsFromResume(input);
            setExtractedSkills(result.skills);
            toast({ title: "Resume Parsed", description: "Skills updated successfully.", action: <CheckCircle className="text-green-500" /> });
          } else {
             throw new Error("Could not read resume file content.");
          }
        };
        reader.onerror = () => {
            throw new Error("Error reading resume file.");
        }
      } catch (error) {
        console.error("Error parsing resume:", error);
        toast({ variant: "destructive", title: "Resume Parsing Failed", description: "Could not extract skills. Please check the file or try again." });
      } finally {
        setIsParsingResume(false);
      }
    } else {
        setResumeFileName(null);
        form.setValue('resume', undefined, { shouldValidate: true });
    }
  };

  const handleProfilePicUpload = (file: File | null) => {
    if (file) {
      form.setValue('profilePicture', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        // If clearing, revert to original or placeholder if needed. For now, just clear.
        // setProfilePicPreview(MOCK_CANDIDATE.avatarUrl); // Or a default placeholder
        form.setValue('profilePicture', undefined, { shouldValidate: true });
    }
  };
  
  const handleVideoIntroUpload = (file: File | null) => {
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // Example: 50MB limit
        toast({ variant: "destructive", title: "File Too Large", description: "Video intro should be under 50MB." });
        form.setValue('videoIntroduction', undefined, { shouldValidate: true });
        setVideoIntroFileName(null);
        if (videoIntroRef.current) videoIntroRef.current.value = ""; 
      } else {
        form.setValue('videoIntroduction', file, { shouldValidate: true });
        setVideoIntroFileName(file.name);
      }
    } else {
      setVideoIntroFileName(null);
      form.setValue('videoIntroduction', undefined, { shouldValidate: true });
    }
  };

  async function onSubmit(data: CandidateFormValues) {
    setIsLoading(true);
    console.log("Updated candidate data:", data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Profile Updated!",
      description: `${data.fullName}'s profile has been successfully updated.`,
      action: <Save className="text-primary" />,
    });
    // No reset, stay on page or redirect to profile view
    setIsLoading(false);
    router.push(`/candidates/${candidateId}`);
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof CandidateFormValues)[] = [];
    if (currentStep === 1) fieldsToValidate = ['fullName', 'email', 'currentTitle'];
    if (currentStep === 2) fieldsToValidate = ['experienceSummary'];
    // Files are optional for update, so don't strictly validate them on "Next" unless present
    if (currentStep === 3 && form.getValues("resume")) fieldsToValidate = ['resume'];
    if (currentStep === 4) {
      if (form.getValues("profilePicture")) fieldsToValidate.push('profilePicture');
      if (form.getValues("videoIntroduction")) fieldsToValidate.push('videoIntroduction');
    }


    const isValid = fieldsToValidate.length > 0 ? await form.trigger(fieldsToValidate) : true;

    if (isValid && currentStep < MAX_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else if (isValid && currentStep === MAX_STEPS) {
      await form.handleSubmit(onSubmit)();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  if (!form.formState.isDirty && !MOCK_CANDIDATE.id) { // Handles case where defaultValues didn't load yet or ID mismatch
      return (
        <Container className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Loading candidate data...</p>
        </Container>
      )
  }


  return (
    <Container>
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Edit Candidate Profile</CardTitle>
          <CardDescription>
            Update your profile details below.
            Step {currentStep} of {MAX_STEPS}.
          </CardDescription>
           <Progress value={(currentStep / MAX_STEPS) * 100} className="w-full mt-2 h-2" />
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8">
              {/* Step 1: Personal & Contact Information */}
              {currentStep === 1 && (
                <section className="space-y-6 animate-fadeIn">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl><Input type="email" placeholder="e.g., jane.doe@example.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl><Input type="tel" placeholder="e.g., (555) 123-4567" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="currentTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current or Most Recent Job Title</FormLabel>
                        <FormControl><Input placeholder="e.g., Senior Software Engineer" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>
              )}

              {/* Step 2: Professional Details */}
              {currentStep === 2 && (
                <section className="space-y-6 animate-fadeIn">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="linkedinProfile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn Profile URL (Optional)</FormLabel>
                          <FormControl><Input placeholder="https://linkedin.com/in/yourprofile" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="portfolioUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portfolio/Website URL (Optional)</FormLabel>
                          <FormControl><Input placeholder="https://yourportfolio.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="experienceSummary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Summary / Bio</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Briefly describe your experience and career goals..." className="min-h-[120px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>
              )}

              {/* Step 3: Resume & Skills */}
              {currentStep === 3 && (
                <section className="space-y-6 animate-fadeIn">
                  <FormField
                    control={form.control}
                    name="resume"
                    render={() => ( 
                      <FormItem>
                        <FormLabel>Update Resume (PDF, DOC, DOCX, TXT)</FormLabel>
                        <FormControl>
                          <Button type="button" variant="outline" onClick={() => resumeFileRef.current?.click()} className="w-full">
                            <UploadCloud className="mr-2 h-4 w-4" /> 
                            {resumeFileName ? `New: ${resumeFileName}` : "Upload New Resume"}
                          </Button>
                        </FormControl>
                        <Input 
                          id="resume-upload" 
                          type="file" 
                          accept=".pdf,.doc,.docx,.txt" 
                          className="hidden" 
                          ref={resumeFileRef}
                          onChange={(e) => handleResumeUpload(e.target.files ? e.target.files[0] : null)} 
                        />
                        <FormDescription>Leave blank to keep current resume. Uploading a new one will replace it.</FormDescription>
                        {isParsingResume && (
                          <div className="flex items-center text-sm text-muted-foreground mt-2">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing resume, please wait...
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {extractedSkills.length > 0 && (
                    <FormItem>
                      <FormLabel>AI Extracted Skills (from latest resume)</FormLabel>
                      <div className="p-3 border rounded-md bg-muted/50">
                        <div className="flex flex-wrap gap-2">
                          {extractedSkills.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">These skills are based on the latest resume provided.</p>
                      </div>
                    </FormItem>
                  )}
                </section>
              )}

              {/* Step 4: Visuals */}
              {currentStep === 4 && (
                <section className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="w-32 h-32 border-4 border-primary/30">
                      <AvatarImage src={profilePicPreview || undefined} alt="Profile Preview" data-ai-hint="profile avatar" />
                      <AvatarFallback className="text-4xl">
                        {form.getValues("fullName")?.substring(0,2).toUpperCase() || <UserCog />}
                      </AvatarFallback>
                    </Avatar>
                    <FormField
                        control={form.control}
                        name="profilePicture"
                        render={() => (
                          <FormItem className="w-full max-w-sm">
                            <FormLabel htmlFor="profilePicture-upload" className="sr-only">Profile Picture</FormLabel>
                            <FormControl>
                              <Button type="button" variant="outline" onClick={() => profilePicRef.current?.click()} className="w-full">
                                  <UploadCloud className="mr-2 h-4 w-4" /> {form.getValues("profilePicture") ? "Change" : "Upload New"} Profile Picture
                              </Button>
                            </FormControl>
                            <Input 
                              id="profilePicture-upload" 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              ref={profilePicRef}
                              onChange={(e) => handleProfilePicUpload(e.target.files ? e.target.files[0] : null)}
                            />
                             <FormDescription>Leave blank to keep current picture.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="videoIntroduction"
                    render={() => (
                      <FormItem>
                        <FormLabel>Update 10-Second Video Introduction (MP4, MOV, WebM)</FormLabel>
                        <FormControl>
                          <Button type="button" variant="outline" onClick={() => videoIntroRef.current?.click()} className="w-full">
                            <Video className="mr-2 h-4 w-4" /> 
                            {videoIntroFileName ? `New: ${videoIntroFileName}` : "Upload New Video Intro"}
                          </Button>
                        </FormControl>
                        <Input 
                          id="video-intro-upload" 
                          type="file" 
                          accept="video/mp4,video/quicktime,video/webm" 
                          className="hidden" 
                          ref={videoIntroRef}
                          onChange={(e) => handleVideoIntroUpload(e.target.files ? e.target.files[0] : null)} 
                        />
                        <FormDescription>
                          Max 10s, 50MB. Leave blank to keep current video.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>
              )}

            </CardContent>
            <CardFooter className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1 || isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              {currentStep < MAX_STEPS ? (
                <Button type="button" onClick={nextStep} disabled={isLoading || isParsingResume}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading || isParsingResume} size="lg">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </Container>
  );
}
