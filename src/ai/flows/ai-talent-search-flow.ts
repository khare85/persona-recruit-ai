
'use server';

/**
 * @fileOverview AI-powered talent search engine.
 *
 * - aiTalentSearch - A function that searches for candidates based on a query and filters.
 * - AiTalentSearchInput - The input type for the aiTalentSearch function.
 * - AiTalentSearchOutput - The return type for the aiTalentSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CandidateFilterSchema = z.object({
  availabilityInDays: z.number().optional().describe("Candidate's availability in days (e.g., 0 for immediate, 7 for within a week)."),
  isOpenToRemote: z.boolean().optional().describe("Whether the candidate is open to remote work."),
  minExperienceYears: z.number().optional().describe("Minimum years of experience."),
  // Add more filters as needed in the future, e.g., location preferences, specific certifications
});

const AiTalentSearchInputSchema = z.object({
  searchQuery: z
    .string()
    .min(10)
    .describe('A natural language query describing the ideal candidate, or a snippet/full job description.'),
  filters: CandidateFilterSchema.optional().describe("Optional structured filters to refine the search."),
  resultCount: z.number().min(1).max(10).default(5).describe("Number of top candidate profiles to return."),
});
export type AiTalentSearchInput = z.infer<typeof AiTalentSearchInputSchema>;

const MatchedCandidateSchema = z.object({
  candidateId: z.string().uuid().describe("A unique mock identifier for the candidate."),
  fullName: z.string().describe("The candidate's full name."),
  currentTitle: z.string().describe("The candidate's current or most recent job title."),
  profileSummaryExcerpt: z.string().describe("A brief, relevant excerpt from the candidate's profile (2-3 sentences) highlighting why they are a match."),
  topSkills: z.array(z.string()).describe("A few top skills relevant to the search query."),
  availability: z.string().describe("A short description of their availability (e.g., 'Immediate', 'Within 2 weeks', 'Open to discussion')."),
  matchScore: z.number().min(0).max(1).describe("A score (0-1) indicating the relevance of the candidate to the search query."),
  matchJustification: z.string().describe("A concise explanation (2-3 lines) of why this candidate is a good match for the query."),
});

const AiTalentSearchOutputSchema = z.object({
  matchedCandidates: z.array(MatchedCandidateSchema).describe('An array of matched candidate profiles.'),
  searchSummary: z.string().describe("A brief summary of the search performed and the types of candidates found."),
});
export type AiTalentSearchOutput = z.infer<typeof AiTalentSearchOutputSchema>;


export async function aiTalentSearch(input: AiTalentSearchInput): Promise<AiTalentSearchOutput> {
  return aiTalentSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiTalentSearchPrompt',
  input: {schema: AiTalentSearchInputSchema},
  output: {schema: AiTalentSearchOutputSchema},
  prompt: `You are an advanced AI Talent Search engine. Your goal is to find the best candidate profiles from a vast, hypothetical database based on the user's search query and optional filters.
Generate {{{resultCount}}} distinct mock candidate profiles.

Search Query:
"{{{searchQuery}}}"

{{#if filters}}
Applied Filters:
  {{#if filters.availabilityInDays}}
  - Available within: {{{filters.availabilityInDays}}} days
  {{/if}}
  {{#if filters.isOpenToRemote}}
  - Open to Remote: Yes
  {{/if}}
  {{#if filters.minExperienceYears}}
  - Minimum Experience: {{{filters.minExperienceYears}}} years
  {{/if}}
{{else}}
No specific filters applied.
{{/if}}

For each candidate, provide:
- A unique UUID for candidateId.
- A plausible full name and current job title.
- A compelling profileSummaryExcerpt (2-3 sentences) that directly relates to the searchQuery.
- A list of 3-5 topSkills highly relevant to the searchQuery.
- A realistic availability status (e.g., "Immediate", "Available in 2 weeks", "Actively Looking").
- A matchScore (0.0 to 1.0) reflecting their fit for the searchQuery.
- A concise matchJustification (2-3 lines) explaining the score, referencing specific aspects of the query and hypothetical candidate profile.

Also, provide a brief searchSummary (1-2 sentences) describing the search criteria and the general profile of candidates you've "found".

Ensure the generated candidates are diverse and realistically reflect the query. Do not use placeholder text like "Lorem Ipsum". Make the data seem authentic.
If the query is vague, make reasonable assumptions to generate relevant profiles.
`,
});

const aiTalentSearchFlow = ai.defineFlow(
  {
    name: 'aiTalentSearchFlow',
    inputSchema: AiTalentSearchInputSchema,
    outputSchema: AiTalentSearchOutputSchema,
  },
  async (input): Promise<AiTalentSearchOutput> => {
    // In a real application, this is where you would query your vector database
    // and then potentially use an LLM to refine/summarize/justify results.
    // For now, the LLM will generate mock candidates based on the prompt.
    
    const {output} = await prompt(input);

    if (!output) {
        console.error(`[aiTalentSearchFlow] - Prompt did not return an output for input:`, input);
        throw new Error('AI prompt failed to return expected talent search output.');
    }

    // Ensure scores are clamped (LLMs can sometimes go slightly out of bounds)
    if (output.matchedCandidates) {
        output.matchedCandidates.forEach(candidate => {
            if (candidate.matchScore < 0) candidate.matchScore = 0;
            if (candidate.matchScore > 1) candidate.matchScore = 1;
        });
    }
    return output;
  }
);

    