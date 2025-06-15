
"use client";

import { useState, useRef } from 'react';
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
import { UploadCloud, UserPlus, Loader2, FileText, Video, CheckCircle, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const candidateFormSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  currentTitle: z.string().min(2, "Current title is required."),
  linkedinProfile: z.string().url("Invalid LinkedIn URL (e.g., https://linkedin.com/in/yourprofile)").optional().or(z.literal('')),
  portfolioUrl: z.string().url("Invalid portfolio URL").optional().or(z.literal('')),
  experienceSummary: z.string().min(50, "Summary must be at least 50 characters.").max(1000, "Summary cannot exceed 1000 characters."),
  resume: z.custom<File>((val) => val instanceof File, "Resume file is required."),
  profilePicture: z.custom<File>((val) => val instanceof File, "Profile picture is required.").optional(),
  videoIntroduction: z.custom<File>((val) => val instanceof File, "10-second video intro is required."),
});

type CandidateFormValues = z.infer<typeof candidateFormSchema>;

export default function NewCandidatePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
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
  });

  const handleResumeUpload = async (file: File) => {
    if (file) {
      setResumeFileName(file.name);
      form.setValue('resume', file); // Set file in react-hook-form
      setIsParsingResume(true);
      setExtractedSkills([]);
      try {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = async (e) => {
          const resumeText = e.target?.result as string;
          if (resumeText) {
            const input: ExtractSkillsFromResumeInput = { resumeText };
            const result = await extractSkillsFromResume(input);
            setExtractedSkills(result.skills);
            toast({ title: "Resume Parsed", description: "Skills extracted successfully.", action: <CheckCircle className="text-green-500" /> });
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
    }
  };

  const handleProfilePicUpload = (file: File | null) => {
    if (file) {
      form.setValue('profilePicture', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleVideoIntroUpload = (file: File | null) => {
    if (file) {
      form.setValue('videoIntroduction', file);
      setVideoIntroFileName(file.name);
      if (file.size > 50 * 1024 * 1024) { // Example: 50MB limit
        toast({ variant: "destructive", title: "File Too Large", description: "Video intro should be under 50MB." });
        form.setValue('videoIntroduction', undefined as any); // Reset if too large
        setVideoIntroFileName(null);
      }
    }
  };

  async function onSubmit(data: CandidateFormValues) {
    setIsLoading(true);
    // In a real app, you would upload files to storage and save data to a database
    console.log("Candidate data:", data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Profile Created!",
      description: `Welcome, ${data.fullName}! Your profile is now active.`,
      action: <UserPlus className="text-primary" />,
    });
    form.reset();
    setExtractedSkills([]);
    setResumeFileName(null);
    setProfilePicPreview(null);
    setVideoIntroFileName(null);
    setIsLoading(false);
  }

  return (
    <Container>
      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Create Your Candidate Profile</CardTitle>
          <CardDescription>
            Tell us about yourself. Upload your resume to let our AI extract your skills.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
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
                    render={({ field }) => (
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
                      <Textarea placeholder="Briefly describe your experience and career goals..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resume"
                render={({ field }) => ( /* field is not directly used for input, but for error state */
                  <FormItem>
                    <FormLabel>Resume (PDF, DOC, DOCX)</FormLabel>
                    <FormControl>
                      <Button type="button" variant="outline" onClick={() => resumeFileRef.current?.click()} className="w-full">
                        <UploadCloud className="mr-2 h-4 w-4" /> 
                        {resumeFileName ? `Uploaded: ${resumeFileName}` : "Upload Resume"}
                      </Button>
                    </FormControl>
                    <Input 
                      id="resume-upload" 
                      type="file" 
                      accept=".pdf,.doc,.docx,.txt" 
                      className="hidden" 
                      ref={resumeFileRef}
                      onChange={(e) => e.target.files && handleResumeUpload(e.target.files[0])} 
                    />
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
                  <FormLabel>AI Extracted Skills</FormLabel>
                  <div className="p-3 border rounded-md bg-muted/50">
                    <div className="flex flex-wrap gap-2">
                      {extractedSkills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Review these skills. You can add more or edit them on your profile later.</p>
                  </div>
                </FormItem>
              )}
              
              <FormField
                control={form.control}
                name="videoIntroduction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>10-Second Video Introduction (MP4, MOV)</FormLabel>
                     <FormControl>
                      <Button type="button" variant="outline" onClick={() => videoIntroRef.current?.click()} className="w-full">
                        <Video className="mr-2 h-4 w-4" /> 
                        {videoIntroFileName ? `Uploaded: ${videoIntroFileName}` : "Upload Video Intro"}
                      </Button>
                    </FormControl>
                    <Input 
                      id="video-intro-upload" 
                      type="file" 
                      accept="video/mp4,video/quicktime" 
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

            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isLoading || isParsingResume} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Create Profile
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </Container>
  );
}
