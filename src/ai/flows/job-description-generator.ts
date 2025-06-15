
'use server';

/**
 * @fileOverview Job description generator AI agent.
 *
 * - generateJobDescription - A function that handles the job description generation process.
 * - GenerateJobDescriptionInput - The input type for the generateJobDescription function.
 * - GenerateJobDescriptionOutput - The return type for the generateJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateJobDescriptionInputSchema = z.object({
  jobTitle: z.string().describe('The title of the job.'),
  jobLevel: z.string().describe('The level of the job (e.g., Entry, Mid, Senior).'),
  department: z.string().describe('The department the job belongs to.'),
  location: z.string().describe('The location of the job.'),
  responsibilities: z.string().describe('A list of responsibilities for the job, potentially as bullet points or comma-separated items.'),
  qualifications: z.string().describe('A list of qualifications for the job, potentially as bullet points or comma-separated items.'),
});
export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchema>;

const GenerateJobDescriptionOutputSchema = z.object({
  jobDescription: z.string().describe('The generated job description, formatted professionally and ready to be posted.'),
});
export type GenerateJobDescriptionOutput = z.infer<typeof GenerateJobDescriptionOutputSchema>;

export async function generateJobDescription(
  input: GenerateJobDescriptionInput
): Promise<GenerateJobDescriptionOutput> {
  return generateJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobDescriptionPrompt',
  input: {schema: GenerateJobDescriptionInputSchema},
  output: {schema: GenerateJobDescriptionOutputSchema},
  prompt: `You are an expert HR copywriter specializing in creating compelling job descriptions that attract top talent.

  Based on the following information, generate a comprehensive, professional, and engaging job description. The description should be well-structured, highlight the key aspects of the role, and entice qualified candidates to apply.

  Job Title: {{{jobTitle}}}
  Job Level: {{{jobLevel}}}
  Department: {{{department}}}
  Location: {{{location}}}

  Key Responsibilities (ensure these are clearly listed and elaborated upon if needed):
  {{{responsibilities}}}

  Key Qualifications (ensure these are clearly listed and elaborated upon if needed):
  {{{qualifications}}}

  Structure the output with clear sections like "About Us" (you can make a generic positive statement if company info isn't provided), "Role Overview", "Key Responsibilities", "Qualifications", and "Why Join Us?" or "Benefits" (again, generic positive statements if not provided).
  Ensure the tone is professional yet inviting.
  `,
});

const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

