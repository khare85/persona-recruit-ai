
'use server';
/**
 * @fileOverview Advanced AI-powered candidate-to-job matching.
 * This flow first uses semantic search to find potentially relevant candidates
 * and then uses a more detailed LLM-based matching (candidateJobMatcher)
 * to re-rank and provide deeper insights for the top semantic matches.
 *
 * - advancedCandidateJobMatching - The main function to call.
 * - AdvancedCandidateJobMatchingInput - Input type.
 * - AdvancedCandidateJobMatchingOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generateTextEmbedding } from '@/ai/flows/generate-text-embedding-flow';
import { searchCandidatesByEmbedding, CandidateWithEmbeddingFirestore } from '@/services/firestoreService';
import { candidateJobMatcher, CandidateJobMatcherInput, CandidateJobMatcherOutput } from '@/ai/flows/candidate-job-matcher';

// Mock Job Data (for when jobId is provided - replace with actual Firestore lookup in a real app)
const MOCK_JOB_DETAILS_FOR_FLOW: Record<string, { description: string; companyInfo: string; title: string }> = {
  'job1': {
    title: 'Senior Software Engineer (Example)',
    description: `We are seeking a highly skilled Senior Software Engineer with expertise in cloud technologies, distributed systems, and modern JavaScript frameworks. The ideal candidate will have a strong background in designing scalable solutions and a passion for innovation. Responsibilities include leading development projects, mentoring junior engineers, and collaborating with cross-functional teams to deliver high-quality software products. Required skills: Node.js, React, AWS, Kubernetes, Microservices.`,
    companyInfo: `Innovative tech company focused on SaaS solutions. Values collaboration, continuous learning, and impact. Offers competitive salary and benefits. Known for a fast-paced environment and cutting-edge projects.`,
  },
  // Add more mock jobs if needed for testing
};


const AdvancedCandidateJobMatchingInputSchema = z.object({
  jobId: z.string().optional().describe('The ID of the job to match candidates against. If provided, jobDescriptionText and companyInformation might be ignored or fetched.'),
  jobDescriptionText: z.string().optional().describe('The full text of the job description. Required if jobId is not provided or not found.'),
  companyInformation: z.string().optional().describe('Information about the company. Enhances matching for cultural fit. Required if jobId is not provided or not found.'),
  semanticSearchResultCount: z.number().min(5).max(50).default(20).describe("Number of candidates to initially retrieve via semantic search."),
  finalResultCount: z.number().min(1).max(10).default(5).describe("Number of top re-ranked candidates to return."),
});
export type AdvancedCandidateJobMatchingInput = z.infer<typeof AdvancedCandidateJobMatchingInputSchema>;

const RerankedCandidateSchema = z.object({
  candidateId: z.string().describe("A unique identifier for the candidate."),
  fullName: z.string().describe("The candidate's full name."),
  currentTitle: z.string().describe("The candidate's current or most recent job title."),
  profileSummaryExcerpt: z.string().optional().describe("Original summary excerpt from semantic search."),
  semanticMatchScore: z.number().min(0).max(1).optional().describe("Initial semantic similarity score (0-1)."),
  llmMatchScore: z.number().min(0).max(1).describe("Refined match score (0-1) from detailed LLM analysis."),
  llmJustification: z.string().describe("Detailed justification for the LLM match score."),
  topSkills: z.array(z.string()).optional().describe("Candidate's top skills."),
  availability: z.string().optional().describe("Candidate's availability status."),
});
export type RerankedCandidate = z.infer<typeof RerankedCandidateSchema>;

const AdvancedCandidateJobMatchingOutputSchema = z.object({
  rerankedCandidates: z.array(RerankedCandidateSchema).describe('An array of top candidate profiles, re-ranked by LLM analysis.'),
  jobTitleUsed: z.string().optional().describe("The job title used for matching."),
  searchSummary: z.string().describe("A brief summary of the advanced matching process performed."),
});
export type AdvancedCandidateJobMatchingOutput = z.infer<typeof AdvancedCandidateJobMatchingOutputSchema>;


export async function advancedCandidateJobMatching(input: AdvancedCandidateJobMatchingInput): Promise<AdvancedCandidateJobMatchingOutput> {
  return advancedCandidateJobMatchingFlow(input);
}

const advancedCandidateJobMatchingFlow = ai.defineFlow(
  {
    name: 'advancedCandidateJobMatchingFlow',
    inputSchema: AdvancedCandidateJobMatchingInputSchema,
    outputSchema: AdvancedCandidateJobMatchingOutputSchema,
  },
  async ({ jobId, jobDescriptionText: inputJobDesc, companyInformation: inputCompanyInfo, semanticSearchResultCount, finalResultCount }): Promise<AdvancedCandidateJobMatchingOutput> => {
    console.log(`[advancedCandidateJobMatchingFlow] - Starting advanced match. Job ID: ${jobId}, Semantic Count: ${semanticSearchResultCount}, Final Count: ${finalResultCount}`);

    let jobDescToUse: string;
    let companyInfoToUse: string;
    let jobTitleUsed: string | undefined;

    if (jobId && MOCK_JOB_DETAILS_FOR_FLOW[jobId]) {
        // In a real app, fetch job details from Firestore here using jobId
        const mockJob = MOCK_JOB_DETAILS_FOR_FLOW[jobId];
        jobDescToUse = mockJob.description;
        companyInfoToUse = mockJob.companyInfo;
        jobTitleUsed = mockJob.title;
        console.log(`[advancedCandidateJobMatchingFlow] - Using mock job details for ID: ${jobId}`);
    } else if (inputJobDesc && inputCompanyInfo) {
        jobDescToUse = inputJobDesc;
        companyInfoToUse = inputCompanyInfo;
        // Try to extract a title for logging, very basic
        const titleMatch = inputJobDesc.match(/Job Title:\s*(.*)/i);
        jobTitleUsed = titleMatch ? titleMatch[1] : "Job (Details Provided)";
        console.log(`[advancedCandidateJobMatchingFlow] - Using provided job description and company info.`);
    } else {
        throw new Error("Either a valid jobId (with mock data) or jobDescriptionText & companyInformation must be provided.");
    }

    // 1. Generate embedding for the job description
    let jobEmbedding;
    try {
      const embeddingResult = await generateTextEmbedding({ text: jobDescToUse });
      if (!embeddingResult || !embeddingResult.embedding) {
        throw new Error('Failed to generate embedding for the job description.');
      }
      jobEmbedding = embeddingResult.embedding;
      console.log(`[advancedCandidateJobMatchingFlow] - Job description embedding generated.`);
    } catch (error) {
        console.error('[advancedCandidateJobMatchingFlow] - Error generating job embedding:', error);
        throw new Error(`Failed to process job description for embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // 2. Perform initial semantic search for candidates
    let semanticMatches: (Partial<CandidateWithEmbeddingFirestore> & { distance?: number })[] = [];
    try {
      semanticMatches = await searchCandidatesByEmbedding(jobEmbedding, semanticSearchResultCount);
      console.log(`[advancedCandidateJobMatchingFlow] - Found ${semanticMatches.length} candidates via semantic search.`);
      if (semanticMatches.length === 0) {
        return {
          rerankedCandidates: [],
          jobTitleUsed,
          searchSummary: "No candidates found in initial semantic search. Try broadening your job description or checking candidate pool.",
        };
      }
    } catch (error) {
        console.error('[advancedCandidateJobMatchingFlow] - Error during semantic candidate search:', error);
        // Don't re-throw, allow to proceed if some results were found before error, or return empty.
    }

    // 3. Re-rank top N semantic matches using candidateJobMatcher LLM
    const candidatesForReranking = semanticMatches.slice(0, Math.min(semanticMatches.length, semanticSearchResultCount)); // Ensure we don't exceed available
    const rerankingPromises: Promise<RerankedCandidate | null>[] = candidatesForReranking.map(async (candidate) => {
      // CRUCIAL SIMPLIFICATION: Using profileSummaryExcerpt.
      // In a real app, fetch full resume text (candidate.extractedResumeText) for better LLM matching.
      // For now, we'll use what semantic search returns.
      const candidateProfileForMatcher = candidate.experienceSummary || candidate.aiGeneratedSummary || "No detailed profile summary available for LLM re-ranking.";
      
      if (!candidate.candidateId || !candidate.fullName || !candidate.currentTitle) {
          console.warn("[advancedCandidateJobMatchingFlow] - Semantic search result missing critical candidate info, skipping for LLM reranking:", candidate);
          return null;
      }

      try {
        const llmMatchOutput = await candidateJobMatcher({
          candidateProfile: candidateProfileForMatcher,
          jobDescription: jobDescToUse,
          companyInformation: companyInfoToUse,
        });
        
        let semanticScore: number | undefined = undefined;
        if (typeof candidate.distance === 'number') {
            semanticScore = Math.max(0, 1 - (candidate.distance / 2));
        }

        return {
          candidateId: candidate.candidateId,
          fullName: candidate.fullName,
          currentTitle: candidate.currentTitle,
          profileSummaryExcerpt: candidate.experienceSummary || candidate.aiGeneratedSummary,
          semanticMatchScore: semanticScore,
          llmMatchScore: llmMatchOutput.matchScore,
          llmJustification: llmMatchOutput.justification,
          topSkills: candidate.skills,
          availability: candidate.availability,
        };
      } catch (error) {
        console.error(`[advancedCandidateJobMatchingFlow] - Error re-ranking candidate ${candidate.candidateId} with LLM:`, error);
        return null; // Or return with an error field
      }
    });

    const rerankedResults = (await Promise.all(rerankingPromises)).filter(Boolean) as RerankedCandidate[];
    console.log(`[advancedCandidateJobMatchingFlow] - Successfully re-ranked ${rerankedResults.length} candidates with LLM.`);

    // Sort by LLM match score (descending)
    rerankedResults.sort((a, b) => b.llmMatchScore - a.llmMatchScore);

    const finalCandidates = rerankedResults.slice(0, finalResultCount);

    return {
      rerankedCandidates: finalCandidates,
      jobTitleUsed,
      searchSummary: `Advanced match complete. Found ${semanticMatches.length} semantic matches, LLM-reranked ${rerankedResults.length}, returning top ${finalCandidates.length}.`,
    };
  }
);
