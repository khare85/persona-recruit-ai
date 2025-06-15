
'use server';
/**
 * @fileOverview AI-powered talent search engine using semantic search on Firestore embeddings.
 *
 * - aiTalentSemanticSearch - A function that searches for candidates based on a natural language query.
 * - AiTalentSemanticSearchInput - The input type for the function.
 * - AiTalentSemanticSearchOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generateTextEmbedding } from '@/ai/flows/generate-text-embedding-flow';
import { searchCandidatesByEmbedding, CandidateWithEmbeddingFirestore } from '@/services/firestoreService';

// Input schema for the semantic search
const AiTalentSemanticSearchInputSchema = z.object({
  searchQuery: z
    .string()
    .min(10)
    .describe('A natural language query describing the ideal candidate (e.g., job description snippet, key skills).'),
  // filters: z.object({ // Filters are for future enhancement, not used in Firestore query yet
  //   availabilityInDays: z.number().optional(),
  //   isOpenToRemote: z.boolean().optional(),
  //   minExperienceYears: z.number().optional(),
  // }).optional().describe("Optional structured filters to refine the search."),
  resultCount: z.number().min(1).max(20).default(5).describe("Number of top candidate profiles to return."),
});
export type AiTalentSemanticSearchInput = z.infer<typeof AiTalentSemanticSearchInputSchema>;

// Output schema for a single matched candidate from semantic search
const MatchedSemanticCandidateSchema = z.object({
  candidateId: z.string().describe("A unique identifier for the candidate."),
  fullName: z.string().describe("The candidate's full name."),
  currentTitle: z.string().describe("The candidate's current or most recent job title."),
  profileSummaryExcerpt: z.string().optional().describe("A brief excerpt from the candidate's profile (e.g., experience summary)."),
  topSkills: z.array(z.string()).optional().describe("A list of top skills."),
  availability: z.string().optional().describe("Candidate's availability status if known."),
  matchScore: z.number().min(0).max(1).optional().describe("Semantic similarity score (0-1) to the search query, derived from distance. Higher is better."),
  // matchJustification: z.string().optional().describe("Explanation of why this candidate is a good match."), // Future: Use LLM to generate this based on query and profile
});
export type MatchedSemanticCandidate = z.infer<typeof MatchedSemanticCandidateSchema>;

// Output schema for the overall semantic search result
const AiTalentSemanticSearchOutputSchema = z.object({
  matchedCandidates: z.array(MatchedSemanticCandidateSchema).describe('An array of matched candidate profiles from Firestore based on semantic search.'),
  searchSummary: z.string().describe("A brief summary of the semantic search performed."),
});
export type AiTalentSemanticSearchOutput = z.infer<typeof AiTalentSemanticSearchOutputSchema>;


/**
 * Performs a semantic search for candidates in Firestore.
 * @param input The search query and parameters.
 * @returns A list of matched candidates and a search summary.
 */
export async function aiTalentSemanticSearch(input: AiTalentSemanticSearchInput): Promise<AiTalentSemanticSearchOutput> {
  return aiTalentSemanticSearchFlow(input);
}

const aiTalentSemanticSearchFlow = ai.defineFlow(
  {
    name: 'aiTalentSemanticSearchFlow',
    inputSchema: AiTalentSemanticSearchInputSchema,
    outputSchema: AiTalentSemanticSearchOutputSchema,
  },
  async ({ searchQuery, resultCount /*, filters */ }): Promise<AiTalentSemanticSearchOutput> => {
    console.log(`[aiTalentSemanticSearchFlow] - Starting semantic search for query: "${searchQuery.substring(0,50)}...", count: ${resultCount}`);

    // 1. Generate embedding for the search query
    let queryEmbeddingResult;
    try {
      queryEmbeddingResult = await generateTextEmbedding({ text: searchQuery });
      if (!queryEmbeddingResult || !queryEmbeddingResult.embedding) {
        throw new Error('Failed to generate embedding for the search query.');
      }
      console.log(`[aiTalentSemanticSearchFlow] - Query embedding generated using model: ${queryEmbeddingResult.modelUsed}`);
    } catch (error) {
        console.error('[aiTalentSemanticSearchFlow] - Error generating query embedding:', error);
        throw new Error(`Failed to process search query: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // 2. Search candidates in Firestore using the embedding
    let firestoreCandidates: (Partial<CandidateWithEmbeddingFirestore> & { distance?: number })[] = [];
    try {
      firestoreCandidates = await searchCandidatesByEmbedding(queryEmbeddingResult.embedding, resultCount);
      console.log(`[aiTalentSemanticSearchFlow] - Found ${firestoreCandidates.length} candidates from Firestore search.`);
    } catch (error) {
        console.error('[aiTalentSemanticSearchFlow] - Error searching candidates in Firestore:', error);
        // Do not re-throw, allow to return empty results or a partial list if some were found before error.
        // The service itself logs the detailed error.
    }

    // 3. Transform Firestore results to the output schema
    const matchedCandidates: MatchedSemanticCandidate[] = firestoreCandidates.map(candidate => {
      let matchScore: number | undefined = undefined;
      if (typeof candidate.distance === 'number') {
        // Cosine distance is 0 (identical) to 2 (opposite). Score: 1 - (distance / 2)
        // Smaller distance = higher score.
        matchScore = Math.max(0, 1 - (candidate.distance / 2)); 
      }

      return {
        candidateId: candidate.candidateId || 'unknown-id', // Fallback, though candidateId should always exist
        fullName: candidate.fullName || 'N/A',
        currentTitle: candidate.currentTitle || 'N/A',
        profileSummaryExcerpt: candidate.experienceSummary,
        topSkills: candidate.skills || [],
        availability: candidate.availability,
        matchScore: matchScore,
      };
    }).filter(c => c.candidateId !== 'unknown-id'); // Filter out any malformed entries

    const searchSummary = `Found ${matchedCandidates.length} candidate(s) semantically matching your query.`;
    console.log(`[aiTalentSemanticSearchFlow] - ${searchSummary}`);

    return {
      matchedCandidates,
      searchSummary,
    };
  }
);
