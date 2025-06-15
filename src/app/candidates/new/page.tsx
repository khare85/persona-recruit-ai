
"use client";

import { useState, useRef, type ChangeEvent } from 'react';
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
import { processResumeWithDocAI, ProcessResumeDocAIInput } from '@/ai/flows/process-resume-document-ai-flow';
import { generateTextEmbedding, GenerateTextEmbeddingInput } from '@/ai/flows/generate-text-embedding-flow'; // Import embedding flow
// import { saveCandidateWithEmbedding } from '@/services/firestoreService'; // Import placeholder Firestore service
import { UploadCloud, UserPlus, Loader2, FileText, Video, CheckCircle, ArrowLeft, ArrowRight, PartyPopper, Brain } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const MAX_STEPS = 4;

const candidateFormSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  currentTitle: z.string().min(2, "Current title is required."),
  linkedinProfile: z.string().url("Invalid LinkedIn URL (e.g., https://linkedin.com/in/yourprofile)").optional().or(z.literal('')),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional().or(z.literal('')),
  experienceSummary: z.string().min(50, "Summary must be at least 50 characters.").max(1000, "Summary cannot exceed 1000 characters."),
  resume: z.custom<File>((val) => val instanceof File, "Resume file is required."),
  profilePicture: z.custom<File>((val) => val instanceof File, "Profile picture is required."),
  videoIntroduction: z.custom<File>((val) => val instanceof File, "10-second video intro is required."),
});

type CandidateFormValues = z.infer<typeof candidateFormSchema>;

export default function NewCandidatePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false); // Combined AI processing state
  const [extractedTextFromResume, setExtractedTextFromResume] = useState<string | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [generatedEmbedding, setGeneratedEmbedding] = useState<number[] | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [videoIntroFileName, setVideoIntroFileName] = useState<string | null>(null);

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

        toast({ title: "Processing Resume...", description: "Using Document AI to extract text. This may take a moment." });
        const docAIResult = await processResumeWithDocAI(docAIInput);

        if (!docAIResult.extractedText) {
          throw new Error("Document AI did not return extracted text.");
        }
        setExtractedTextFromResume(docAIResult.extractedText);
        toast({ title: "Document AI Success", description: "Resume text extracted. Now processing for skills and embedding." });

        // Extract Skills
        const skillInput: ExtractSkillsFromResumeInput = { resumeText: docAIResult.extractedText };
        const skillResult = await extractSkillsFromResume(skillInput);
        setExtractedSkills(skillResult.skills);
        toast({ title: "Skills Extracted", description: "Skills identified from the resume.", action: <CheckCircle className="text-green-500" /> });
        
        // Generate Embedding
        const embeddingInput: GenerateTextEmbeddingInput = { text: docAIResult.extractedText };
        const embeddingResult = await generateTextEmbedding(embeddingInput);
        setGeneratedEmbedding(embeddingResult.embedding);
        toast({ title: "Embedding Generated", description: `Text embedding created using ${embeddingResult.modelUsed}.`, action: <Brain className="text-purple-500" /> });

      } catch (error) {
        console.error("Error processing resume, extracting skills, or generating embedding:", error);
        let errorMessage = "An unexpected error occurred during resume processing.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        toast({ variant: "destructive", title: "Resume Processing Failed", description: errorMessage });
      } finally {
        setIsProcessingAi(false);
      }
    } else {
        setResumeFileName(null);
        setExtractedTextFromResume(null);
        setGeneratedEmbedding(null);
        setExtractedSkills([]);
        form.setValue('resume', undefined as any, { shouldValidate: true });
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
        setProfilePicPreview(null);
        form.setValue('profilePicture', undefined as any, { shouldValidate: true });
    }
  };

  const handleVideoIntroUpload = (file: File | null) => {
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // Example: 50MB limit
        toast({ variant: "destructive", title: "File Too Large", description: "Video intro should be under 50MB." });
        form.setValue('videoIntroduction', undefined as any, { shouldValidate: true });
        setVideoIntroFileName(null);
        if (videoIntroRef.current) videoIntroRef.current.value = "";
      } else {
        form.setValue('videoIntroduction', file, { shouldValidate: true });
        setVideoIntroFileName(file.name);
      }
    } else {
      setVideoIntroFileName(null);
      form.setValue('videoIntroduction', undefined as any, { shouldValidate: true });
    }
  };

  async function onSubmit(data: CandidateFormValues) {
    setIsLoading(true);
    
    // Ensure resume text and embedding are available if a resume was processed
    if (data.resume && (!extractedTextFromResume || !generatedEmbedding)) {
        toast({ variant: "destructive", title: "Processing Incomplete", description: "Resume text or embedding is missing. Please re-upload or wait for processing."});
        setIsLoading(false);
        return;
    }

    console.log("Candidate data for submission:", data);
    if (extractedTextFromResume) console.log("Extracted Resume Text:", extractedTextFromResume.substring(0,100) + "...");
    if (generatedEmbedding) console.log("Generated Embedding vector length:", generatedEmbedding.length);

    // --- INTEGRATION POINT FOR FIRESTORE ---
    // if (extractedTextFromResume && generatedEmbedding) {
    //   const candidateId = Date.now().toString(); // Or generate a proper UUID
    //   const firestoreData = {
    //     fullName: data.fullName,
    //     email: data.email,
    //     currentTitle: data.currentTitle,
    //     extractedResumeText: extractedTextFromResume,
    //     resumeEmbedding: generatedEmbedding,
    //     skills: extractedSkills,
    //     // Add other fields from 'data' as needed by CandidateWithEmbedding interface
    //   };
    //   try {
    //     const saveResult = await saveCandidateWithEmbedding(candidateId, firestoreData);
    //     if (saveResult.success) {
    //       toast({ title: "Candidate Saved to DB", description: `Candidate ID: ${saveResult.candidateId}` });
    //     } else {
    //       throw new Error(saveResult.message);
    //     }
    //   } catch (dbError) {
    //     console.error("Error saving to Firestore:", dbError);
    //     toast({ variant: "destructive", title: "Database Error", description: `Could not save candidate: ${dbError instanceof Error ? dbError.message : String(dbError)}` });
    //     setIsLoading(false);
    //     return;
    //   }
    // }
    // --- END INTEGRATION POINT ---


    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call for other actions

    toast({
      title: "Profile Created! (Simulated)",
      description: `Welcome, ${data.fullName}! Your profile is now active. Next step would be Firestore saving.`,
      action: <PartyPopper className="text-primary" />,
    });
    form.reset();
    setExtractedSkills([]);
    setExtractedTextFromResume(null);
    setGeneratedEmbedding(null);
    setResumeFileName(null);
    setProfilePicPreview(null);
    setVideoIntroFileName(null);
    setCurrentStep(1);
    setIsLoading(false);
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof CandidateFormValues)[] = [];
    if (currentStep === 1) fieldsToValidate = ['fullName', 'email', 'currentTitle'];
    if (currentStep === 2) fieldsToValidate = ['experienceSummary'];
    if (currentStep === 3) fieldsToValidate = ['resume'];
    if (currentStep === 4) fieldsToValidate = ['profilePicture', 'videoIntroduction'];

    const isValid = await form.trigger(fieldsToValidate);
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

  return (
    <Container>
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Create Your Candidate Profile</CardTitle>
          <CardDescription>
            Complete the steps below to build your profile.
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
                        <FormLabel>Resume (PDF, DOC, DOCX, TXT)</FormLabel>
                        <FormControl>
                          <Button type="button" variant="outline" onClick={() => resumeFileRef.current?.click()} className="w-full" disabled={isProcessingAi}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            {resumeFileName ? `Uploaded: ${resumeFileName}` : "Upload Resume"}
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
                         <FormDescription>Document AI will extract text, then skills and embeddings will be generated.</FormDescription>
                        {isProcessingAi && (
                          <div className="flex items-center text-sm text-muted-foreground mt-2">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI processing resume, please wait...
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {extractedSkills.length > 0 && (
                    <FormItem>
                      <FormLabel>AI Extracted Skills</FormLabel>
                      <div className="p-3 border rounded-md bg-muted/50">
                        <div className="flex flex-wrap gap-2">
                          {extractedSkills.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    </FormItem>
                  )}
                  {generatedEmbedding && (
                     <FormItem>
                      <FormLabel>AI Generated Embedding Status</FormLabel>
                      <div className="p-3 border rounded-md bg-muted/50 flex items-center text-green-600">
                        <Brain className="mr-2 h-5 w-5" />
                        <span>Text embedding successfully generated (vector length: {generatedEmbedding.length}).</span>
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
                        {form.getValues("fullName")?.substring(0,2).toUpperCase() || <UserPlus />}
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
                                  <UploadCloud className="mr-2 h-4 w-4" /> {profilePicPreview ? "Change" : "Upload"} Profile Picture
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
                        <FormLabel>10-Second Video Introduction (MP4, MOV, WebM)</FormLabel>
                        <FormControl>
                          <Button type="button" variant="outline" onClick={() => videoIntroRef.current?.click()} className="w-full">
                            <Video className="mr-2 h-4 w-4" />
                            {videoIntroFileName ? `Uploaded: ${videoIntroFileName}` : "Upload Video Intro"}
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
                          A short video (max 10s, 50MB) to introduce yourself. This helps with ID verification and gives a personal touch.
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
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Create Profile
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </Container>
  );
}
