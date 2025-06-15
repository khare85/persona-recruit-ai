
'use server';

/**
 * @fileOverview Generates an enhanced report with behavioral analysis, audio transcript highlights, and suitability justifications from video interviews.
 *
 * - generateVideoInterviewAnalysisReport - A function that handles the generation of the video interview analysis report.
 * - VideoInterviewAnalysisReportInput - The input type for the generateVideoInterviewAnalysisReport function.
 * - VideoInterviewAnalysisReportOutput - The return type for the generateVideoInterviewAnalysisReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VideoInterviewAnalysisReportInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of a candidate's interview, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  jobDescription: z.string().describe('The job description for the role.'),
  candidateResume: z.string().describe('The candidate resume.'),
  behavioralQuestions: z
    .array(z.string())
    .describe('The behavioral questions asked during the interview.'),
});
export type VideoInterviewAnalysisReportInput = z.infer<
  typeof VideoInterviewAnalysisReportInputSchema
>;

const VideoInterviewAnalysisReportOutputSchema = z.object({
  behavioralAnalysis: z
    .string()
    .describe('A comprehensive behavioral analysis of the candidate based on their responses and demeanor. Should be a paragraph or two.'),
  audioTranscriptHighlights: z
    .string()
    .describe('Key highlighted sections or takeaways from the audio transcript that are most relevant to the candidate\'s skills, experience, and suitability. This should be a summary of important points, not the full transcript.'),
  suitabilityAssessment: z.object({
      keyStrengths: z.array(z.string()).describe('List 3-5 key strengths of the candidate that align with the job description and were evident in the interview.'),
      areasForDevelopment: z.array(z.string()).describe('List 1-3 potential areas for development or concerns observed during the interview, relative to the job requirements.'),
      overallRecommendation: z.enum(["Strongly Recommended", "Recommended", "Recommended with Reservations", "Not Recommended"]).describe("Provide an overall recommendation for the candidate's suitability for the role."),
      detailedJustification: z.string().describe("A detailed justification (3-4 lines) supporting the overall recommendation, synthesizing insights from behavioral analysis, transcript highlights, resume, and job description.")
  }).describe("A structured assessment of the candidate's suitability for the role.")
});
export type VideoInterviewAnalysisReportOutput = z.infer<
  typeof VideoInterviewAnalysisReportOutputSchema
>;

export async function generateVideoInterviewAnalysisReport(
  input: VideoInterviewAnalysisReportInput
): Promise<VideoInterviewAnalysisReportOutput> {
  return videoInterviewAnalysisReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'videoInterviewAnalysisReportPrompt',
  input: {schema: VideoInterviewAnalysisReportInputSchema},
  output: {schema: VideoInterviewAnalysisReportOutputSchema},
  prompt: `You are an expert recruitment analyst AI. Your task is to analyze a video interview and associated documents to provide a comprehensive report.

  Context:
  - Job Description: {{{jobDescription}}}
  - Candidate Resume: {{{candidateResume}}}
  - Behavioral Questions Asked: {{#each behavioralQuestions}}{{{this}}}\n{{/each}}
  - Video Interview: {{media url=videoDataUri}}

  Based on all the provided information, generate a detailed report with the following structure:

  1.  **Behavioral Analysis**: Provide a comprehensive behavioral analysis of the candidate based on their responses, communication style, and overall demeanor observed in the video. This should be a paragraph or two.
  2.  **Audio Transcript Highlights**: Summarize key highlighted sections or takeaways from the audio content of the video interview that are most relevant to the candidate's skills, experience, and suitability for the role. Focus on impactful statements or critical information. Do not provide a full transcript.
  3.  **Suitability Assessment**:
      *   **Key Strengths**: List 3-5 key strengths of the candidate that directly align with the job description and were clearly evident in the interview.
      *   **Areas For Development**: List 1-3 potential areas where the candidate could improve or concerns observed during the interview, specifically relative to the job requirements.
      *   **Overall Recommendation**: Choose one of the following: "Strongly Recommended", "Recommended", "Recommended with Reservations", or "Not Recommended".
      *   **Detailed Justification**: Provide a concise (3-4 lines) justification for your overall recommendation, synthesizing insights from the behavioral analysis, transcript highlights, resume, and job description. Explain *why* you chose that recommendation based on the candidate's performance against the role requirements.

  Ensure the output strictly adheres to the VideoInterviewAnalysisReportOutputSchema.
  `,
});

const videoInterviewAnalysisReportFlow = ai.defineFlow(
  {
    name: 'videoInterviewAnalysisReportFlow',
    inputSchema: VideoInterviewAnalysisReportInputSchema,
    outputSchema: VideoInterviewAnalysisReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
