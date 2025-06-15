
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
import { generateResumeSummary, GenerateResumeSummaryInput } from '@/ai/flows/generate-resume-summary-flow';
import { saveCandidateWithEmbedding, uploadFileToStorage } from '@/services/firestoreService';
import { UploadCloud, UserCog, Loader2, FileText, Video, CheckCircle, ArrowLeft, ArrowRight, Save, AlertTriangle, Brain, Edit3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

const MOCK_CANDIDATE_DB_DATA = {
  id: '1',
  fullName: 'Alice Wonderland',
  email: 'alice.w@example.com',
  phone: '(555) 123-4567',
  currentTitle: 'Senior Software Engineer',
  linkedinProfile: 'https://linkedin.com/in/alicewonderland',
  portfolioUrl: 'https://alicew.dev',
  experienceSummary: "Highly skilled and innovative Senior Software Engineer with 8+ years of experience...",
  aiGeneratedSummary: "Alice Wonderland is a seasoned Senior Software Engineer...",
  skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'System Design', 'Agile Methodologies'],
  profilePictureUrl: 'https://placehold.co/150x150.png?a=1',
  videoIntroductionUrl: 'https://placehold.co/320x180.mp4', // Placeholder video URL
  resumeFileUrl: '#mock-resume-link', // Placeholder resume file URL
  extractedResumeText: "Alice Wonderland Senior Software Engineer. Experience: React, Next.js, TypeScript...",
  resumeEmbedding: Array(768).fill(0).map(() => Math.random() * 2 - 1),
};


const candidateFormSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  currentTitle: z.string().min(2, "Current title is required."),
  linkedinProfile: z.string().url("Invalid LinkedIn URL").optional().or(z.literal('')),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional().or(z.literal('')),
  experienceSummary: z.string().min(50, "Summary must be at least 50 characters.").max(1000, "Summary cannot exceed 1000 characters."),
  resumeFile: z.custom<File>((val) => val instanceof File).optional(),
  profilePictureFile: z.custom<File>((val) => val instanceof File).optional(),
  videoIntroductionFile: z.custom<File>((val) => val instanceof File).optional(),
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
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const [extractedTextFromResume, setExtractedTextFromResume] = useState<string | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [generatedEmbedding, setGeneratedEmbedding] = useState<number[] | null>(null);
  const [aiGeneratedSummary, setAiGeneratedSummary] = useState<string | null>(null);
  
  const [resumeFileNameDisplay, setResumeFileNameDisplay] = useState<string | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [videoIntroFileNameDisplay, setVideoIntroFileNameDisplay] = useState<string | null>(null);
  
  const [candidateNotFound, setCandidateNotFound] = useState(false);
  const [initialData, setInitialData] = useState<typeof MOCK_CANDIDATE_DB_DATA | null>(null);


  const resumeFileRef = useRef<HTMLInputElement>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);
  const videoIntroRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
        fullName: '', email: '', phone: '', currentTitle: '',
        linkedinProfile: '', portfolioUrl: '', experienceSummary: '',
    },
    mode: "onChange",
  });

  useEffect(() => {
    setIsDataLoading(true);
    setCandidateNotFound(false);
    // Simulate fetching existing candidate data
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
            setInitialData(data);
            form.reset({
                fullName: data.fullName, email: data.email, phone: data.phone,
                currentTitle: data.currentTitle, linkedinProfile: data.linkedinProfile,
                portfolioUrl: data.portfolioUrl, experienceSummary: data.experienceSummary,
            });
            setProfilePicPreview(data.profilePictureUrl);
            setExtractedSkills(data.skills);
            setExtractedTextFromResume(data.extractedResumeText);
            setGeneratedEmbedding(data.resumeEmbedding);
            setAiGeneratedSummary(data.aiGeneratedSummary);
            // For display purposes, don't set file names for existing files
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


  const fileToBase64ForDocAI = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        if (base64Data) resolve(base64Data);
        else reject(new Error("Failed to extract base64 data."));
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleResumeUpload = async (file: File | null) => {
    if (file) {
      setResumeFileNameDisplay(file.name);
      form.setValue('resumeFile', file, { shouldValidate: true });
      setIsProcessingAi(true);
      // Reset AI data specific to the *new* resume being processed
      setExtractedSkills([]); 
      setExtractedTextFromResume(null);
      setGeneratedEmbedding(null);
      setAiGeneratedSummary(null);

      try {
        const resumeFileBase64 = await fileToBase64ForDocAI(file);
        const docAIInput: ProcessResumeDocAIInput = { resumeFileBase64, mimeType: file.type };
        toast({ title: "Processing New Resume...", description: "Using Document AI..." });
        const docAIResult = await processResumeWithDocAI(docAIInput);
        if (!docAIResult.extractedText) throw new Error("Document AI text extraction failed for new resume.");
        
        setExtractedTextFromResume(docAIResult.extractedText);
        toast({ title: "New Resume Text Extracted", description: "Processing for skills, summary, embedding." });

        const skillResult = await extractSkillsFromResume({ resumeText: docAIResult.extractedText });
        setExtractedSkills(skillResult.skills); 
        toast({ title: "Skills Updated", action: <CheckCircle className="text-green-500" /> });

        const summaryResult = await generateResumeSummary({ resumeText: docAIResult.extractedText });
        setAiGeneratedSummary(summaryResult.summary);
        toast({ title: "AI Summary Updated", action: <Edit3 className="text-blue-500" /> });

        const embeddingResult = await generateTextEmbedding({ text: docAIResult.extractedText });
        setGeneratedEmbedding(embeddingResult.embedding); 
        toast({ title: "Embedding Updated", action: <Brain className="text-purple-500" /> });

      } catch (error) {
        console.error("Error processing new resume:", error);
        toast({ variant: "destructive", title: "Resume Update Failed", description: String(error) });
        // Revert AI data to initial state if new processing fails
        if (initialData) {
            setExtractedTextFromResume(initialData.extractedResumeText);
            setExtractedSkills(initialData.skills);
            setGeneratedEmbedding(initialData.resumeEmbedding);
            setAiGeneratedSummary(initialData.aiGeneratedSummary);
        }
        setResumeFileNameDisplay(null); 
        form.setValue('resumeFile', undefined);
      } finally {
        setIsProcessingAi(false);
      }
    } else { 
        setResumeFileNameDisplay(null); // Clear display name if file removed
        form.setValue('resumeFile', undefined);
        // Revert AI data to initial values if no new file is selected
        if(initialData) {
            setExtractedTextFromResume(initialData.extractedResumeText);
            setExtractedSkills(initialData.skills);
            setGeneratedEmbedding(initialData.resumeEmbedding);
            setAiGeneratedSummary(initialData.aiGeneratedSummary);
        }
    }
  };

  const handleProfilePicUpload = (file: File | null) => {
    if (file) {
      form.setValue('profilePictureFile', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
        form.setValue('profilePictureFile', undefined);
        setProfilePicPreview(initialData?.profilePictureUrl || null); // Revert to initial if file removed
    }
  };

  const handleVideoIntroUpload = (file: File | null) => {
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File Too Large", description: "Video intro < 50MB." });
        form.setValue('videoIntroductionFile', undefined);
        setVideoIntroFileNameDisplay(null);
        if (videoIntroRef.current) videoIntroRef.current.value = "";
      } else {
        form.setValue('videoIntroductionFile', file, { shouldValidate: true });
        setVideoIntroFileNameDisplay(file.name);
      }
    } else {
      setVideoIntroFileNameDisplay(null); // Clear display name if file removed
      form.setValue('videoIntroductionFile', undefined);
    }
  };

  async function onSubmit(data: CandidateFormValues) {
    if (!initialData) {
      toast({ variant: "destructive", title: "Error", description: "Initial candidate data not loaded." });
      return;
    }
    setIsLoading(true);
    setIsUploadingFiles(true);

    let finalExtractedText = extractedTextFromResume;
    let finalEmbedding = generatedEmbedding;
    let finalSkills = extractedSkills;
    let finalAiSummary = aiGeneratedSummary;

    // If a new resume was NOT uploaded, use initial AI data
    if (!data.resumeFile && initialData) {
      finalExtractedText = initialData.extractedResumeText;
      finalEmbedding = initialData.resumeEmbedding;
      finalSkills = initialData.skills;
      finalAiSummary = initialData.aiGeneratedSummary;
    } else if (data.resumeFile && (!finalExtractedText || !finalEmbedding)) {
      // If new resume was selected but AI processing somehow failed or didn't complete for embedding/text
      toast({ variant: "destructive", title: "AI Data Missing", description: "New resume was selected, but essential AI data (text/embedding) is missing."});
      setIsLoading(false);
      setIsUploadingFiles(false);
      return;
    }
    
    let newResumeFileUrl: string | undefined = initialData.resumeFileUrl;
    let newProfilePictureUrl: string | undefined = initialData.profilePictureUrl;
    let newVideoIntroductionUrl: string | undefined = initialData.videoIntroductionUrl;

    try {
      if (data.resumeFile) {
        toast({title: "Uploading New Resume...", description: data.resumeFile.name});
        const resumeBuffer = await fileToBuffer(data.resumeFile);
        const resumePath = `candidates/${candidateId}/resumes/${data.resumeFile.name}`;
        newResumeFileUrl = await uploadFileToStorage(resumeBuffer, resumePath, data.resumeFile.type);
        toast({title: "New Resume Uploaded!", action: <CheckCircle className="text-green-500"/>});
      }
      if (data.profilePictureFile) {
        toast({title: "Uploading New Profile Picture...", description: data.profilePictureFile.name});
        const picBuffer = await fileToBuffer(data.profilePictureFile);
        const picPath = `candidates/${candidateId}/profilePictures/${data.profilePictureFile.name}`;
        newProfilePictureUrl = await uploadFileToStorage(picBuffer, picPath, data.profilePictureFile.type);
        toast({title: "New Profile Picture Uploaded!", action: <CheckCircle className="text-green-500"/>});
      }
      if (data.videoIntroductionFile) {
        toast({title: "Uploading New Video Intro...", description: data.videoIntroductionFile.name});
        const videoBuffer = await fileToBuffer(data.videoIntroductionFile);
        const videoPath = `candidates/${candidateId}/videoIntroductions/${data.videoIntroductionFile.name}`;
        newVideoIntroductionUrl = await uploadFileToStorage(videoBuffer, videoPath, data.videoIntroductionFile.type);
        toast({title: "New Video Intro Uploaded!", action: <CheckCircle className="text-green-500"/>});
      }
      setIsUploadingFiles(false);

      if (!finalExtractedText || !finalEmbedding) throw new Error("Essential AI processed data is missing.");

      const firestoreData = {
          fullName: data.fullName, email: data.email, currentTitle: data.currentTitle,
          extractedResumeText: finalExtractedText, resumeEmbedding: finalEmbedding,
          skills: finalSkills, aiGeneratedSummary: finalAiSummary || data.experienceSummary,
          phone: data.phone, linkedinProfile: data.linkedinProfile, portfolioUrl: data.portfolioUrl,
          experienceSummary: data.experienceSummary,
          resumeFileUrl: newResumeFileUrl, profilePictureUrl: newProfilePictureUrl, videoIntroductionUrl: newVideoIntroductionUrl,
          // availability: data.availability, // Not in form yet
      };
    
      toast({ title: "Updating Candidate Data...", description: "Saving to Firestore." });
      const saveResult = await saveCandidateWithEmbedding(candidateId, firestoreData);

      if (saveResult.success) {
         toast({ title: "Profile Updated!", action: <Save className="text-primary" /> });
         // Update initialData state if new files were uploaded or new AI data was generated
         setInitialData(prev => ({
            ...prev!, ...firestoreData, skills: finalSkills, resumeEmbedding: finalEmbedding, 
            extractedResumeText: finalExtractedText, aiGeneratedSummary: finalAiSummary,
         }));
         // Clear file inputs if new files were successfully processed and URLs updated
         if (data.resumeFile) form.setValue('resumeFile', undefined);
         if (data.profilePictureFile) form.setValue('profilePictureFile', undefined);
         if (data.videoIntroductionFile) form.setValue('videoIntroductionFile', undefined);
         setResumeFileNameDisplay(null);
         setVideoIntroFileNameDisplay(null);
         
         router.push(`/candidates/${candidateId}`);
      } else {
        throw new Error(saveResult.message);
      }
    } catch (error) {
      console.error("Error during candidate update or file upload:", error);
      toast({ variant: "destructive", title: "Update Failed", description: String(error) });
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
        if (form.getValues("resumeFile")) { // Only validate AI processing if a new resume was selected
            if (!extractedTextFromResume || !generatedEmbedding || !aiGeneratedSummary || extractedSkills.length === 0) {
                 toast({ variant: "destructive", title: "AI Processing Incomplete", description: "Ensure new resume processing is complete." });
                 return;
            }
        }
    }
    // No explicit validation for step 4 files as they are optional for edit

    const isValid = fieldsToValidate.length > 0 ? await form.trigger(fieldsToValidate) : true;

    if (isValid && currentStep < MAX_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else if (isValid && currentStep === MAX_STEPS) {
      await form.handleSubmit(onSubmit)();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  if (isDataLoading) return <Container className="flex justify-center items-center min-h-[70vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-4">Loading...</p></Container>;
  if (candidateNotFound) return <Container className="flex justify-center items-center min-h-[70vh]"><Alert variant="destructive"><AlertTriangle /><AlertTitle>Not Found</AlertTitle><AlertDescription>Candidate not found.</AlertDescription></Alert><Button onClick={() => router.push('/candidates')} className="mt-4">Back</Button></Container>;

  const displaySkills = form.getValues("resumeFile") && extractedSkills.length > 0 ? extractedSkills : initialData?.skills || [];
  const displayEmbedding = (form.getValues("resumeFile") && generatedEmbedding) || (!form.getValues("resumeFile") && initialData?.resumeEmbedding);
  const displaySummary = form.getValues("resumeFile") && aiGeneratedSummary ? aiGeneratedSummary : initialData?.aiGeneratedSummary;
  const dataSourceMsg = form.getValues("resumeFile") ? "AI data from newly uploaded resume." : "Current AI data from resume on file.";


  return (
    <Container>
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Edit Candidate Profile</CardTitle>
          <CardDescription>Updating: <span className="font-semibold text-primary">{initialData?.fullName || "candidate"}</span>. Step {currentStep} of {MAX_STEPS}.</CardDescription>
           <Progress value={(currentStep / MAX_STEPS) * 100} className="w-full mt-2 h-2" />
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8 min-h-[300px]">
              {currentStep === 1 && (
                <section className="space-y-6 animate-fadeIn">
                  <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="currentTitle" render={({ field }) => (<FormItem><FormLabel>Current Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </section>
              )}
              {currentStep === 2 && (
                <section className="space-y-6 animate-fadeIn">
                   <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="linkedinProfile" render={({ field }) => (<FormItem><FormLabel>LinkedIn (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="portfolioUrl" render={({ field }) => (<FormItem><FormLabel>Portfolio (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="experienceSummary" render={({ field }) => (<FormItem><FormLabel>Experience Summary (Manual)</FormLabel><FormControl><Textarea className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </section>
              )}
             {currentStep === 3 && (
                <section className="space-y-6 animate-fadeIn">
                  <FormField control={form.control} name="resumeFile" render={() => (
                      <FormItem><FormLabel>Update Resume (Optional)</FormLabel><FormControl>
                          <Button type="button" variant="outline" onClick={() => resumeFileRef.current?.click()} className="w-full" disabled={isProcessingAi || isUploadingFiles}><UploadCloud className="mr-2 h-4 w-4" />{resumeFileNameDisplay ? `New: ${resumeFileNameDisplay}` : "Upload New Resume"}</Button>
                      </FormControl><Input id="resumeFile-upload" type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" ref={resumeFileRef} onChange={(e) => handleResumeUpload(e.target.files ? e.target.files[0] : null)} /><FormDescription>Leave blank to keep current resume. Uploading new replaces AI data.</FormDescription>{isProcessingAi && <div className="text-sm text-muted-foreground mt-2 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI processing new resume...</div>}<FormMessage /></FormItem>
                  )} />
                 {(displaySummary || (displaySkills && displaySkills.length > 0) || displayEmbedding) ? (
                    <FormItem><FormLabel>AI Processed Resume Data</FormLabel><div className="p-4 border rounded-md bg-muted/50 space-y-4">
                        {displaySummary && (<div><h4 className="text-xs font-semibold text-blue-500 mb-1 flex items-center"><Edit3 className="mr-1.5 h-3.5 w-3.5"/>AI Summary:</h4><p className="text-sm prose prose-sm bg-background p-2 rounded">{displaySummary}</p></div>)}
                        {displaySkills && displaySkills.length > 0 && (<div><h4 className="text-xs font-semibold text-muted-foreground mb-1">Skills:</h4><div className="flex flex-wrap gap-2">{displaySkills.map((s, i) => (<Badge key={i} variant="secondary">{s}</Badge>))}</div></div>)}
                        {displayEmbedding && (<div><h4 className="text-xs font-semibold text-muted-foreground mb-1">Embedding:</h4><div className="text-green-600 text-xs flex items-center"><Brain className="mr-2 h-4 w-4" />Text embedding available.</div></div>)}
                        <p className="text-xs text-muted-foreground pt-2 border-t mt-3 italic">{dataSourceMsg}</p>
                    </div></FormItem>
                  ) : null}
                </section>
              )}
              {currentStep === 4 && (
                <section className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="w-32 h-32 border-4"><AvatarImage src={profilePicPreview || undefined} alt="Profile Preview" data-ai-hint="profile avatar"/><AvatarFallback className="text-4xl">{form.getValues("fullName")?.substring(0,2).toUpperCase() || <UserCog />}</AvatarFallback></Avatar>
                    <FormField control={form.control} name="profilePictureFile" render={() => (
                        <FormItem className="w-full max-w-sm"><FormLabel htmlFor="profilePicFile-upload" className="sr-only">Profile Picture</FormLabel><FormControl>
                          <Button type="button" variant="outline" onClick={() => profilePicRef.current?.click()} className="w-full" disabled={isUploadingFiles}><UploadCloud className="mr-2 h-4 w-4" /> {form.getValues("profilePictureFile")?.name ? `New: ${form.getValues("profilePictureFile")!.name}` : "Update Profile Picture"}</Button>
                        </FormControl><Input id="profilePicFile-upload" type="file" accept="image/*" className="hidden" ref={profilePicRef} onChange={(e) => handleProfilePicUpload(e.target.files ? e.target.files[0] : null)} /><FormDescription>Leave blank to keep current picture.</FormDescription><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="videoIntroductionFile" render={() => (
                      <FormItem><FormLabel>Update 10s Video Intro (Optional)</FormLabel><FormControl>
                          <Button type="button" variant="outline" onClick={() => videoIntroRef.current?.click()} className="w-full" disabled={isUploadingFiles}><Video className="mr-2 h-4 w-4" />{videoIntroFileNameDisplay ? `New: ${videoIntroFileNameDisplay}` : "Upload New Video Intro"}</Button>
                      </FormControl><Input id="videoIntroFile-upload" type="file" accept="video/*" className="hidden" ref={videoIntroRef} onChange={(e) => handleVideoIntroUpload(e.target.files ? e.target.files[0] : null)} /><FormDescription>Max 10s, 50MB. Leave blank to keep current.</FormDescription><FormMessage /></FormItem>
                  )} />
                </section>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1 || isLoading || isProcessingAi || isUploadingFiles}><ArrowLeft className="mr-2 h-4 w-4" />Previous</Button>
              {currentStep < MAX_STEPS ? (
                <Button type="button" onClick={nextStep} disabled={isLoading || isProcessingAi || isUploadingFiles}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
              ) : (
                <Button type="submit" disabled={isLoading || isProcessingAi || isUploadingFiles} size="lg">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Changes</Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </Container>
  );
}
