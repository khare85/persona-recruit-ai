'use server';

/**
 * @fileOverview A candidate-job matching AI agent.
 *
 * - candidateJobMatcher - A function that handles the candidate job matching process.
 * - CandidateJobMatcherInput - The input type for the candidateJobMatcher function.
 * - CandidateJobMatcherOutput - The return type for the candidateJobMatcher function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CandidateJobMatcherInputSchema = z.object({
  candidateProfile: z
    .string()
    .describe('The detailed profile of the candidate including skills, experience, and qualifications.'),
  jobDescription: z.string().describe('The detailed description of the job vacancy.'),
});
export type CandidateJobMatcherInput = z.infer<typeof CandidateJobMatcherInputSchema>;

const CandidateJobMatcherOutputSchema = z.object({
  matchScore: z
    .number()
    .describe(
      'A score (0-1) indicating the degree of match between the candidate and the job, where 1 is a perfect match.'
    ),
  justification: z
    .string()
    .describe('A detailed justification of the match score, explaining why the candidate is or is not a good fit.'),
});
export type CandidateJobMatcherOutput = z.infer<typeof CandidateJobMatcherOutputSchema>;

export async function candidateJobMatcher(input: CandidateJobMatcherInput): Promise<CandidateJobMatcherOutput> {
  return candidateJobMatcherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'candidateJobMatcherPrompt',
  input: {schema: CandidateJobMatcherInputSchema},
  output: {schema: CandidateJobMatcherOutputSchema},
  prompt: `You are an expert recruiter specializing in matching candidates to job vacancies.

You will use the candidate profile and job description to determine how well the candidate matches the job vacancy.

You will output a match score between 0 and 1, where 1 is a perfect match.

You will also provide a justification for the score, explaining why the candidate is or is not a good fit.

Candidate Profile: {{{candidateProfile}}}

Job Description: {{{jobDescription}}}
`,
});

const candidateJobMatcherFlow = ai.defineFlow(
  {
    name: 'candidateJobMatcherFlow',
    inputSchema: CandidateJobMatcherInputSchema,
    outputSchema: CandidateJobMatcherOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
