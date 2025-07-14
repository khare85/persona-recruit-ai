'use server';
/**
 * @fileOverview Generates relevant skills for a job based on title, experience level, and industry.
 *
 * - generateJobSkills - Function that generates skills for a job posting.
 * - GenerateJobSkillsInput - Input type for the generateJobSkills function.
 * - GenerateJobSkillsOutput - Return type for the generateJobSkills function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateJobSkillsInputSchema = z.object({
  jobTitle: z.string().describe('The job title (e.g., "Senior Software Engineer", "Data Scientist")'),
  experienceLevel: z.string().describe('Experience level: "entry-level", "mid-level", "senior", or "executive"'),
  industry: z.string().optional().describe('Industry or company type (e.g., "technology", "healthcare", "finance")')
});

export type GenerateJobSkillsInput = z.infer<typeof GenerateJobSkillsInputSchema>;

const GenerateJobSkillsOutputSchema = z.object({
  skills: z.array(z.string()).describe('Array of relevant skills for the job (8-12 skills maximum)')
});

export type GenerateJobSkillsOutput = z.infer<typeof GenerateJobSkillsOutputSchema>;

export async function generateJobSkills(input: GenerateJobSkillsInput): Promise<GenerateJobSkillsOutput> {
  return generateJobSkillsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobSkillsPrompt',
  input: { schema: GenerateJobSkillsInputSchema },
  output: { schema: GenerateJobSkillsOutputSchema },
  prompt: `You are an expert HR professional and job market analyst.

Generate a comprehensive list of relevant skills for the following position:

Job Title: {{{jobTitle}}}
Experience Level: {{{experienceLevel}}}
Industry: {{{industry}}}

Instructions:
- Include 8-12 highly relevant skills
- Mix technical skills, tools/technologies, and soft skills as appropriate
- Consider the experience level (entry-level needs foundational skills, senior needs leadership/architecture skills)
- Include both hard skills and important soft skills for the role
- Skills should be commonly searched for and relevant to current job market
- Avoid overly generic skills like "Microsoft Office" unless specifically relevant
- For technical roles, include modern frameworks, languages, and tools
- For leadership roles, include management and strategic skills

Return only the skills array, no explanations.`
});

const generateJobSkillsFlow = ai.defineFlow(
  {
    name: 'generateJobSkillsFlow',
    inputSchema: GenerateJobSkillsInputSchema,
    outputSchema: GenerateJobSkillsOutputSchema,
  },
  async (input): Promise<GenerateJobSkillsOutput> => {
    const { output } = await prompt(input);
    
    if (!output || !output.skills || output.skills.length === 0) {
      console.error(`[generateJobSkillsFlow] - Prompt did not return valid skills for job: ${input.jobTitle}`);
      throw new Error('AI prompt failed to generate job skills.');
    }

    // Ensure we don't return too many skills
    const limitedSkills = output.skills.slice(0, 12);
    
    return { skills: limitedSkills };
  }
);