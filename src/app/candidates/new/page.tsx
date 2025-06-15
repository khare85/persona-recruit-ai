
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
import { generateTextEmbedding, GenerateTextEmbeddingInput } from '@/ai/flows/generate-text-embedding-flow';
import { generateResumeSummary, GenerateResumeSummaryInput } from '@/ai/flows/generate-resume-summary-flow';
import { saveCandidateWithEmbedding, uploadFileToStorage } from '@/services/firestoreService';
import { UploadCloud, UserPlus, Loader2, FileText, Video, CheckCircle, ArrowLeft, ArrowRight, PartyPopper, Brain, Edit3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { randomUUID } from 'crypto'; // Node.js crypto

const MAX_STEPS = 4;

// Helper to convert File to Buffer for server-side upload
const fileToBuffer = (file: File): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        resolve(Buffer.from(event.target.result));
      } else {
        reject(new Error("Failed to read file as ArrayBuffer."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};


const candidateFormSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  currentTitle: z.string().min(2, "Current title is required."),
  linkedinProfile: z.string().url("Invalid LinkedIn URL (e.g., https://linkedin.com/in/yourprofile)").optional().or(z.literal('')),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional().or(z.literal('')),
  experienceSummary: z.string().min(50, "Summary must be at least 50 characters.").max(1000, "Summary cannot exceed 1000 characters."),
  resumeFile: z.custom<File>((val) => val instanceof File, "Resume file is required."),
  profilePictureFile: z.custom<File>((val) => val instanceof File, "Profile picture is required."),
  videoIntroductionFile: z.custom<File>((val) => val instanceof File, "10-second video intro is required."),
});

type CandidateFormValues = z.infer<typeof candidateFormSchema>;

export default function NewCandidatePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const [extractedTextFromResume, setExtractedTextFromResume] = useState<string | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [generatedEmbedding, setGeneratedEmbedding] = useState<number[] | null>(null);
  const [aiGeneratedSummary, setAiGeneratedSummary] = useState<string | null>(null);
  
  const [resumeFileNameDisplay, setResumeFileNameDisplay] = useState<string | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [videoIntroFileNameDisplay, setVideoIntroFileNameDisplay] = useState<string | null>(null);

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

  const fileToBase64ForDocAI = (file: File): Promise<string> => {
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
      setResumeFileNameDisplay(file.name);
      form.setValue('resumeFile', file, { shouldValidate: true });
      setIsProcessingAi(true);
      setExtractedSkills([]);
      setExtractedTextFromResume(null);
      setGeneratedEmbedding(null);
      setAiGeneratedSummary(null);

      try {
        const resumeFileBase64 = await fileToBase64ForDocAI(file);
        const docAIInput: ProcessResumeDocAIInput = {
          resumeFileBase64,
          mimeType: file.type
        };

        toast({ title: "Processing Resume...", description: "Using Document AI to extract text." });
        const docAIResult = await processResumeWithDocAI(docAIInput);

        if (!docAIResult.extractedText) {
          throw new Error("Document AI did not return extracted text.");
        }
        setExtractedTextFromResume(docAIResult.extractedText);
        toast({ title: "Resume Text Extracted", description: "Now processing for skills, summary, and embedding." });

        const skillInput: ExtractSkillsFromResumeInput = { resumeText: docAIResult.extractedText };
        const skillResult = await extractSkillsFromResume(skillInput);
        setExtractedSkills(skillResult.skills);
        toast({ title: "Skills Extracted", description: "Skills identified.", action: <CheckCircle className="text-green-500" /> });
        
        const summaryInput: GenerateResumeSummaryInput = { resumeText: docAIResult.extractedText };
        const summaryResult = await generateResumeSummary(summaryInput);
        setAiGeneratedSummary(summaryResult.summary);
        toast({ title: "AI Summary Generated", description: "Professional summary created.", action: <Edit3 className="text-blue-500" /> });

        const embeddingInput: GenerateTextEmbeddingInput = { text: docAIResult.extractedText };
        const embeddingResult = await generateTextEmbedding(embeddingInput);
        setGeneratedEmbedding(embeddingResult.embedding);
        toast({ title: "Embedding Generated", description: `Text embedding created.`, action: <Brain className="text-purple-500" /> });

      } catch (error) {
        console.error("Error processing resume or generating AI data:", error);
        toast({ variant: "destructive", title: "Resume Processing Failed", description: String(error) });
      } finally {
        setIsProcessingAi(false);
      }
    } else {
        setResumeFileNameDisplay(null);
        setExtractedTextFromResume(null);
        setGeneratedEmbedding(null);
        setExtractedSkills([]);
        setAiGeneratedSummary(null);
        form.setValue('resumeFile', undefined as any, { shouldValidate: true });
    }
  };

  const handleProfilePicUpload = (file: File | null) => {
    if (file) {
      form.setValue('profilePictureFile', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        setProfilePicPreview(null);
        form.setValue('profilePictureFile', undefined as any, { shouldValidate: true });
    }
  };

  const handleVideoIntroUpload = (file: File | null) => {
    if (file) {
      if (file.size > 50 * 1024 * 1024) { 
        toast({ variant: "destructive", title: "File Too Large", description: "Video intro should be under 50MB." });
        form.setValue('videoIntroductionFile', undefined as any, { shouldValidate: true });
        setVideoIntroFileNameDisplay(null);
        if (videoIntroRef.current) videoIntroRef.current.value = "";
      } else {
        form.setValue('videoIntroductionFile', file, { shouldValidate: true });
        setVideoIntroFileNameDisplay(file.name);
      }
    } else {
      setVideoIntroFileNameDisplay(null);
      form.setValue('videoIntroductionFile', undefined as any, { shouldValidate: true });
    }
  };

  async function onSubmit(data: CandidateFormValues) {
    setIsLoading(true);
    setIsUploadingFiles(true);
    
    if (!extractedTextFromResume || !generatedEmbedding) {
        toast({ variant: "destructive", title: "AI Processing Incomplete", description: "Resume text or embedding is missing."});
        setIsLoading(false);
        setIsUploadingFiles(false);
        return;
    }

    // Generate a unique ID for the candidate
    const candidateId = `cand_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    let resumeFileUrl: string | undefined = undefined;
    let profilePictureUrl: string | undefined = undefined;
    let videoIntroductionUrl: string | undefined = undefined;

    try {
      // Upload files to Firebase Storage
      if (data.resumeFile) {
        toast({title: "Uploading Resume...", description: data.resumeFile.name});
        const resumeBuffer = await fileToBuffer(data.resumeFile);
        const resumePath = `candidates/${candidateId}/resumes/${data.resumeFile.name}`;
        resumeFileUrl = await uploadFileToStorage(resumeBuffer, resumePath, data.resumeFile.type);
        toast({title: "Resume Uploaded!", action: <CheckCircle className="text-green-500"/>});
      }
      if (data.profilePictureFile) {
        toast({title: "Uploading Profile Picture...", description: data.profilePictureFile.name});
        const picBuffer = await fileToBuffer(data.profilePictureFile);
        const picPath = `candidates/${candidateId}/profilePictures/${data.profilePictureFile.name}`;
        profilePictureUrl = await uploadFileToStorage(picBuffer, picPath, data.profilePictureFile.type);
        toast({title: "Profile Picture Uploaded!", action: <CheckCircle className="text-green-500"/>});
      }
      if (data.videoIntroductionFile) {
        toast({title: "Uploading Video Intro...", description: data.videoIntroductionFile.name});
        const videoBuffer = await fileToBuffer(data.videoIntroductionFile);
        const videoPath = `candidates/${candidateId}/videoIntroductions/${data.videoIntroductionFile.name}`;
        videoIntroductionUrl = await uploadFileToStorage(videoBuffer, videoPath, data.videoIntroductionFile.type);
        toast({title: "Video Intro Uploaded!", action: <CheckCircle className="text-green-500"/>});
      }
      setIsUploadingFiles(false);
      
      const firestoreData = {
          fullName: data.fullName,
          email: data.email,
          currentTitle: data.currentTitle,
          extractedResumeText: extractedTextFromResume,
          resumeEmbedding: generatedEmbedding,
          skills: extractedSkills,
          aiGeneratedSummary: aiGeneratedSummary || data.experienceSummary,
          phone: data.phone,
          linkedinProfile: data.linkedinProfile,
          portfolioUrl: data.portfolioUrl,
          experienceSummary: data.experienceSummary,
          resumeFileUrl,
          profilePictureUrl,
          videoIntroductionUrl,
      };
      
      toast({ title: "Saving Candidate Data...", description: "Sending details to Firestore." });
      const saveResult = await saveCandidateWithEmbedding(candidateId, firestoreData);

      if (saveResult.success) {
        toast({
          title: "Profile Created & Processed!",
          description: `Welcome, ${data.fullName}! Your profile is live.`,
          action: <PartyPopper className="text-primary" />,
        });
        form.reset();
        setExtractedSkills([]);
        setExtractedTextFromResume(null);
        setGeneratedEmbedding(null);
        setAiGeneratedSummary(null);
        setResumeFileNameDisplay(null);
        setProfilePicPreview(null);
        setVideoIntroFileNameDisplay(null);
        setCurrentStep(1);
      } else {
        throw new Error(saveResult.message);
      }
    } catch (error) {
        console.error("Error during candidate submission or file upload:", error);
        toast({ variant: "destructive", title: "Submission Failed", description: String(error) });
    } finally {
        setIsLoading(false);
        setIsUploadingFiles(false);
    }
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof CandidateFormValues)[] = [];
    if (currentStep === 1) fieldsToValidate = ['fullName', 'email', 'currentTitle'];
    if (currentStep === 2) fieldsToValidate = ['experienceSummary'];
    if (currentStep === 3) {
        fieldsToValidate = ['resumeFile']; // Changed from 'resume'
        if (!extractedTextFromResume || !generatedEmbedding || !aiGeneratedSummary) {
            toast({ variant: "destructive", title: "AI Processing Required", description: "Please ensure resume has been uploaded and all AI processes are complete."});
            return;
        }
    }
    if (currentStep === 4) fieldsToValidate = ['profilePictureFile', 'videoIntroductionFile']; // Changed from 'profilePicture' and 'videoIntroduction'

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
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="e.g., jane.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number (Optional)</FormLabel><FormControl><Input type="tel" placeholder="e.g., (555) 123-4567" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="currentTitle" render={({ field }) => (<FormItem><FormLabel>Current or Most Recent Job Title</FormLabel><FormControl><Input placeholder="e.g., Senior Software Engineer" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </section>
              )}

              {currentStep === 2 && (
                <section className="space-y-6 animate-fadeIn">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="linkedinProfile" render={({ field }) => (<FormItem><FormLabel>LinkedIn Profile URL (Optional)</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/yourprofile" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="portfolioUrl" render={({ field }) => (<FormItem><FormLabel>Portfolio/Website URL (Optional)</FormLabel><FormControl><Input placeholder="https://yourportfolio.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="experienceSummary" render={({ field }) => (<FormItem><FormLabel>Experience Summary / Bio (Manual)</FormLabel><FormControl><Textarea placeholder="Briefly describe your experience..." className="min-h-[120px]" {...field} /></FormControl><FormDescription>Complements AI summary.</FormDescription><FormMessage /></FormItem>)} />
                </section>
              )}

              {currentStep === 3 && (
                <section className="space-y-6 animate-fadeIn">
                  <FormField
                    control={form.control}
                    name="resumeFile"
                    render={() => ( 
                      <FormItem>
                        <FormLabel>Resume (PDF, DOC, DOCX, TXT)</FormLabel>
                        <FormControl>
                          <Button type="button" variant="outline" onClick={() => resumeFileRef.current?.click()} className="w-full" disabled={isProcessingAi || isUploadingFiles}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            {resumeFileNameDisplay ? `Uploaded: ${resumeFileNameDisplay}` : "Upload Resume"}
                          </Button>
                        </FormControl>
                        <Input id="resume-upload" type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" ref={resumeFileRef} onChange={(e) => handleResumeUpload(e.target.files ? e.target.files[0] : null)} />
                        <FormDescription>AI processes: text, skills, summary, embedding.</FormDescription>
                        {isProcessingAi && (<div className="flex items-center text-sm text-muted-foreground mt-2"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI processing resume...</div>)}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {aiGeneratedSummary && (<FormItem><FormLabel>AI Generated Summary</FormLabel><div className="p-3 border rounded-md bg-muted/50 prose prose-sm max-w-none">{aiGeneratedSummary}</div></FormItem>)}
                  {extractedSkills.length > 0 && (<FormItem><FormLabel>AI Extracted Skills</FormLabel><div className="p-3 border rounded-md bg-muted/50 flex flex-wrap gap-2">{extractedSkills.map((skill, index) => (<Badge key={index} variant="secondary">{skill}</Badge>))}</div></FormItem>)}
                  {generatedEmbedding && (<FormItem><FormLabel>AI Embedding Status</FormLabel><div className="p-3 border rounded-md bg-muted/50 text-green-600 flex items-center"><Brain className="mr-2 h-5 w-5" />Embedding generated.</div></FormItem>)}
                </section>
              )}

              {currentStep === 4 && (
                <section className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="w-32 h-32 border-4"><AvatarImage src={profilePicPreview || undefined} alt="Profile Preview" data-ai-hint="profile avatar"/><AvatarFallback className="text-4xl">{form.getValues("fullName")?.substring(0,2).toUpperCase() || <UserPlus />}</AvatarFallback></Avatar>
                    <FormField control={form.control} name="profilePictureFile" render={() => (
                        <FormItem className="w-full max-w-sm"><FormLabel htmlFor="profilePicUpload" className="sr-only">Profile Picture</FormLabel><FormControl>
                            <Button type="button" variant="outline" onClick={() => profilePicRef.current?.click()} className="w-full" disabled={isUploadingFiles}><UploadCloud className="mr-2 h-4 w-4" /> {profilePicPreview ? "Change" : "Upload"} Profile Picture</Button>
                        </FormControl><Input id="profilePicUpload" type="file" accept="image/*" className="hidden" ref={profilePicRef} onChange={(e) => handleProfilePicUpload(e.target.files ? e.target.files[0] : null)} /><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="videoIntroductionFile" render={() => ( 
                      <FormItem><FormLabel>10s Video Intro (MP4, MOV, WebM)</FormLabel><FormControl>
                          <Button type="button" variant="outline" onClick={() => videoIntroRef.current?.click()} className="w-full" disabled={isUploadingFiles}><Video className="mr-2 h-4 w-4" />{videoIntroFileNameDisplay ? `Uploaded: ${videoIntroFileNameDisplay}` : "Upload Video Intro"}</Button>
                      </FormControl><Input id="videoIntroUpload" type="file" accept="video/*" className="hidden" ref={videoIntroRef} onChange={(e) => handleVideoIntroUpload(e.target.files ? e.target.files[0] : null)} /><FormDescription>Max 10s, 50MB. For ID & personality.</FormDescription><FormMessage /></FormItem>
                  )} />
                </section>
              )}

            </CardContent>
            <CardFooter className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1 || isLoading || isProcessingAi || isUploadingFiles}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              {currentStep < MAX_STEPS ? (
                <Button type="button" onClick={nextStep} disabled={isLoading || isProcessingAi || isUploadingFiles}> Next <ArrowRight className="ml-2 h-4 w-4" /> </Button>
              ) : (
                <Button type="submit" disabled={isLoading || isProcessingAi || isUploadingFiles} size="lg">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />} Create Profile
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </Container>
  );
}
