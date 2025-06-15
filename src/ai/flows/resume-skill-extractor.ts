
'use server';

/**
 * @fileOverview A resume skill extraction AI agent.
 *
 * - extractSkillsFromResume - A function that handles the resume skill extraction process.
 * - ExtractSkillsFromResumeInput - The input type for the extractSkillsFromResume function.
 * - ExtractSkillsFromResumeOutput - The return type for the extractSkillsFromResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractSkillsFromResumeInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume.'),
});
export type ExtractSkillsFromResumeInput = z.infer<typeof ExtractSkillsFromResumeInputSchema>;

const ExtractSkillsFromResumeOutputSchema = z.object({
  skills: z.array(z.string()).describe('An array of skills extracted from the resume.'),
});
export type ExtractSkillsFromResumeOutput = z.infer<typeof ExtractSkillsFromResumeOutputSchema>;

export async function extractSkillsFromResume(input: ExtractSkillsFromResumeInput): Promise<ExtractSkillsFromResumeOutput> {
  return extractSkillsFromResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractSkillsFromResumePrompt',
  input: {schema: ExtractSkillsFromResumeInputSchema},
  output: {schema: ExtractSkillsFromResumeOutputSchema},
  prompt: `You are an expert in resume analysis and skill extraction.

  Given the following resume text, extract a list of skills that the candidate possesses.

  Resume Text: {{{resumeText}}}

  Skills:`, 
});

const extractSkillsFromResumeFlow = ai.defineFlow(
  {
    name: 'extractSkillsFromResumeFlow',
    inputSchema: ExtractSkillsFromResumeInputSchema,
    outputSchema: ExtractSkillsFromResumeOutputSchema,
  },
  async (input): Promise<ExtractSkillsFromResumeOutput> => {
    const {output} = await prompt(input);

    if (!output) {
        console.error(`[extractSkillsFromResumeFlow] - Prompt did not return an output for input (resume text length: ${input.resumeText.length}).`);
        // For skill extraction, returning an empty array of skills might be a graceful failure if schema allows
        // However, to be consistent with other flows, we'll throw an error if the output structure isn't met.
        // If the schema required skills to be non-empty, this would be more critical.
        // If skills can be empty, we could return { skills: [] } but the AI should ideally return that structure.
        throw new Error('AI prompt failed to return expected skills output.');
    }
    return output;
  }
);

    