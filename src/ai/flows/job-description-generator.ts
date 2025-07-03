
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
  yearsOfExperience: z.string().describe('The level of experience required for the job (e.g., "3-5 years", "Entry Level").'),
  company: z.string().describe('The name of the company.'),
  department: z.string().optional().describe('The department the job belongs to.'),
  location: z.string().optional().describe('The location of the job.'),
  jobType: z.string().optional().describe('The type of employment (e.g., Full-time).'),
});
export type GenerateJobDescriptionInput = z.infer<typeof GenerateJobDescriptionInputSchema>;

const GenerateJobDescriptionOutputSchema = z.object({
  description: z.string().describe("A comprehensive 2-3 paragraph job description that explains the role, its importance, and what the candidate will be doing."),
  responsibilities: z.array(z.string()).describe("A list of 5-7 key responsibilities."),
  requirements: z.array(z.string()).describe("A list of 6-8 general requirements, including education, experience, and nice-to-have skills."),
  mustHaveRequirements: z.array(z.string()).describe("A list of exactly 4-5 CRITICAL, NON-NEGOTIABLE requirements."),
  skills: z.array(z.string()).describe("A list of 8-12 relevant technical and soft skills."),
  benefits: z.array(z.string()).describe("A list of 6-10 attractive benefits and perks."),
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

  Based on the following information, generate a comprehensive, professional, and engaging job description. Return ONLY a valid JSON object matching the provided schema.

  Job Title: {{{jobTitle}}}
  Experience Required: {{{yearsOfExperience}}}
  Company: {{{company}}}
  {{#if department}}Department: {{{department}}}{{/if}}
  {{#if location}}Location: {{{location}}}{{/if}}
  {{#if jobType}}Job Type: {{{jobType}}}{{/if}}

  Structure your response into the following JSON keys:
  - "description": A comprehensive 2-3 paragraph job description.
  - "responsibilities": An array of 5-7 key responsibilities.
  - "requirements": An array of 6-8 general requirements (nice-to-haves).
  - "mustHaveRequirements": An array of 4-5 CRITICAL, non-negotiable requirements.
  - "skills": An array of 8-12 relevant technical and soft skills.
  - "benefits": An array of 6-10 attractive benefits and perks.

  Ensure the tone is professional yet inviting. Adjust the complexity based on the experience level. For senior roles, emphasize leadership and strategy.
  `,
});

const generateJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateJobDescriptionFlow',
    inputSchema: GenerateJobDescriptionInputSchema,
    outputSchema: GenerateJobDescriptionOutputSchema,
  },
  async (input): Promise<GenerateJobDescriptionOutput> => {
    const {output} = await prompt(input);

    if (!output) {
        console.error(`[generateJobDescriptionFlow] - Prompt did not return an output for input:`, input);
        throw new Error('AI prompt failed to return expected job description output.');
    }
    return output;
  }
);
