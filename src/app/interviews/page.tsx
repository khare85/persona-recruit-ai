
"use client";

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Container } from '@/components/shared/Container';
import { useToast } from '@/hooks/use-toast';
import { generateVideoInterviewAnalysisReport, VideoInterviewAnalysisReportInput, VideoInterviewAnalysisReportOutput } from '@/ai/flows/video-interview-analysis';
import { UploadCloud, Video, Loader2, Brain, FileText, CheckCircle, Eye, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

const interviewAnalysisSchema = z.object({
  videoFile: z.custom<File>((val) => val instanceof File, "Video file is required."),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters."),
  candidateResume: z.string().min(50, "Candidate resume summary must be at least 50 characters."),
  behavioralQuestions: z.string().min(20, "At least one behavioral question is required.").transform(val => val.split('\n').filter(q => q.trim() !== '')),
});

type InterviewAnalysisFormValues = z.infer<typeof interviewAnalysisSchema>;


export default function InterviewAnalysisPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<VideoInterviewAnalysisReportOutput | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<InterviewAnalysisFormValues>({
    resolver: zodResolver(interviewAnalysisSchema),
    defaultValues: {
      jobDescription: '',
      candidateResume: '',
      behavioralQuestions: '',
    },
  });

  const handleVideoUpload = (file: File | null) => {
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFileName(file.name);
        form.setValue('videoFile', file, { shouldValidate: true });
        if (file.size > 100 * 1024 * 1024) { // Example: 100MB limit
            toast({ variant: "destructive", title: "File Too Large", description: "Video file should be under 100MB." });
            form.setValue('videoFile', undefined as any, { shouldValidate: true }); 
            setVideoFileName(null);
        }
      } else {
        toast({ variant: "destructive", title: "Invalid File Type", description: "Please upload a valid video file." });
        form.setValue('videoFile', undefined as any, { shouldValidate: true });
        setVideoFileName(null);
      }
    } else {
        setVideoFileName(null);
        form.setValue('videoFile', undefined as any, { shouldValidate: true });
    }
  };
  
  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  async function onSubmit(data: InterviewAnalysisFormValues) {
    setIsLoading(true);
    setAnalysisReport(null);

    try {
      if (!data.videoFile) {
          toast({ variant: "destructive", title: "Missing File", description: "Please upload a video file." });
          setIsLoading(false);
          return;
      }
      const videoDataUri = await fileToDataUri(data.videoFile);
      
      const input: VideoInterviewAnalysisReportInput = {
        videoDataUri,
        jobDescription: data.jobDescription,
        candidateResume: data.candidateResume,
        behavioralQuestions: data.behavioralQuestions,
      };
      
      const report = await generateVideoInterviewAnalysisReport(input);
      setAnalysisReport(report);
      toast({
        title: "Analysis Complete!",
        description: "Video interview report generated successfully.",
        action: <CheckCircle className="text-green-500" />,
      });

    } catch (error) {
      console.error("Error generating interview analysis:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not generate the report. Please check inputs or try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getRecommendationBadgeVariant = (recommendation?: string) => {
    switch (recommendation) {
      case "Strongly Recommended":
        return "default";
      case "Recommended":
        return "secondary";
      case "Recommended with Reservations":
        return "outline";
      case "Not Recommended":
        return "destructive";
      default:
        return "outline";
    }
  };
  
  const getRecommendationIcon = (recommendation?: string) => {
    switch (recommendation) {
      case "Strongly Recommended":
      case "Recommended":
        return <ThumbsUp className="mr-2 h-5 w-5 text-green-500" />;
      case "Recommended with Reservations":
        return <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />;
      case "Not Recommended":
        return <ThumbsDown className="mr-2 h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };


  return (
    <Container>
      <Card className="max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <Brain className="mr-3 h-8 w-8 text-primary" /> AI Video Interview Analysis
          </CardTitle>
          <CardDescription>
            Upload a recorded video interview and provide context. Our AI will generate an enhanced report.
            This is a demo using Genkit flows. Ensure your video is of reasonable length for processing.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="videoFile"
                render={({ field }) => ( // field is not directly used due to custom handler
                  <FormItem>
                    <FormLabel>Interview Video File (MP4, MOV, WebM)</FormLabel>
                    <FormControl>
                       <Button type="button" variant="outline" onClick={() => videoFileRef.current?.click()} className="w-full">
                        <UploadCloud className="mr-2 h-4 w-4" /> 
                        {videoFileName ? `Uploaded: ${videoFileName}` : "Upload Video Interview"}
                      </Button>
                    </FormControl>
                     <Input 
                      id="video-upload" 
                      type="file" 
                      accept="video/mp4,video/quicktime,video/webm" 
                      className="hidden" 
                      ref={videoFileRef}
                      onChange={(e) => handleVideoUpload(e.target.files ? e.target.files[0] : null)} 
                    />
                    <FormDescription>Max file size: 100MB. Shorter videos process faster.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Paste the full job description here..." className="min-h-[150px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="candidateResume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate Resume / Profile Summary</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Paste the candidate's resume text or a detailed summary here..." className="min-h-[150px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="behavioralQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Behavioral Questions Asked</FormLabel>
                    <FormControl>
                      <Textarea placeholder="List each behavioral question asked on a new line..." className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormDescription>One question per line.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                Analyze Interview
              </Button>
            </CardFooter>
          </form>
        </Form>

        {analysisReport && (
          <div className="p-6 border-t">
            <h2 className="text-2xl font-headline font-semibold mb-4">AI Analysis Report</h2>
            <Tabs defaultValue="suitability" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="suitability">Suitability Assessment</TabsTrigger>
                <TabsTrigger value="behavioral">Behavioral Analysis</TabsTrigger>
                <TabsTrigger value="transcript">Transcript Highlights</TabsTrigger>
              </TabsList>
              <TabsContent value="suitability">
                <Card className="mt-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                        {getRecommendationIcon(analysisReport.suitabilityAssessment.overallRecommendation)}
                        Overall Recommendation:
                        <Badge variant={getRecommendationBadgeVariant(analysisReport.suitabilityAssessment.overallRecommendation)} className="ml-3 text-sm px-3 py-1">
                            {analysisReport.suitabilityAssessment.overallRecommendation}
                        </Badge>
                    </CardTitle>
                     <CardDescription>{analysisReport.suitabilityAssessment.detailedJustification}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-md mb-1">Key Strengths Aligned with Role:</h4>
                        {analysisReport.suitabilityAssessment.keyStrengths.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 pl-2 text-sm text-foreground/80">
                                {analysisReport.suitabilityAssessment.keyStrengths.map((strength, index) => (
                                    <li key={`strength-${index}`}>{strength}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">No specific key strengths highlighted by AI.</p>
                        )}
                    </div>
                     <div>
                        <h4 className="font-semibold text-md mb-1">Potential Areas for Development/Concern:</h4>
                         {analysisReport.suitabilityAssessment.areasForDevelopment.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1 pl-2 text-sm text-foreground/80">
                                {analysisReport.suitabilityAssessment.areasForDevelopment.map((area, index) => (
                                    <li key={`area-${index}`}>{area}</li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-sm text-muted-foreground">No specific areas for development highlighted by AI.</p>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="behavioral">
                <Card className="mt-2">
                  <CardHeader><CardTitle>Behavioral Insights</CardTitle></CardHeader>
                  <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                    <p>{analysisReport.behavioralAnalysis}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="transcript">
                <Card className="mt-2">
                  <CardHeader><CardTitle>Key Transcript Moments</CardTitle></CardHeader>
                  <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                     <p>{analysisReport.audioTranscriptHighlights}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Card>
    </Container>
  );
}
