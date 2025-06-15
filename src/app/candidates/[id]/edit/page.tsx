
"use client";

import { useState, useRef, type ChangeEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { processResumeWithDocAI, ProcessResumeDocAIInput } from '@/ai/flows/process-resume-document-ai-flow';
import { generateTextEmbedding, GenerateTextEmbeddingInput } from '@/ai/flows/generate-text-embedding-flow'; // Import embedding flow
// import { saveCandidateWithEmbedding } from '@/services/firestoreService'; // Import placeholder Firestore service
import { UploadCloud, UserCog, Loader2, FileText, Video, CheckCircle, ArrowLeft, ArrowRight, Save, AlertTriangle, Brain } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MAX_STEPS = 4;

// Mock candidate data - in a real app, this would come from a database or API
const MOCK_CANDIDATE_DB_DATA = {
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
  videoIntroUrl: 'https://placehold.co/320x180.mp4',
  resumeUrl: '#',
  // Simulate stored extracted text and embedding for an existing candidate
  extractedResumeText: "Alice Wonderland Senior Software Engineer. Experience: React, Next.js, TypeScript...",
  resumeEmbedding: Array(768).fill(0).map(() => Math.random() * 2 - 1), // Mock 768-dim embedding
};


const candidateFormSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  currentTitle: z.string().min(2, "Current title is required."),
  linkedinProfile: z.string().url("Invalid LinkedIn URL (e.g., https://linkedin.com/in/yourprofile)").optional().or(z.literal('')),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional().or(z.literal('')),
  experienceSummary: z.string().min(50, "Summary must be at least 50 characters.").max(1000, "Summary cannot exceed 1000 characters."),
  resume: z.custom<File>((val) => val instanceof File).optional(),
  profilePicture: z.custom<File>((val) => val instanceof File).optional(),
  videoIntroduction: z.custom<File>((val) => val instanceof File).optional(),
});

type CandidateFormValues = z.infer<typeof candidateFormSchema>;

export default function EditCandidatePage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isProcessingAi, setIsProcessingAi] = useState(false); // Combined AI processing state
  const [extractedTextFromResume, setExtractedTextFromResume] = useState<string | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [generatedEmbedding, setGeneratedEmbedding] = useState<number[] | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [videoIntroFileName, setVideoIntroFileName] = useState<string | null>(null);
  const [candidateNotFound, setCandidateNotFound] = useState(false);

  const resumeFileRef = useRef<HTMLInputElement>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);
  const videoIntroRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
        fullName: '',
        email: '',
        phone: '',
        currentTitle: '',
        linkedinProfile: '',
        portfolioUrl: '',
        experienceSummary: '',
    },
    mode: "onChange",
  });

  useEffect(() => {
    setIsDataLoading(true);
    setCandidateNotFound(false);
    new Promise<typeof MOCK_CANDIDATE_DB_DATA | null>(resolve => {
        setTimeout(() => {
            if (candidateId === MOCK_CANDIDATE_DB_DATA.id) {
                resolve(MOCK_CANDIDATE_DB_DATA);
            } else {
                resolve(null);
            }
        }, 500);
    }).then(data => {
        if (data) {
            form.reset({
                fullName: data.fullName,
                email: data.email,
                phone: data.phone,
                currentTitle: data.currentTitle,
                linkedinProfile: data.linkedinProfile,
                portfolioUrl: data.portfolioUrl,
                experienceSummary: data.experienceSummary,
            });
            setProfilePicPreview(data.avatarUrl);
            setExtractedSkills(data.skills);
            setExtractedTextFromResume(data.extractedResumeText); // Load existing text
            setGeneratedEmbedding(data.resumeEmbedding);       // Load existing embedding
        } else {
            setCandidateNotFound(true);
            toast({ variant: "destructive", title: "Error", description: "Candidate data not found."});
        }
    }).catch(error => {
        console.error("Failed to load candidate data:", error);
        setCandidateNotFound(true);
        toast({ variant: "destructive", title: "Loading Error", description: "Could not load candidate data."});
    }).finally(() => {
        setIsDataLoading(false);
    });
  }, [candidateId, form, toast]);


  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        if (base64Data) {
          resolve(base64Data);
        } else {
          reject(new Error("Failed to extract base64 data from file."));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleResumeUpload = async (file: File | null) => {
    if (file) {
      setResumeFileName(file.name);
      form.setValue('resume', file, { shouldValidate: true });
      setIsProcessingAi(true);
      setExtractedSkills([]);
      setExtractedTextFromResume(null);
      setGeneratedEmbedding(null);

      try {
        const resumeFileBase64 = await fileToBase64(file);
        const docAIInput: ProcessResumeDocAIInput = {
          resumeFileBase64,
          mimeType: file.type
        };

        toast({ title: "Processing New Resume...", description: "Using Document AI for text extraction." });
        const docAIResult = await processResumeWithDocAI(docAIInput);

        if (!docAIResult.extractedText) {
          throw new Error("Document AI did not return extracted text from new resume.");
        }
        setExtractedTextFromResume(docAIResult.extractedText);
        toast({ title: "New Resume Text Extracted", description: "Now processing for skills and embedding." });

        // Extract Skills
        const skillInput: ExtractSkillsFromResumeInput = { resumeText: docAIResult.extractedText };
        const skillResult = await extractSkillsFromResume(skillInput);
        setExtractedSkills(skillResult.skills);
        toast({ title: "Skills Updated", description: "Skills identified from new resume.", action: <CheckCircle className="text-green-500" /> });

        // Generate Embedding
        const embeddingInput: GenerateTextEmbeddingInput = { text: docAIResult.extractedText };
        const embeddingResult = await generateTextEmbedding(embeddingInput);
        setGeneratedEmbedding(embeddingResult.embedding);
        toast({ title: "Embedding Updated", description: `New text embedding created using ${embeddingResult.modelUsed}.`, action: <Brain className="text-purple-500" /> });

      } catch (error) {
        console.error("Error processing new resume, extracting skills, or generating embedding:", error);
        let errorMessage = "An unexpected error occurred during new resume processing.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        toast({ variant: "destructive", title: "Resume Update Failed", description: errorMessage });
        // Optionally, revert to original skills/text/embedding if update fails
        // if (MOCK_CANDIDATE_DB_DATA.id === candidateId) {
        //   setExtractedSkills(MOCK_CANDIDATE_DB_DATA.skills);
        //   setExtractedTextFromResume(MOCK_CANDIDATE_DB_DATA.extractedResumeText);
        //   setGeneratedEmbedding(MOCK_CANDIDATE_DB_DATA.resumeEmbedding);
        // }
      } finally {
        setIsProcessingAi(false);
      }
    } else {
        setResumeFileName(null);
        form.setValue('resume', undefined);
        // If removing an uploaded file, consider reverting to original data
        // if (MOCK_CANDIDATE_DB_DATA.id === candidateId) {
        //   setExtractedSkills(MOCK_CANDIDATE_DB_DATA.skills);
        //   setExtractedTextFromResume(MOCK_CANDIDATE_DB_DATA.extractedResumeText);
        //   setGeneratedEmbedding(MOCK_CANDIDATE_DB_DATA.resumeEmbedding);
        // }
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
        form.setValue('profilePicture', undefined);
    }
  };

  const handleVideoIntroUpload = (file: File | null) => {
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File Too Large", description: "Video intro should be under 50MB." });
        form.setValue('videoIntroduction', undefined);
        setVideoIntroFileName(null);
        if (videoIntroRef.current) videoIntroRef.current.value = "";
      } else {
        form.setValue('videoIntroduction', file, { shouldValidate: true });
        setVideoIntroFileName(file.name);
      }
    } else {
      setVideoIntroFileName(null);
      form.setValue('videoIntroduction', undefined);
    }
  };

  async function onSubmit(data: CandidateFormValues) {
    setIsLoading(true);

    if (form.getValues("resume") && (!extractedTextFromResume || !generatedEmbedding)) {
        toast({ variant: "destructive", title: "Processing Incomplete", description: "If a new resume was uploaded, its text or embedding is still processing or missing. Please wait or re-upload."});
        setIsLoading(false);
        return;
    }
    const finalExtractedText = extractedTextFromResume || (MOCK_CANDIDATE_DB_DATA.id === candidateId ? MOCK_CANDIDATE_DB_DATA.extractedResumeText : null);
    const finalEmbedding = generatedEmbedding || (MOCK_CANDIDATE_DB_DATA.id === candidateId ? MOCK_CANDIDATE_DB_DATA.resumeEmbedding : null);


    console.log("Updated candidate data:", data);
    if (finalExtractedText) console.log("Final Extracted Resume Text:", finalExtractedText.substring(0,100) + "...");
    if (finalEmbedding) console.log("Final Generated Embedding vector length:", finalEmbedding.length);

    // --- INTEGRATION POINT FOR FIRESTORE ---
    // if (finalExtractedText && finalEmbedding && candidateId) {
    //   const firestoreData = {
    //     fullName: data.fullName,
    //     email: data.email,
    //     currentTitle: data.currentTitle,
    //     extractedResumeText: finalExtractedText,
    //     resumeEmbedding: finalEmbedding,
    //     skills: extractedSkills, // Use the latest skills
    //     // Add other fields from 'data' as needed by CandidateWithEmbedding interface
    //   };
    //   try {
    //     // Pass the actual candidateId for updates
    //     const saveResult = await saveCandidateWithEmbedding(candidateId, firestoreData);
    //     if (saveResult.success) {
    //       toast({ title: "Candidate Updated in DB", description: `Candidate ID: ${saveResult.candidateId}` });
    //     } else {
    //       throw new Error(saveResult.message);
    //     }
    //   } catch (dbError) {
    //     console.error("Error saving to Firestore:", dbError);
    //     toast({ variant: "destructive", title: "Database Error", description: `Could not update candidate: ${dbError instanceof Error ? dbError.message : String(dbError)}` });
    //     setIsLoading(false);
    //     return;
    //   }
    // }
    // --- END INTEGRATION POINT ---

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    toast({
      title: "Profile Updated! (Simulated)",
      description: `${data.fullName}'s profile has been successfully updated. Next step would be Firestore saving.`,
      action: <Save className="text-primary" />,
    });
    setIsLoading(false);
    router.push(`/candidates/${candidateId}`);
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof CandidateFormValues)[] = [];
    if (currentStep === 1) fieldsToValidate = ['fullName', 'email', 'currentTitle'];
    if (currentStep === 2) fieldsToValidate = ['experienceSummary'];
    if (currentStep === 3 && form.getValues("resume")) fieldsToValidate = ['resume']; // Validate resume only if a new one is staged
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

  if (isDataLoading) {
      return (
        <Container className="flex flex-col justify-center items-center min-h-[70vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground mt-4">Loading candidate data...</p>
        </Container>
      );
  }

  if (candidateNotFound) {
      return (
        <Container className="flex flex-col justify-center items-center min-h-[70vh]">
            <Alert variant="destructive" className="max-w-md">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Candidate Not Found</AlertTitle>
                <AlertDescription>
                The candidate profile you are trying to edit does not exist or could not be loaded.
                Please check the ID or go back to the candidates list.
                </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => router.push('/candidates')} className="mt-6">
                Go to Candidates List
            </Button>
        </Container>
      );
  }

  return (
    <Container>
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Edit Candidate Profile</CardTitle>
          <CardDescription>
            Update profile details for <span className="font-semibold text-primary">{form.getValues("fullName") || "candidate"}</span>.
            Step {currentStep} of {MAX_STEPS}.
          </CardDescription>
           <Progress value={(currentStep / MAX_STEPS) * 100} className="w-full mt-2 h-2" />
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8 min-h-[300px]">
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

             {currentStep === 3 && (
                <section className="space-y-6 animate-fadeIn">
                  <FormField
                    control={form.control}
                    name="resume"
                    render={() => (
                      <FormItem>
                        <FormLabel>Update Resume (PDF, DOC, DOCX, TXT)</FormLabel>
                        <FormControl>
                          <Button type="button" variant="outline" onClick={() => resumeFileRef.current?.click()} className="w-full" disabled={isProcessingAi}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            {resumeFileName ? `New: ${resumeFileName}` : "Upload New Resume"}
                          </Button>
                        </FormControl>
                        <Input
                          id="resume-upload"
                          type="file"
                          accept=".pdf,application/pdf,.doc,application/msword,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain"
                          className="hidden"
                          ref={resumeFileRef}
                          onChange={(e) => handleResumeUpload(e.target.files ? e.target.files[0] : null)}
                        />
                        <FormDescription>Leave blank to keep current resume. Uploading new replaces current text, skills, and embedding after AI processing.</FormDescription>
                        {isProcessingAi && (
                          <div className="flex items-center text-sm text-muted-foreground mt-2">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI processing new resume...
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(extractedSkills.length > 0 || (extractedTextFromResume && !form.getValues("resume"))) && (
                    <FormItem>
                      <FormLabel>AI Processed Resume Data</FormLabel>
                      <div className="p-3 border rounded-md bg-muted/50 space-y-3">
                        {extractedSkills.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Extracted Skills (from {form.getValues("resume") ? 'new' : 'current'} resume):</h4>
                                <div className="flex flex-wrap gap-2">
                                {extractedSkills.map((skill, index) => (
                                    <Badge key={index} variant="secondary">{skill}</Badge>
                                ))}
                                </div>
                            </div>
                        )}
                        {(generatedEmbedding || (extractedTextFromResume && !form.getValues("resume") && MOCK_CANDIDATE_DB_DATA.resumeEmbedding)) && (
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Embedding Status (from {form.getValues("resume") ? 'new' : 'current'} resume):</h4>
                                <div className="flex items-center text-green-600 text-xs">
                                    <Brain className="mr-2 h-4 w-4" />
                                    <span>Text embedding is available.</span>
                                </div>
                            </div>
                        )}
                         <p className="text-xs text-muted-foreground mt-2">
                            {form.getValues("resume") ? "Data from the newly uploaded resume." : "Data from the resume currently on file."}
                         </p>
                      </div>
                    </FormItem>
                  )}
                </section>
              )}


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
                                  <UploadCloud className="mr-2 h-4 w-4" /> {form.getValues("profilePicture")?.name ? `New: ${form.getValues("profilePicture")!.name}` : "Upload New Profile Picture"}
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
            <CardFooter className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1 || isLoading || isProcessingAi}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              {currentStep < MAX_STEPS ? (
                <Button type="button" onClick={nextStep} disabled={isLoading || isProcessingAi}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading || isProcessingAi} size="lg">
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
