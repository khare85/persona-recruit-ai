
'use server';
/**
 * @fileOverview AI-powered job recommendation engine using semantic search on Firestore job embeddings.
 *
 * - jobRecommendationSemantic - Recommends jobs based on semantic similarity to a candidate's profile.
 * - JobRecommendationSemanticInput - Input type for the function.
 * - JobRecommendationSemanticOutput - Return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generateTextEmbedding } from '@/ai/flows/generate-text-embedding-flow';
import { searchJobsByEmbedding, JobWithEmbeddingFirestore } from '@/services/firestoreService';

// Input schema for the semantic job recommendation
const JobRecommendationSemanticInputSchema = z.object({
  candidateProfileText: z
    .string()
    .min(50)
    .describe('The detailed profile text of the candidate (e.g., resume text, comprehensive summary).'),
  resultCount: z.number().min(1).max(10).default(3).describe("Number of top job recommendations to return."),
});
export type JobRecommendationSemanticInput = z.infer<typeof JobRecommendationSemanticInputSchema>;

// Output schema for a single recommended job from semantic search
const RecommendedSemanticJobSchema = z.object({
  jobId: z.string().describe("A unique identifier for the job."),
  title: z.string().describe("The job title."),
  companyName: z.string().describe("The name of the company posting the job."),
  location: z.string().optional().describe("The job location."),
  // responsibilitiesSummary: z.string().optional().describe("A brief summary of job responsibilities."), // Can add later if needed from Firestore
  matchScore: z.number().min(0).max(1).optional().describe("Semantic similarity score (0-1) to the candidate profile. Higher is better."),
});
export type RecommendedSemanticJob = z.infer<typeof RecommendedSemanticJobSchema>;

// Output schema for the overall job recommendation result
const JobRecommendationSemanticOutputSchema = z.object({
  recommendedJobs: z.array(RecommendedSemanticJobSchema).describe('A list of job recommendations based on semantic similarity to the candidate profile.'),
  reasoning: z.string().describe('Explanation of why these jobs were recommended (based on semantic similarity).'),
});
export type JobRecommendationSemanticOutput = z.infer<typeof JobRecommendationSemanticOutputSchema>;


/**
 * Recommends jobs from Firestore based on semantic similarity to a candidate's profile.
 * @param input The candidate's profile text and desired number of results.
 * @returns A list of recommended jobs and a reasoning statement.
 */
export async function jobRecommendationSemantic(input: JobRecommendationSemanticInput): Promise<JobRecommendationSemanticOutput> {
  return jobRecommendationSemanticFlow(input);
}

const jobRecommendationSemanticFlow = ai.defineFlow(
  {
    name: 'jobRecommendationSemanticFlow',
    inputSchema: JobRecommendationSemanticInputSchema,
    outputSchema: JobRecommendationSemanticOutputSchema,
  },
  async ({ candidateProfileText, resultCount }): Promise<JobRecommendationSemanticOutput> => {
    console.log(`[jobRecommendationSemanticFlow] - Starting semantic job recommendation for profile (length: ${candidateProfileText.length}), count: ${resultCount}`);

    // 1. Generate embedding for the candidate's profile text
    let profileEmbeddingResult;
    try {
      profileEmbeddingResult = await generateTextEmbedding({ text: candidateProfileText });
      if (!profileEmbeddingResult || !profileEmbeddingResult.embedding) {
        throw new Error('Failed to generate embedding for the candidate profile.');
      }
      console.log(`[jobRecommendationSemanticFlow] - Profile embedding generated using model: ${profileEmbeddingResult.modelUsed}`);
    } catch (error) {
        console.error('[jobRecommendationSemanticFlow] - Error generating profile embedding:', error);
        throw new Error(`Failed to process candidate profile: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // 2. Search jobs in Firestore using the profile embedding
    let firestoreJobs: (Partial<JobWithEmbeddingFirestore> & { distance?: number })[] = [];
    try {
      firestoreJobs = await searchJobsByEmbedding(profileEmbeddingResult.embedding, resultCount);
      console.log(`[jobRecommendationSemanticFlow] - Found ${firestoreJobs.length} jobs from Firestore search.`);
    } catch (error) {
        console.error('[jobRecommendationSemanticFlow] - Error searching jobs in Firestore:', error);
    }

    // 3. Transform Firestore results to the output schema
    const recommendedJobs: RecommendedSemanticJob[] = firestoreJobs.map(job => {
      let matchScore: number | undefined = undefined;
      if (typeof job.distance === 'number') {
        // Cosine distance is 0 (identical) to 2 (opposite). Score: 1 - (distance / 2)
        matchScore = Math.max(0, 1 - (job.distance / 2));
      }
      return {
        jobId: job.jobId || 'unknown-job-id',
        title: job.title || 'N/A',
        companyName: job.companyName || 'N/A',
        location: job.location,
        matchScore: matchScore,
      };
    }).filter(j => j.jobId !== 'unknown-job-id');

    const reasoning = `Found ${recommendedJobs.length} job(s) that are semantically similar to your profile.`;
    console.log(`[jobRecommendationSemanticFlow] - ${reasoning}`);

    return {
      recommendedJobs,
      reasoning,
    };
  }
);
