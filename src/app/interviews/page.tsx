
"use client";

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/shared/Container';
import { useToast } from '@/hooks/use-toast';
import { generateVideoInterviewAnalysisReport, VideoInterviewAnalysisReportInput, VideoInterviewAnalysisReportOutput } from '@/ai/flows/video-interview-analysis';
import { UploadCloud, Video, Loader2, Brain, FileText, CheckCircle, Eye, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        form.setValue('videoFile', file);
        if (file.size > 100 * 1024 * 1024) { // Example: 100MB limit
            toast({ variant: "destructive", title: "File Too Large", description: "Video file should be under 100MB." });
            form.setValue('videoFile', undefined as any); // Reset if too large
            setVideoFileName(null);
        }
      } else {
        toast({ variant: "destructive", title: "Invalid File Type", description: "Please upload a valid video file." });
        form.setValue('videoFile', undefined as any);
        setVideoFileName(null);
      }
    }
  };
  
  // Helper to convert File to Data URI
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
                render={({ field }) => (
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
            <h2 className="text-2xl font-headline font-semibold mb-4">Analysis Report</h2>
            <Tabs defaultValue="behavioral" className="w-full">
              <TabsList className="grid w-full grid-cols-4"> {/* Adjusted for 4 tabs */}
                <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
                <TabsTrigger value="transcript">Highlights</TabsTrigger>
                <TabsTrigger value="suitability">Suitability</TabsTrigger>
                <TabsTrigger value="competencies">Competencies</TabsTrigger>
              </TabsList>
              <TabsContent value="behavioral">
                <Card className="mt-2">
                  <CardHeader><CardTitle>Behavioral Insights</CardTitle></CardHeader>
                  <CardContent className="prose prose-sm max-w-none">
                    <p>{analysisReport.behavioralAnalysis}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="transcript">
                <Card className="mt-2">
                  <CardHeader><CardTitle>Key Transcript Moments</CardTitle></CardHeader>
                  <CardContent className="prose prose-sm max-w-none">
                     <p>{analysisReport.audioTranscriptHighlights}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="suitability">
                <Card className="mt-2">
                  <CardHeader><CardTitle>Suitability Assessment</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Overall Recommendation:</h4>
                        <p className="text-primary font-medium">{analysisReport.suitabilityAssessment.overallRecommendation}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold">Key Strengths:</h4>
                        <ul className="list-disc pl-5 text-sm">
                            {analysisReport.suitabilityAssessment.keyStrengths.map((strength, i) => <li key={`strength-${i}`}>{strength}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold">Areas for Development:</h4>
                         <ul className="list-disc pl-5 text-sm">
                            {analysisReport.suitabilityAssessment.areasForDevelopment.map((area, i) => <li key={`area-${i}`}>{area}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold">Detailed Justification:</h4>
                        <p className="text-sm">{analysisReport.suitabilityAssessment.detailedJustification}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="competencies">
                 <Card className="mt-2">
                    <CardHeader><CardTitle>Competency Scores</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {analysisReport.competencyScores.map((comp, i) => (
                            <div key={`comp-${i}`}>
                                <div className="flex justify-between items-center">
                                   <h4 className="font-semibold">{comp.name}</h4>
                                   <Badge>{comp.score}/5</Badge>
                                </div>
                                {comp.justification && <p className="text-xs text-muted-foreground mt-0.5">{comp.justification}</p>}
                            </div>
                        ))}
                    </CardContent>
                 </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </Card>

      {/* Recent Interview Analyses */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-6 w-6 text-primary" />
            Recent Interview Analyses
          </CardTitle>
          <CardDescription>
            View detailed AI-powered interview analysis reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-border hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Sarah Johnson</CardTitle>
                    <CardDescription>Senior Frontend Developer</CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-800">87/100</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recommendation:</span>
                    <span className="font-medium text-green-600">Strongly Recommended</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span>June 14, 2024</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>45 minutes</span>
                  </div>
                </div>
                <Link href="/interviews/analysis/1">
                  <Button className="w-full mt-4" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Full Analysis
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-border hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Marcus Chen</CardTitle>
                    <CardDescription>DevOps Engineer</CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-800">91/100</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recommendation:</span>
                    <span className="font-medium text-green-600">Strongly Recommended</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span>June 13, 2024</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>50 minutes</span>
                  </div>
                </div>
                <Link href="/interviews/analysis/2">
                  <Button className="w-full mt-4" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View Full Analysis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
