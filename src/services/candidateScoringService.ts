import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiLogger } from '@/lib/logger';

export interface CandidateProfile {
  id: string;
  fullName: string;
  currentTitle: string;
  skills: string[];
  experience: string;
  summary: string;
  resumeText?: string;
}

export interface JobRequirements {
  id: string;
  title: string;
  mustHaveRequirements: string[];
  skills: string[];
  experience: string;
  description: string;
}

export interface ScoringResult {
  overallScore: number; // 0-100
  mustHaveScore: number; // 0-100
  skillsScore: number; // 0-100
  experienceScore: number; // 0-100
  detailedBreakdown: {
    mustHaveRequirements: {
      requirement: string;
      met: boolean;
      confidence: number;
      explanation: string;
    }[];
    skillsAnalysis: {
      skill: string;
      hasSkill: boolean;
      proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
      evidence: string;
    }[];
    experienceAnalysis: {
      meetsRequirement: boolean;
      candidateExperience: string;
      requiredExperience: string;
      gap: string;
    };
  };
  recommendation: 'Strong Match' | 'Good Match' | 'Partial Match' | 'Poor Match';
  reasoning: string;
}

class CandidateScoringService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required for candidate scoring');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async scoreCandidate(
    candidate: CandidateProfile,
    job: JobRequirements
  ): Promise<ScoringResult> {
    try {
      aiLogger.info('Scoring candidate against job requirements', {
        candidateId: candidate.id,
        jobId: job.id,
        candidateName: candidate.fullName,
        jobTitle: job.title
      });

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = this.buildScoringPrompt(candidate, job);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const scoringResult = this.parseScoringResponse(text);

      aiLogger.info('Candidate scoring completed', {
        candidateId: candidate.id,
        jobId: job.id,
        overallScore: scoringResult.overallScore,
        recommendation: scoringResult.recommendation
      });

      return scoringResult;
    } catch (error) {
      aiLogger.error('Failed to score candidate', {
        candidateId: candidate.id,
        jobId: job.id,
        error: String(error)
      });
      throw new Error('Failed to score candidate. Please try again.');
    }
  }

  async scoreBatchCandidates(
    candidates: CandidateProfile[],
    job: JobRequirements
  ): Promise<(ScoringResult & { candidateId: string })[]> {
    const results = [];
    
    for (const candidate of candidates) {
      try {
        const score = await this.scoreCandidate(candidate, job);
        results.push({
          ...score,
          candidateId: candidate.id
        });
      } catch (error) {
        aiLogger.error('Failed to score candidate in batch', {
          candidateId: candidate.id,
          error: String(error)
        });
        // Continue with other candidates
      }
    }

    return results.sort((a, b) => b.overallScore - a.overallScore);
  }

  private buildScoringPrompt(candidate: CandidateProfile, job: JobRequirements): string {
    return `
You are an expert HR professional and candidate evaluation specialist. Evaluate how well this candidate matches the job requirements.

**CANDIDATE PROFILE:**
Name: ${candidate.fullName}
Current Title: ${candidate.currentTitle}
Experience: ${candidate.experience}
Skills: ${candidate.skills.join(', ')}
Summary: ${candidate.summary}
${candidate.resumeText ? `Resume Text: ${candidate.resumeText.slice(0, 2000)}` : ''}

**JOB REQUIREMENTS:**
Title: ${job.title}
Experience Required: ${job.experience}
Required Skills: ${job.skills.join(', ')}
Description: ${job.description}

**MUST-HAVE REQUIREMENTS (Critical for Scoring):**
${job.mustHaveRequirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

Please provide a comprehensive evaluation in the following JSON format:

{
  "overallScore": <number 0-100>,
  "mustHaveScore": <number 0-100>,
  "skillsScore": <number 0-100>,
  "experienceScore": <number 0-100>,
  "detailedBreakdown": {
    "mustHaveRequirements": [
      {
        "requirement": "<requirement text>",
        "met": <boolean>,
        "confidence": <number 0-100>,
        "explanation": "<detailed explanation of why this requirement is/isn't met>"
      }
    ],
    "skillsAnalysis": [
      {
        "skill": "<skill name>",
        "hasSkill": <boolean>,
        "proficiencyLevel": "<Beginner|Intermediate|Advanced|Expert>",
        "evidence": "<evidence from candidate's profile>"
      }
    ],
    "experienceAnalysis": {
      "meetsRequirement": <boolean>,
      "candidateExperience": "<candidate's experience level>",
      "requiredExperience": "<job's experience requirement>",
      "gap": "<description of any experience gap>"
    }
  },
  "recommendation": "<Strong Match|Good Match|Partial Match|Poor Match>",
  "reasoning": "<detailed reasoning for the overall score and recommendation>"
}

**SCORING GUIDELINES:**
1. **Must-Have Requirements (40% weight)**: These are critical. If a candidate doesn't meet most must-have requirements, the overall score should be significantly lower.
2. **Skills Match (35% weight)**: How well do the candidate's skills align with job requirements?
3. **Experience Level (25% weight)**: Does the candidate have appropriate experience level?

**SCORING RANGES:**
- 90-100: Exceptional match, strong hire recommendation
- 80-89: Very good match, recommend for interview
- 70-79: Good match with some gaps, consider for interview
- 60-69: Moderate match, may need additional evaluation
- 50-59: Weak match, significant gaps
- Below 50: Poor match, not recommended

Be thorough, fair, and provide specific evidence for your assessments. Return ONLY the JSON object.
`;
  }

  private parseScoringResponse(response: string): ScoringResult {
    try {
      // Clean the response to extract JSON
      let cleanedResponse = response.trim();
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in response');
      }
      
      const jsonString = cleanedResponse.slice(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonString);

      // Validate and ensure all required fields exist
      return {
        overallScore: Math.min(100, Math.max(0, parsed.overallScore || 0)),
        mustHaveScore: Math.min(100, Math.max(0, parsed.mustHaveScore || 0)),
        skillsScore: Math.min(100, Math.max(0, parsed.skillsScore || 0)),
        experienceScore: Math.min(100, Math.max(0, parsed.experienceScore || 0)),
        detailedBreakdown: {
          mustHaveRequirements: parsed.detailedBreakdown?.mustHaveRequirements || [],
          skillsAnalysis: parsed.detailedBreakdown?.skillsAnalysis || [],
          experienceAnalysis: parsed.detailedBreakdown?.experienceAnalysis || {
            meetsRequirement: false,
            candidateExperience: 'Unknown',
            requiredExperience: 'Unknown',
            gap: 'Unable to assess'
          }
        },
        recommendation: parsed.recommendation || 'Poor Match',
        reasoning: parsed.reasoning || 'Unable to provide detailed reasoning'
      };
    } catch (error) {
      aiLogger.error('Failed to parse scoring response', {
        error: String(error),
        response: response.slice(0, 500)
      });
      
      return this.getFallbackScoringResult();
    }
  }

  private getFallbackScoringResult(): ScoringResult {
    return {
      overallScore: 0,
      mustHaveScore: 0,
      skillsScore: 0,
      experienceScore: 0,
      detailedBreakdown: {
        mustHaveRequirements: [],
        skillsAnalysis: [],
        experienceAnalysis: {
          meetsRequirement: false,
          candidateExperience: 'Unable to assess',
          requiredExperience: 'Unable to assess',
          gap: 'Scoring system temporarily unavailable'
        }
      },
      recommendation: 'Poor Match',
      reasoning: 'Unable to assess candidate due to technical difficulties. Please review manually.'
    };
  }

  // Quick scoring for filtering/ranking without detailed breakdown
  async quickScore(candidate: CandidateProfile, job: JobRequirements): Promise<number> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `
Rate this candidate's fit for the job on a scale of 0-100. Consider only the most critical factors.

Candidate: ${candidate.fullName}
Title: ${candidate.currentTitle}
Skills: ${candidate.skills.join(', ')}
Experience: ${candidate.experience}

Job: ${job.title}
Required Experience: ${job.experience}
Must-Have Requirements: ${job.mustHaveRequirements.join(', ')}

Return ONLY a number between 0-100.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      const score = parseInt(text);
      return isNaN(score) ? 0 : Math.min(100, Math.max(0, score));
    } catch (error) {
      aiLogger.error('Quick scoring failed', { 
        candidateId: candidate.id, 
        jobId: job.id, 
        error: String(error) 
      });
      return 0;
    }
  }
}

export const candidateScoringService = new CandidateScoringService();