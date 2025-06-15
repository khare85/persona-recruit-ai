
'use server';
/**
 * @fileOverview Generates a professional summary from resume text.
 *
 * - generateResumeSummary - A function that takes resume text and returns a concise summary.
 * - GenerateResumeSummaryInput - The input type for the function.
 * - GenerateResumeSummaryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateResumeSummaryInputSchema = z.object({
  resumeText: z.string().min(100).describe('The full text content of the candidate\'s resume.'),
});
export type GenerateResumeSummaryInput = z.infer<typeof GenerateResumeSummaryInputSchema>;

const GenerateResumeSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise, professionally-written summary of the resume (3-5 sentences).'),
});
export type GenerateResumeSummaryOutput = z.infer<typeof GenerateResumeSummaryOutputSchema>;

export async function generateResumeSummary(input: GenerateResumeSummaryInput): Promise<GenerateResumeSummaryOutput> {
  return generateResumeSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateResumeSummaryPrompt',
  input: {schema: GenerateResumeSummaryInputSchema},
  output: {schema: GenerateResumeSummaryOutputSchema},
  prompt: `You are an expert HR professional and resume writer.
Based on the following resume text, generate a concise and compelling professional summary (approximately 3-5 sentences).
The summary should highlight the candidate's key skills, most relevant experience, and career aspirations if evident.
Focus on creating a summary suitable for a candidate's profile overview.

Resume Text:
{{{resumeText}}}

Professional Summary:
`,
});

const generateResumeSummaryFlow = ai.defineFlow(
  {
    name: 'generateResumeSummaryFlow',
    inputSchema: GenerateResumeSummaryInputSchema,
    outputSchema: GenerateResumeSummaryOutputSchema,
  },
  async (input): Promise<GenerateResumeSummaryOutput> => {
    const {output} = await prompt(input);
    if (!output) {
        console.error(`[generateResumeSummaryFlow] - Prompt did not return an output for resume text (length: ${input.resumeText.length}).`);
        throw new Error('AI prompt failed to return expected resume summary output.');
    }
    return output;
  }
);
