'use server';
/**
 * @fileOverview AI-powered job recommendation engine that suggests jobs based on candidate profile, skills, and experience.
 *
 * - jobRecommendationEngine - A function that handles the job recommendation process.
 * - JobRecommendationInput - The input type for the jobRecommendationEngine function.
 * - JobRecommendationOutput - The return type for the jobRecommendationEngine function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JobRecommendationInputSchema = z.object({
  candidateProfile: z
    .string()
    .describe('The detailed profile of the candidate, including skills, experience, and preferences.'),
  jobMarketData: z
    .string()
    .describe('The current state of the job market, including available positions and industry trends.'),
  candidateSkills: z
    .array(z.string())
    .describe('An array of candidate skills extracted from resume.'),
});
export type JobRecommendationInput = z.infer<typeof JobRecommendationInputSchema>;

const JobRecommendationOutputSchema = z.object({
  recommendedJobs: z
    .array(z.string())
    .describe('A list of job recommendations based on the candidate profile and job market data.'),
  reasoning: z
    .string()
    .describe('Explanation of why those jobs were recommended based on skills and experience.'),
});
export type JobRecommendationOutput = z.infer<typeof JobRecommendationOutputSchema>;

export async function jobRecommendationEngine(input: JobRecommendationInput): Promise<JobRecommendationOutput> {
  return jobRecommendationEngineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'jobRecommendationPrompt',
  input: {schema: JobRecommendationInputSchema},
  output: {schema: JobRecommendationOutputSchema},
  prompt: `You are an AI job recommendation engine. Based on the candidate's profile, skills, and experience, and the current job market, provide a list of recommended jobs.

Candidate Profile: {{{candidateProfile}}}
Candidate Skills: {{#each candidateSkills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Job Market Data: {{{jobMarketData}}}

Consider the candidate's skills, experience, and preferences when recommending jobs. Also, consider the current job market and industry trends.  Explain your reasoning for recommending each job based on the candidate's qualifications.
`,
});

const jobRecommendationEngineFlow = ai.defineFlow(
  {
    name: 'jobRecommendationEngineFlow',
    inputSchema: JobRecommendationInputSchema,
    outputSchema: JobRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
