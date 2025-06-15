
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
    .describe('The detailed profile of the candidate including skills, experience, education, projects, and preferences. This could be resume text or structured data.'),
  jobDescription: z.string().describe('The detailed description of the job vacancy, including title, responsibilities, qualifications, and company information.'),
  companyInformation: z.string().describe('Information about the company posting the job, including its culture, values, and industry focus. This helps assess broader fit beyond just technical skills.'),
});
export type CandidateJobMatcherInput = z.infer<typeof CandidateJobMatcherInputSchema>;

const CandidateJobMatcherOutputSchema = z.object({
  matchScore: z
    .number()
    .min(0).max(1)
    .describe(
      'A score (0-1) indicating the degree of match between the candidate and the job, where 1 is a perfect match. The score should reflect how well the candidate\'s skills, experience, qualifications, and potential alignment with company culture (based on provided info) align with the job requirements.'
    ),
  justification: z
    .string()
    .describe('A detailed justification (5-6 lines) of the match score. Explain the key reasons for the determined match level, highlighting specific alignments or gaps between the candidate profile, job description, and company information. Focus on skills, experience, qualifications, and potential company fit.'),
});
export type CandidateJobMatcherOutput = z.infer<typeof CandidateJobMatcherOutputSchema>;

export async function candidateJobMatcher(input: CandidateJobMatcherInput): Promise<CandidateJobMatcherOutput> {
  return candidateJobMatcherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'candidateJobMatcherPrompt',
  input: {schema: CandidateJobMatcherInputSchema},
  output: {schema: CandidateJobMatcherOutputSchema},
  prompt: `You are an expert AI recruitment assistant specializing in evaluating candidate profiles against job descriptions and company contexts. Your task is to provide a precise match score and a concise, insightful justification.

  Analyze the following candidate profile, job description, and company information:

  Candidate Profile:
  {{{candidateProfile}}}

  Job Description:
  {{{jobDescription}}}

  Company Information:
  {{{companyInformation}}}

  Based on your analysis:
  1.  Determine a match score between 0.0 and 1.0, where 1.0 represents a perfect alignment. Consider the candidate's skills, years of experience, specific tool/technology proficiency, educational background, how well they meet the stated qualifications and responsibilities in the job description, and their potential alignment with the company based on the provided company information.
  2.  Provide a clear justification for your score in 5-6 lines. This justification should highlight the most critical factors (both positive and negative if applicable) that influenced the score. Be specific by referencing aspects from the candidate's profile, the job's requirements, and the company's context.

  Return ONLY the match score and the justification in the specified output format.
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
    // Ensure score is within 0-1, clamp if necessary as LLMs might sometimes go slightly out of bounds
    if (output && output.matchScore < 0) output.matchScore = 0;
    if (output && output.matchScore > 1) output.matchScore = 1;
    return output!;
  }
);
