/**
 * Enhanced Gemini Service
 * Optimized Google AI service with caching and error handling
 */

import { gemini15Flash } from '@/ai/genkit';
import { AICache } from './AICache';
import { createHash } from 'crypto';

export class GeminiService {
  private cache: AICache;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor() {
    this.cache = new AICache();
  }

  /**
   * Analyze resume with caching
   */
  async analyzeResume(resumeText: string): Promise<any> {
    const cacheKey = this.getCacheKey('analyze-resume', resumeText);
    
    return this.cache.getOrSet(cacheKey, async () => {
      const prompt = `Analyze this resume and extract key information:

Resume Text:
${resumeText}

Please provide a JSON response with:
{
  "summary": "Brief professional summary",
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "duration": "Years",
      "description": "Key responsibilities and achievements"
    }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"]
  },
  "education": [
    {
      "institution": "School Name",
      "degree": "Degree",
      "year": "Year"
    }
  ],
  "achievements": ["achievement1", "achievement2"],
  "strengths": ["strength1", "strength2"],
  "recommendedImprovements": ["improvement1", "improvement2"]
}`;

      return this.callGeminiWithRetry(prompt);
    }, 86400); // Cache for 24 hours
  }

  /**
   * Extract skills from resume
   */
  async extractSkills(resumeText: string): Promise<string[]> {
    const cacheKey = this.getCacheKey('extract-skills', resumeText);
    
    return this.cache.getOrSet(cacheKey, async () => {
      const prompt = `Extract all relevant skills from this resume text. Focus on both technical and soft skills.

Resume Text:
${resumeText}

Return only a JSON array of skills:
["skill1", "skill2", "skill3", ...]`;

      const response = await this.callGeminiWithRetry(prompt);
      return Array.isArray(response) ? response : [];
    }, 86400); // Cache for 24 hours
  }

  /**
   * Generate job description
   */
  async generateJobDescription(jobData: any): Promise<string> {
    const cacheKey = this.getCacheKey('generate-job-desc', jobData);
    
    return this.cache.getOrSet(cacheKey, async () => {
      const prompt = `Generate a comprehensive job description based on this information:

Job Title: ${jobData.title}
Company: ${jobData.company}
Location: ${jobData.location}
Type: ${jobData.type}
Experience Level: ${jobData.experienceLevel}
Key Requirements: ${jobData.requirements?.join(', ')}
Responsibilities: ${jobData.responsibilities?.join(', ')}
Benefits: ${jobData.benefits?.join(', ')}

Create a professional job description with:
1. Company overview
2. Job summary
3. Key responsibilities
4. Required qualifications
5. Preferred qualifications
6. Benefits and perks
7. Application process

Make it engaging and professional.`;

      return this.callGeminiWithRetry(prompt);
    }, 86400); // Cache for 24 hours
  }

  /**
   * Analyze video interview
   */
  async analyzeVideo(videoPath: string): Promise<any> {
    const cacheKey = this.getCacheKey('analyze-video', videoPath);
    
    return this.cache.getOrSet(cacheKey, async () => {
      const prompt = `Analyze this video interview and provide comprehensive feedback:

Video Path: ${videoPath}

Please provide a JSON response with:
{
  "overallScore": 85,
  "competencies": {
    "communication": {
      "score": 8,
      "feedback": "Clear and articulate communication"
    },
    "technicalSkills": {
      "score": 7,
      "feedback": "Good technical knowledge demonstrated"
    },
    "problemSolving": {
      "score": 8,
      "feedback": "Strong analytical thinking"
    },
    "culturalFit": {
      "score": 9,
      "feedback": "Excellent alignment with company values"
    }
  },
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "recommendation": "Strongly Recommended",
  "nextSteps": "Schedule technical interview",
  "transcript": "Key points from the interview",
  "behavioralObservations": "Body language and presentation notes"
}`;

      return this.callGeminiWithRetry(prompt);
    }, 86400); // Cache for 24 hours
  }

  /**
   * Detect bias in AI decisions
   */
  async detectBias(data: any): Promise<any> {
    const cacheKey = this.getCacheKey('detect-bias', data);
    
    return this.cache.getOrSet(cacheKey, async () => {
      const prompt = `Analyze this data for potential bias in hiring decisions:

Data: ${JSON.stringify(data)}

Please provide a JSON response with:
{
  "biasScore": 0.2,
  "biasLevel": "low",
  "detectedBiases": [
    {
      "type": "demographic",
      "severity": "low",
      "description": "Minor demographic imbalance detected"
    }
  ],
  "recommendations": [
    "Expand candidate pool",
    "Review selection criteria"
  ],
  "fairnessMetrics": {
    "demographicParity": 0.95,
    "equalizedOdds": 0.92,
    "disparateImpact": 0.88
  },
  "actionRequired": false,
  "explanation": "Overall hiring process shows minimal bias indicators"
}`;

      return this.callGeminiWithRetry(prompt);
    }, 3600); // Cache for 1 hour
  }

  /**
   * Generate interview questions
   */
  async generateInterviewQuestions(jobData: any, candidateProfile: any): Promise<string[]> {
    const cacheKey = this.getCacheKey('generate-questions', { jobData, candidateProfile });
    
    return this.cache.getOrSet(cacheKey, async () => {
      const prompt = `Generate relevant interview questions for this position and candidate:

Job: ${jobData.title}
Requirements: ${jobData.requirements?.join(', ')}
Candidate Background: ${candidateProfile.experience}
Candidate Skills: ${candidateProfile.skills?.join(', ')}

Generate 10 tailored interview questions covering:
- Technical skills
- Problem-solving
- Cultural fit
- Experience-specific questions

Return as JSON array: ["question1", "question2", ...]`;

      const response = await this.callGeminiWithRetry(prompt);
      return Array.isArray(response) ? response : [];
    }, 86400); // Cache for 24 hours
  }

  /**
   * Score candidate match
   */
  async scoreCandidate(candidateProfile: any, jobRequirements: any): Promise<any> {
    const cacheKey = this.getCacheKey('score-candidate', { candidateProfile, jobRequirements });
    
    return this.cache.getOrSet(cacheKey, async () => {
      const prompt = `Score this candidate against job requirements:

Candidate Profile:
${JSON.stringify(candidateProfile)}

Job Requirements:
${JSON.stringify(jobRequirements)}

Provide a JSON response with:
{
  "overallScore": 85,
  "matchPercentage": 0.85,
  "categoryScores": {
    "skills": 90,
    "experience": 80,
    "education": 85,
    "cultural": 90
  },
  "strengths": ["relevant experience", "strong technical skills"],
  "gaps": ["needs more leadership experience"],
  "recommendation": "Strong match",
  "justification": "Detailed explanation of the scoring"
}`;

      return this.callGeminiWithRetry(prompt);
    }, 3600); // Cache for 1 hour
  }

  /**
   * Call Gemini with retry logic
   */
  private async callGeminiWithRetry(prompt: string, attempt: number = 1): Promise<any> {
    try {
      const response = await gemini15Flash(prompt);
      
      // Try to parse JSON response
      if (typeof response === 'string') {
        try {
          return JSON.parse(response);
        } catch {
          return response;
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Gemini API error (attempt ${attempt}):`, error);
      
      if (attempt < this.maxRetries) {
        console.log(`Retrying in ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay * attempt);
        return this.callGeminiWithRetry(prompt, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(operation: string, data: any): string {
    const hash = createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `gemini:${operation}:${hash}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service statistics
   */
  getStats(): any {
    return {
      cacheStats: this.cache.getStats(),
      serviceType: 'gemini',
      version: '1.5-flash'
    };
  }
}

// Singleton instance
export const geminiService = new GeminiService();