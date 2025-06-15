
'use server';

/**
 * @fileOverview Generates an enhanced report with behavioral analysis, audio transcript highlights, suitability justifications, and competency scores from video interviews.
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

const CompetencyScoreSchema = z.object({
  name: z.string().describe("Name of the competency (e.g., Communication, Problem Solving, Technical Acumen)."),
  score: z.number().min(1).max(5).describe("Score for the competency, on a scale of 1 (Needs Development) to 5 (Exceptional)."),
  justification: z.string().optional().describe("Brief justification for the score, if applicable (1-2 sentences).")
});

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
  }).describe("A structured assessment of the candidate's suitability for the role."),
  competencyScores: z.array(CompetencyScoreSchema).describe("An array of key competency scores (e.g., Communication, Problem Solving, Technical Fit, Teamwork, Leadership Potential). Aim for 3-5 core competencies relevant to most professional roles, each scored 1-5.")
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
  4.  **Competency Scores**: Evaluate the candidate on 3-5 core professional competencies (such as Communication, Problem Solving, Technical Acumen relevant to the role, Teamwork, Leadership Potential if evident). For each competency, provide a name, a score from 1 (Needs Development) to 5 (Exceptional), and optionally a very brief justification for the score.

  Ensure the output strictly adheres to the VideoInterviewAnalysisReportOutputSchema.
  `,
});

const videoInterviewAnalysisReportFlow = ai.defineFlow(
  {
    name: 'videoInterviewAnalysisReportFlow',
    inputSchema: VideoInterviewAnalysisReportInputSchema,
    outputSchema: VideoInterviewAnalysisReportOutputSchema,
  },
  async (input): Promise<VideoInterviewAnalysisReportOutput> => {
    const {output} = await prompt(input);

    if (!output) {
        console.error(`[videoInterviewAnalysisReportFlow] - Prompt did not return an output for input (video URI length: ${input.videoDataUri.length}, JD length: ${input.jobDescription.length}).`);
        throw new Error('AI prompt failed to return expected video interview analysis report.');
    }
    
    // Ensure competency scores are within 1-5, clamp if necessary
    if (output.competencyScores) {
        output.competencyScores.forEach(comp => {
            if (comp.score < 1) comp.score = 1;
            if (comp.score > 5) comp.score = 5;
        });
    }
    return output;
  }
);

    
