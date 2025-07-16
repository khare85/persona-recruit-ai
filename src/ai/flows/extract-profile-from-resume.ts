'use server';

/**
 * @fileOverview A comprehensive resume profile extraction AI agent.
 * 
 * Extracts structured profile information from resume text including:
 * - Current job title
 * - Years of experience
 * - Location
 * - Skills
 * - Phone number
 * - LinkedIn URL
 * - Expected salary
 * - Preferred locations
 * - Preferred job types
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractProfileFromResumeInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume.'),
});
export type ExtractProfileFromResumeInput = z.infer<typeof ExtractProfileFromResumeInputSchema>;

const ExtractProfileFromResumeOutputSchema = z.object({
  currentTitle: z.string().optional().describe('Current or most recent job title'),
  experience: z.enum(['entry_level', 'mid_level', 'senior', 'executive']).optional().describe('Experience level based on years of experience and seniority'),
  location: z.string().optional().describe('Current location/city'),
  skills: z.array(z.string()).describe('Array of technical and soft skills'),
  phone: z.string().optional().describe('Phone number if found'),
  linkedinUrl: z.string().optional().describe('LinkedIn profile URL if found'),
  expectedSalary: z.string().optional().describe('Expected salary or salary range if mentioned'),
  preferredLocations: z.array(z.string()).optional().describe('Preferred work locations if mentioned'),
  preferredJobTypes: z.array(z.enum(['full_time', 'part_time', 'contract', 'freelance', 'internship'])).optional().describe('Preferred job types if mentioned'),
  professionalSummary: z.string().describe('A concise 3-5 sentence professional summary'),
});
export type ExtractProfileFromResumeOutput = z.infer<typeof ExtractProfileFromResumeOutputSchema>;

export async function extractProfileFromResume(input: ExtractProfileFromResumeInput): Promise<ExtractProfileFromResumeOutput> {
  return extractProfileFromResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractProfileFromResumePrompt',
  input: { schema: ExtractProfileFromResumeInputSchema },
  output: { schema: ExtractProfileFromResumeOutputSchema },
  prompt: `You are an expert resume analyzer. Extract structured profile information from the given resume text.

  Analyze the resume and extract:
  1. Current or most recent job title
  2. Experience level based on years of experience:
     - entry_level: 0-2 years
     - mid_level: 3-5 years
     - senior: 6-10 years
     - executive: 10+ years or C-level positions
  3. Current location (city, state/country)
  4. Comprehensive list of skills (technical, software, methodologies, soft skills)
  5. Contact information (phone, LinkedIn URL)
  6. Salary expectations if mentioned
  7. Preferred work locations if mentioned
  8. Preferred job types (full_time, part_time, contract, freelance, internship)
  9. Generate a professional summary (3-5 sentences) highlighting key achievements and value proposition

  If information is not found in the resume, omit that field or return appropriate default.
  For skills, be comprehensive and include all relevant technical skills, tools, frameworks, and soft skills.
  For LinkedIn URL, extract the full URL if present.
  For phone, format consistently (e.g., +1-555-123-4567).

  Resume Text:
  {{{resumeText}}}`,
});

const extractProfileFromResumeFlow = ai.defineFlow(
  {
    name: 'extractProfileFromResumeFlow',
    inputSchema: ExtractProfileFromResumeInputSchema,
    outputSchema: ExtractProfileFromResumeOutputSchema,
  },
  async (input): Promise<ExtractProfileFromResumeOutput> => {
    const { output } = await prompt(input);

    if (!output) {
      console.error(`[extractProfileFromResumeFlow] - Prompt did not return output for resume (text length: ${input.resumeText.length}).`);
      throw new Error('AI prompt failed to extract profile information from resume.');
    }

    // Ensure skills array exists even if empty
    if (!output.skills) {
      output.skills = [];
    }

    return output;
  }
);