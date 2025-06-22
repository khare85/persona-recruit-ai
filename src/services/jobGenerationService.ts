import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiLogger } from '@/lib/logger';

export interface JobGenerationInput {
  jobTitle: string;
  yearsOfExperience: string;
  company?: string;
  department?: string;
  location?: string;
  jobType?: string;
}

export interface GeneratedJobDescription {
  description: string;
  requirements: string[];
  mustHaveRequirements: string[];
  benefits: string[];
  skills: string[];
  responsibilities: string[];
}

class JobGenerationService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required for job generation');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateJobDescription(input: JobGenerationInput): Promise<GeneratedJobDescription> {
    try {
      aiLogger.info('Generating job description', { 
        jobTitle: input.jobTitle, 
        experience: input.yearsOfExperience 
      });

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = this.buildGenerationPrompt(input);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const parsed = this.parseJobDescriptionResponse(text);
      
      aiLogger.info('Job description generated successfully', {
        jobTitle: input.jobTitle,
        skillsCount: parsed.skills.length,
        requirementsCount: parsed.requirements.length
      });

      return parsed;
    } catch (error) {
      aiLogger.error('Failed to generate job description', {
        jobTitle: input.jobTitle,
        error: String(error)
      });
      throw new Error('Failed to generate job description. Please try again.');
    }
  }

  private buildGenerationPrompt(input: JobGenerationInput): string {
    return `
You are an expert HR professional and job description writer. Generate a comprehensive job description based on the following information:

Job Title: ${input.jobTitle}
Years of Experience Required: ${input.yearsOfExperience}
${input.company ? `Company: ${input.company}` : ''}
${input.department ? `Department: ${input.department}` : ''}
${input.location ? `Location: ${input.location}` : ''}
${input.jobType ? `Job Type: ${input.jobType}` : ''}

Please generate a detailed job description with the following structure. Return ONLY valid JSON in this exact format:

{
  "description": "A comprehensive 2-3 paragraph job description that explains the role, its importance, and what the candidate will be doing",
  "responsibilities": [
    "List 5-7 key responsibilities",
    "Each responsibility should be specific and actionable",
    "Focus on what the person will actually do day-to-day"
  ],
  "requirements": [
    "List 6-8 general requirements",
    "Include education, experience, and nice-to-have skills",
    "Mix of technical and soft skills"
  ],
  "mustHaveRequirements": [
    "List exactly 4-5 CRITICAL requirements",
    "These are NON-NEGOTIABLE requirements",
    "Used for candidate scoring and filtering",
    "Be very specific about mandatory skills/experience"
  ],
  "skills": [
    "List 8-12 relevant technical and soft skills",
    "These will be displayed as badges",
    "Include programming languages, tools, frameworks",
    "Include relevant soft skills"
  ],
  "benefits": [
    "List 6-10 attractive benefits and perks",
    "Include compensation-related benefits",
    "Work-life balance benefits",
    "Career development opportunities",
    "Company culture benefits"
  ]
}

Important guidelines:
- Make the description engaging and specific to the role
- Ensure must-have requirements are truly critical for the position
- Skills should be relevant and current for the industry
- Benefits should be competitive and appealing
- Adjust complexity based on the years of experience required
- For entry-level positions (0-2 years), focus more on learning and growth
- For senior positions (5+ years), emphasize leadership and strategic thinking
- Return ONLY the JSON object, no additional text or formatting
`;
  }

  private parseJobDescriptionResponse(response: string): GeneratedJobDescription {
    try {
      // Clean the response to extract JSON
      let cleanedResponse = response.trim();
      
      // Remove any markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find the JSON object
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in response');
      }
      
      const jsonString = cleanedResponse.slice(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonString);

      // Validate required fields
      const required = ['description', 'requirements', 'mustHaveRequirements', 'benefits', 'skills'];
      for (const field of required) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Ensure arrays are arrays
      ['requirements', 'mustHaveRequirements', 'benefits', 'skills', 'responsibilities'].forEach(field => {
        if (parsed[field] && !Array.isArray(parsed[field])) {
          parsed[field] = [parsed[field]];
        }
      });

      // Set default responsibilities if not provided
      if (!parsed.responsibilities) {
        parsed.responsibilities = [
          'Execute core job functions effectively',
          'Collaborate with team members and stakeholders',
          'Meet project deadlines and quality standards',
          'Participate in team meetings and planning sessions',
          'Contribute to continuous improvement initiatives'
        ];
      }

      return {
        description: parsed.description || '',
        requirements: parsed.requirements || [],
        mustHaveRequirements: parsed.mustHaveRequirements || [],
        benefits: parsed.benefits || [],
        skills: parsed.skills || [],
        responsibilities: parsed.responsibilities || []
      };
    } catch (error) {
      aiLogger.error('Failed to parse job description response', {
        error: String(error),
        response: response.slice(0, 500) // Log first 500 chars for debugging
      });
      
      // Return fallback structure
      return this.getFallbackJobDescription();
    }
  }

  private getFallbackJobDescription(): GeneratedJobDescription {
    return {
      description: 'We are seeking a qualified professional to join our dynamic team. This role offers an excellent opportunity to contribute to our organization\'s success while developing your career in a supportive environment.',
      requirements: [
        'Relevant degree or equivalent experience',
        'Strong communication skills',
        'Ability to work in a team environment',
        'Problem-solving mindset',
        'Attention to detail'
      ],
      mustHaveRequirements: [
        'Minimum required years of experience',
        'Proficiency in core job-related skills',
        'Strong analytical abilities',
        'Excellent communication skills'
      ],
      benefits: [
        'Competitive salary package',
        'Health and dental insurance',
        'Paid time off',
        'Professional development opportunities',
        'Flexible working arrangements',
        'Retirement savings plan'
      ],
      skills: [
        'Communication',
        'Team Collaboration',
        'Problem Solving',
        'Time Management',
        'Analytical Thinking'
      ],
      responsibilities: [
        'Execute assigned tasks and projects',
        'Collaborate with team members',
        'Meet deadlines and quality standards',
        'Participate in team meetings',
        'Contribute to process improvements'
      ]
    };
  }

  async generateSkillsOnly(jobTitle: string, yearsOfExperience: string): Promise<string[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `
Generate a list of 8-12 relevant skills for a ${jobTitle} position requiring ${yearsOfExperience} years of experience.

Return ONLY a JSON array of strings, like this:
["Skill 1", "Skill 2", "Skill 3", ...]

Include both technical and soft skills relevant to the position.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the skills array
      const cleanedResponse = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const skills = JSON.parse(cleanedResponse);

      return Array.isArray(skills) ? skills : [];
    } catch (error) {
      aiLogger.error('Failed to generate skills', { jobTitle, error: String(error) });
      return ['Communication', 'Team Collaboration', 'Problem Solving'];
    }
  }
}

export const jobGenerationService = new JobGenerationService();