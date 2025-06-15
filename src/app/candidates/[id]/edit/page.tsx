
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
import { generateTextEmbedding, GenerateTextEmbeddingInput } from '@/ai/flows/generate-text-embedding-flow';
import { saveCandidateWithEmbedding } from '@/services/firestoreService';
import { UploadCloud, UserCog, Loader2, FileText, Video, CheckCircle, ArrowLeft, ArrowRight, Save, AlertTriangle, Brain } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MAX_STEPS = 4;

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
  extractedResumeText: "Alice Wonderland Senior Software Engineer. Experience: React, Next.js, TypeScript...",
  resumeEmbedding: Array(768).fill(0).map(() => Math.random() * 2 - 1),
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
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [extractedTextFromResume, setExtractedTextFromResume] = useState<string | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [generatedEmbedding, setGeneratedEmbedding] = useState<number[] | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [videoIntroFileName, setVideoIntroFileName] = useState<string | null>(null);
  const [candidateNotFound, setCandidateNotFound] = useState(false);

  // Store initial AI data to revert if new resume processing fails or is removed
  const [initialAiData, setInitialAiData] = useState<{text: string | null, skills: string[], embedding: number[] | null}>({ text: null, skills: [], embedding: null});


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
            setExtractedTextFromResume(data.extractedResumeText);
            setGeneratedEmbedding(data.resumeEmbedding);
            // Store initial AI processed data
            setInitialAiData({ text: data.extractedResumeText, skills: data.skills, embedding: data.resumeEmbedding });
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
      // Clear previous new AI data, keep initial data intact for revert
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
        setExtractedTextFromResume(docAIResult.extractedText); // This is the new text
        toast({ title: "New Resume Text Extracted", description: "Now processing for skills and embedding." });

        const skillInput: ExtractSkillsFromResumeInput = { resumeText: docAIResult.extractedText };
        const skillResult = await extractSkillsFromResume(skillInput);
        setExtractedSkills(skillResult.skills); // These are the new skills
        toast({ title: "Skills Updated", description: "Skills identified from new resume.", action: <CheckCircle className="text-green-500" /> });

        const embeddingInput: GenerateTextEmbeddingInput = { text: docAIResult.extractedText };
        const embeddingResult = await generateTextEmbedding(embeddingInput);
        setGeneratedEmbedding(embeddingResult.embedding); // This is the new embedding
        toast({ title: "Embedding Updated", description: `New text embedding created using ${embeddingResult.modelUsed}.`, action: <Brain className="text-purple-500" /> });

      } catch (error) {
        console.error("Error processing new resume, extracting skills, or generating embedding:", error);
        let errorMessage = "An unexpected error occurred during new resume processing.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        toast({ variant: "destructive", title: "Resume Update Failed", description: errorMessage });
        // Revert to initial AI data if new processing fails
        setExtractedTextFromResume(initialAiData.text);
        setExtractedSkills(initialAiData.skills);
        setGeneratedEmbedding(initialAiData.embedding);
        setResumeFileName(null); // Clear the failed upload
        form.setValue('resume', undefined);
      } finally {
        setIsProcessingAi(false);
      }
    } else { // File removed by user
        setResumeFileName(null);
        form.setValue('resume', undefined);
        // Revert to initial AI data if user clears the uploaded file
        setExtractedTextFromResume(initialAiData.text);
        setExtractedSkills(initialAiData.skills);
        setGeneratedEmbedding(initialAiData.embedding);
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
        // Revert to original if MOCK_CANDIDATE_DB_DATA.avatarUrl available? For now, just clears.
        if(candidateId === MOCK_CANDIDATE_DB_DATA.id) setProfilePicPreview(MOCK_CANDIDATE_DB_DATA.avatarUrl);
        else setProfilePicPreview(null);
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

    // Determine which set of AI data to use
    const useNewAiData = !!form.getValues("resume") && !!extractedTextFromResume && !!generatedEmbedding;
    
    const finalExtractedText = useNewAiData ? extractedTextFromResume : initialAiData.text;
    const finalEmbedding = useNewAiData ? generatedEmbedding : initialAiData.embedding;
    const finalSkills = useNewAiData ? extractedSkills : initialAiData.skills;

    if (!finalExtractedText || !finalEmbedding) {
        toast({ variant: "destructive", title: "AI Data Missing", description: "Essential AI processed data (text or embedding) is missing. Please ensure resume processing was successful or re-upload."});
        setIsLoading(false);
        return;
    }
    
    const firestoreData = {
        fullName: data.fullName,
        email: data.email,
        currentTitle: data.currentTitle,
        extractedResumeText: finalExtractedText,
        resumeEmbedding: finalEmbedding,
        skills: finalSkills,
        phone: data.phone,
        linkedinProfile: data.linkedinProfile,
        portfolioUrl: data.portfolioUrl,
        experienceSummary: data.experienceSummary,
        // avatarUrl and videoIntroUrl would need to be updated based on file uploads to a storage service
        // For this simulation, we are not handling file uploads to cloud storage.
        // We'll use the existing MOCK_CANDIDATE_DB_DATA.avatarUrl if no new picture, otherwise null.
        avatarUrl: form.getValues("profilePicture") ? "(New picture uploaded - URL TBD)" : MOCK_CANDIDATE_DB_DATA.avatarUrl,
        videoIntroUrl: form.getValues("videoIntroduction") ? "(New video uploaded - URL TBD)" : MOCK_CANDIDATE_DB_DATA.videoIntroUrl,
    };

    try {
      console.log("Updated candidate data for submission:", data);
      console.log("Final Extracted Resume Text:", finalExtractedText.substring(0,100) + "...");
      if (finalEmbedding) console.log("Final Generated Embedding vector length:", finalEmbedding.length);

      toast({ title: "Updating Candidate Data...", description: "Preparing data for storage." });
      const saveResult = await saveCandidateWithEmbedding(candidateId, firestoreData);

      if (saveResult.success) {
         toast({
            title: "Profile Updated! (Simulated)",
            description: `${data.fullName}'s profile has been successfully updated. ${saveResult.message}`,
            action: <Save className="text-primary" />,
        });
        // Optionally update initialAiData if new resume was successfully processed and saved
        if (useNewAiData) {
            setInitialAiData({ text: finalExtractedText, skills: finalSkills, embedding: finalEmbedding });
        }
        router.push(`/candidates/${candidateId}`);
      } else {
        throw new Error(saveResult.message);
      }
    } catch (error) {
      console.error("Error during candidate update:", error);
      toast({ variant: "destructive", title: "Update Failed", description: error instanceof Error ? error.message : "Could not update candidate data." });
    } finally {
      setIsLoading(false);
    }
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof CandidateFormValues)[] = [];
    if (currentStep === 1) fieldsToValidate = ['fullName', 'email', 'currentTitle'];
    if (currentStep === 2) fieldsToValidate = ['experienceSummary'];
    // No validation for resume at step 3 if it's optional to change
    // if (currentStep === 4) { // File uploads are optional for edit
    // }

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

  // Determine display values for skills and embedding status
  const displaySkills = form.getValues("resume") && extractedSkills.length > 0 ? extractedSkills : initialAiData.skills;
  const displayEmbeddingStatus = (form.getValues("resume") && generatedEmbedding) || (!form.getValues("resume") && initialAiData.embedding);
  const dataSourceMessage = form.getValues("resume") ? "Data from the newly uploaded resume." : "Data from the resume currently on file.";


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

                 {(displaySkills && displaySkills.length > 0) || displayEmbeddingStatus ? (
                    <FormItem>
                      <FormLabel>AI Processed Resume Data</FormLabel>
                      <div className="p-3 border rounded-md bg-muted/50 space-y-3">
                        {displaySkills && displaySkills.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Extracted Skills:</h4>
                                <div className="flex flex-wrap gap-2">
                                {displaySkills.map((skill, index) => (
                                    <Badge key={index} variant="secondary">{skill}</Badge>
                                ))}
                                </div>
                            </div>
                        )}
                        {displayEmbeddingStatus && (
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Embedding Status:</h4>
                                <div className="flex items-center text-green-600 text-xs">
                                    <Brain className="mr-2 h-4 w-4" />
                                    <span>Text embedding is available.</span>
                                </div>
                            </div>
                        )}
                         <p className="text-xs text-muted-foreground mt-2 italic">
                            {dataSourceMessage}
                         </p>
                      </div>
                    </FormItem>
                  ) : null}
                </section>
              )}


              {currentStep === 4 && (
                <section className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="w-32 h-32 border-4 border-primary/30">
                      <AvatarImage src={profilePicPreview || undefined} alt="Profile Preview" data-ai-hint="profile avatar"/>
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
