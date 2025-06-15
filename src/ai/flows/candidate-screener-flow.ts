
'use server';
/**
 * @fileOverview Basic candidate screening based on skill matching.
 *
 * - screenCandidateSkills - Compares candidate skills against required and preferred job skills.
 * - CandidateScreeningInput - Input type.
 * - CandidateScreeningOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CandidateScreeningInputSchema = z.object({
  candidateSkills: z.array(z.string()).describe("A list of skills possessed by the candidate."),
  requiredJobSkills: z.array(z.string()).describe("A list of skills explicitly required for the job."),
  preferredJobSkills: z.array(z.string()).optional().describe("A list of skills preferred, but not strictly required, for the job."),
});
export type CandidateScreeningInput = z.infer<typeof CandidateScreeningInputSchema>;

const ScreeningAssessmentEnum = z.enum([
  "Strong Match",
  "Potential Match",
  "Missing Requirements",
  "Review Recommended"
]);
export type ScreeningAssessment = z.infer<typeof ScreeningAssessmentEnum>;

const CandidateScreeningOutputSchema = z.object({
  matchedRequiredSkills: z.array(z.string()).describe("List of required skills the candidate possesses."),
  missingRequiredSkills: z.array(z.string()).describe("List of required skills the candidate is missing."),
  matchedPreferredSkills: z.array(z.string()).describe("List of preferred skills the candidate possesses."),
  assessment: ScreeningAssessmentEnum.describe("Overall screening assessment based on skill match."),
  summary: z.string().describe("A brief textual summary of the screening outcome."),
});
export type CandidateScreeningOutput = z.infer<typeof CandidateScreeningOutputSchema>;

export async function screenCandidateSkills(input: CandidateScreeningInput): Promise<CandidateScreeningOutput> {
  return screenCandidateSkillsFlow(input);
}

// This flow is a simple logic-based skill comparison, not using an LLM directly for this basic version.
// It could be enhanced with an LLM for more nuanced skill matching or criteria evaluation.
const screenCandidateSkillsFlow = ai.defineFlow(
  {
    name: 'screenCandidateSkillsFlow',
    inputSchema: CandidateScreeningInputSchema,
    outputSchema: CandidateScreeningOutputSchema,
  },
  async ({ candidateSkills, requiredJobSkills, preferredJobSkills = [] }) => {
    const candidateSkillSet = new Set(candidateSkills.map(s => s.toLowerCase().trim()));
    
    const matchedRequiredSkills = requiredJobSkills.filter(rs => candidateSkillSet.has(rs.toLowerCase().trim()));
    const missingRequiredSkills = requiredJobSkills.filter(rs => !candidateSkillSet.has(rs.toLowerCase().trim()));
    const matchedPreferredSkills = preferredJobSkills.filter(ps => candidateSkillSet.has(ps.toLowerCase().trim()));

    let assessment: ScreeningAssessment;
    let summary: string;

    if (missingRequiredSkills.length === 0 && requiredJobSkills.length > 0) {
      assessment = "Strong Match";
      summary = "Candidate possesses all required skills.";
      if (matchedPreferredSkills.length > 0) {
        summary += ` Also has ${matchedPreferredSkills.length} preferred skill(s).`;
      }
    } else if (requiredJobSkills.length === 0) { // No required skills specified
        assessment = "Review Recommended";
        summary = "No required skills specified for the job. Manual review needed.";
        if (matchedPreferredSkills.length > 0) {
            summary += ` Candidate has ${matchedPreferredSkills.length} preferred skill(s).`;
        }
    }
     else if (missingRequiredSkills.length < requiredJobSkills.length && missingRequiredSkills.length <= Math.ceil(requiredJobSkills.length / 2) ) {
      // Missing some, but not all, and not more than half.
      assessment = "Potential Match";
      summary = `Candidate is missing ${missingRequiredSkills.length} required skill(s) out of ${requiredJobSkills.length} but meets others.`;
       if (matchedPreferredSkills.length > 0) {
        summary += ` Has ${matchedPreferredSkills.length} preferred skill(s). Review recommended.`;
      } else {
        summary += ` Review recommended.`;
      }
    } else {
      assessment = "Missing Requirements";
      summary = `Candidate is missing ${missingRequiredSkills.length} critical required skill(s) out of ${requiredJobSkills.length}.`;
    }

    // If many required skills are missing, but they have some preferred skills, it might still warrant a review.
    if (assessment === "Missing Requirements" && matchedPreferredSkills.length >= preferredJobSkills.length / 2 && preferredJobSkills.length > 0) {
        assessment = "Review Recommended";
        summary = `Candidate is missing ${missingRequiredSkills.length} required skill(s), but shows strength in ${matchedPreferredSkills.length} preferred areas. A manual review is recommended.`;
    }
    
    return {
      matchedRequiredSkills,
      missingRequiredSkills,
      matchedPreferredSkills,
      assessment,
      summary,
    };
  }
);
