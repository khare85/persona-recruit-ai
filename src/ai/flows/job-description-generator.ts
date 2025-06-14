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
  responsibilities: z.string().describe('A list of responsibilities for the job.'),
  qualifications: z.string().describe('A list of qualifications for the job.'),
});
export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchema>;

const GenerateJobDescriptionOutputSchema = z.object({
  jobDescription: z.string().describe('The generated job description.'),
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
  prompt: `You are an expert recruiter specializing in writing job descriptions.

  You will use the following information to generate a compelling job description.

  Job Title: {{{jobTitle}}}
  Job Level: {{{jobLevel}}}
  Department: {{{department}}}
  Location: {{{location}}}
  Responsibilities: {{{responsibilities}}}
  Qualifications: {{{qualifications}}}

  Write a job description that is attractive to potential candidates.
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
