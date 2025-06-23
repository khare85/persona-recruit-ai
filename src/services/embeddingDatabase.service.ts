import { 
  saveCandidateWithEmbedding, 
  saveJobWithEmbedding,
  searchCandidatesByEmbedding,
  searchJobsByEmbedding,
  CandidateWithEmbeddingFirestore,
  JobWithEmbeddingFirestore
} from './firestoreService';
import { databaseService } from './database.service';
import { CandidateProfile } from '@/models/user.model';
import { Job } from '@/models/job.model';
import { dbLogger } from '@/lib/logger';
import { textEmbeddingService } from './textEmbedding.service';

/**
 * Enhanced database service that combines regular CRUD operations with vector search
 */
class EmbeddingDatabaseService {
  
  /**
   * Create or update candidate with embedding for vector search
   */
  async saveCandidateWithEmbedding(
    candidateId: string,
    candidateData: {
      fullName: string;
      email: string;
      currentTitle: string;
      extractedResumeText: string;
      resumeEmbedding: number[];
      skills: string[];
      phone?: string;
      linkedinProfile?: string;
      portfolioUrl?: string;
      experienceSummary?: string;
      aiGeneratedSummary?: string;
      profilePictureUrl?: string;
      videoIntroductionUrl?: string;
      resumeFileUrl?: string;
      availability?: string;
    }
  ): Promise<{ success: boolean; message: string; candidateId?: string }> {
    try {
      // Save to embedding collection for vector search
      const embeddingResult = await saveCandidateWithEmbedding(candidateId, candidateData);
      
      if (!embeddingResult.success) {
        return embeddingResult;
      }

      // Also update the regular candidate profile
      await databaseService.updateCandidateProfile(candidateId, {
        currentTitle: candidateData.currentTitle,
        skills: candidateData.skills,
        summary: candidateData.aiGeneratedSummary || candidateData.experienceSummary || '',
        phone: candidateData.phone,
        linkedinUrl: candidateData.linkedinProfile,
        portfolioUrl: candidateData.portfolioUrl,
        resumeUrl: candidateData.resumeFileUrl,
        videoIntroUrl: candidateData.videoIntroductionUrl,
        profileComplete: true
      });

      dbLogger.info('Candidate saved with embeddings', {
        candidateId,
        hasEmbedding: candidateData.resumeEmbedding.length > 0,
        skillsCount: candidateData.skills.length
      });

      return embeddingResult;
    } catch (error) {
      dbLogger.error('Failed to save candidate with embeddings', {
        candidateId,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Create or update job with embedding for vector search
   */
  async saveJobWithEmbedding(
    jobId: string,
    jobData: {
      title: string;
      companyName: string;
      fullJobDescriptionText: string;
      jobEmbedding: number[];
      location?: string;
      jobLevel?: string;
      department?: string;
      responsibilitiesSummary?: string;
      qualificationsSummary?: string;
    }
  ): Promise<{ success: boolean; message: string; jobId?: string }> {
    try {
      // Save to embedding collection for vector search
      const embeddingResult = await saveJobWithEmbedding(jobId, jobData);
      
      if (!embeddingResult.success) {
        return embeddingResult;
      }

      // Also update the regular job record
      const existingJob = await databaseService.getJobById(jobId);
      if (existingJob) {
        await databaseService.updateJob(jobId, {
          title: jobData.title,
          location: jobData.location || existingJob.location,
          description: jobData.fullJobDescriptionText,
          // Update other fields as needed
        });
      }

      dbLogger.info('Job saved with embeddings', {
        jobId,
        hasEmbedding: jobData.jobEmbedding.length > 0,
        companyName: jobData.companyName
      });

      return embeddingResult;
    } catch (error) {
      dbLogger.error('Failed to save job with embeddings', {
        jobId,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Search candidates by resume embedding
   */
  async searchCandidatesByEmbedding(
    queryEmbedding: number[],
    topN: number = 5
  ): Promise<(Partial<CandidateWithEmbeddingFirestore> & { distance?: number })[]> {
    try {
      dbLogger.info('Searching candidates by embedding', {
        embeddingLength: queryEmbedding.length,
        topN
      });

      const results = await searchCandidatesByEmbedding(queryEmbedding, topN);
      
      dbLogger.info('Candidate search completed', {
        resultsCount: results.length,
        topScore: results[0]?.distance
      });

      return results;
    } catch (error) {
      dbLogger.error('Candidate embedding search failed', {
        error: String(error),
        embeddingLength: queryEmbedding.length
      });
      throw error;
    }
  }

  /**
   * Search jobs by description embedding
   */
  async searchJobsByEmbedding(
    queryEmbedding: number[],
    topN: number = 5
  ): Promise<(Partial<JobWithEmbeddingFirestore> & { distance?: number })[]> {
    try {
      dbLogger.info('Searching jobs by embedding', {
        embeddingLength: queryEmbedding.length,
        topN
      });

      const results = await searchJobsByEmbedding(queryEmbedding, topN);
      
      dbLogger.info('Job search completed', {
        resultsCount: results.length,
        topScore: results[0]?.distance
      });

      return results;
    } catch (error) {
      dbLogger.error('Job embedding search failed', {
        error: String(error),
        embeddingLength: queryEmbedding.length
      });
      throw error;
    }
  }

  /**
   * Get candidate with embedding data
   */
  async getCandidateWithEmbedding(candidateId: string): Promise<CandidateWithEmbeddingFirestore | null> {
    try {
      // This would require implementing a get method in the firestoreService
      // For now, we can search by candidateId
      const results = await this.searchCandidatesByEmbedding(new Array(768).fill(0), 1000);
      const candidate = results.find(c => c.candidateId === candidateId);
      
      return candidate as CandidateWithEmbeddingFirestore || null;
    } catch (error) {
      dbLogger.error('Failed to get candidate with embedding', {
        candidateId,
        error: String(error)
      });
      return null;
    }
  }

  /**
   * Get job with embedding data
   */
  async getJobWithEmbedding(jobId: string): Promise<JobWithEmbeddingFirestore | null> {
    try {
      // This would require implementing a get method in the firestoreService
      // For now, we can search by jobId
      const results = await this.searchJobsByEmbedding(new Array(768).fill(0), 1000);
      const job = results.find(j => j.jobId === jobId);
      
      return job as JobWithEmbeddingFirestore || null;
    } catch (error) {
      dbLogger.error('Failed to get job with embedding', {
        jobId,
        error: String(error)
      });
      return null;
    }
  }

  /**
   * Find similar candidates for a job
   */
  async findSimilarCandidatesForJob(
    jobId: string,
    topN: number = 10
  ): Promise<(Partial<CandidateWithEmbeddingFirestore> & { distance?: number })[]> {
    try {
      // Get job embedding
      const job = await this.getJobWithEmbedding(jobId);
      if (!job || !job.jobEmbedding) {
        throw new Error('Job embedding not found');
      }

      // Search for similar candidates
      return await this.searchCandidatesByEmbedding(job.jobEmbedding, topN);
    } catch (error) {
      dbLogger.error('Failed to find similar candidates for job', {
        jobId,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Find similar jobs for a candidate
   */
  async findSimilarJobsForCandidate(
    candidateId: string,
    topN: number = 10
  ): Promise<(Partial<JobWithEmbeddingFirestore> & { distance?: number })[]> {
    try {
      // Get candidate embedding
      const candidate = await this.getCandidateWithEmbedding(candidateId);
      if (!candidate || !candidate.resumeEmbedding) {
        throw new Error('Candidate embedding not found');
      }

      // Search for similar jobs
      return await this.searchJobsByEmbedding(candidate.resumeEmbedding, topN);
    } catch (error) {
      dbLogger.error('Failed to find similar jobs for candidate', {
        candidateId,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Hybrid search: combine regular database queries with vector search
   */
  async hybridCandidateSearch(
    query: {
      text?: string; // For embedding search
      skills?: string[];
      experience?: string;
      location?: string;
      topN?: number;
    }
  ): Promise<{
    vectorResults: (Partial<CandidateWithEmbeddingFirestore> & { distance?: number })[];
    filterResults: CandidateProfile[];
  }> {
    try {
      const results: any = {
        vectorResults: [],
        filterResults: []
      };

      // Vector search if text query provided
      if (query.text) {
        const queryEmbedding = await textEmbeddingService.generateQueryEmbedding(query.text);
        results.vectorResults = await this.searchCandidatesByEmbedding(
          queryEmbedding, 
          query.topN || 10
        );
      }

      // Traditional filtering
      if (query.skills || query.experience || query.location) {
        // TODO: Implement database filtering
        // This would use the regular database service with where clauses
        results.filterResults = [];
      }

      return results;
    } catch (error) {
      dbLogger.error('Hybrid candidate search failed', {
        error: String(error),
        query
      });
      throw error;
    }
  }

  /**
   * Batch update embeddings for existing candidates
   */
  async batchUpdateCandidateEmbeddings(
    updates: Array<{
      candidateId: string;
      resumeEmbedding: number[];
      extractedResumeText: string;
    }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const update of updates) {
      try {
        // Get existing candidate data
        const candidateProfile = await databaseService.getCandidateProfile(update.candidateId);
        const user = await databaseService.getUserById(update.candidateId);
        
        if (candidateProfile && user) {
          await this.saveCandidateWithEmbedding(update.candidateId, {
            fullName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            currentTitle: candidateProfile.currentTitle,
            extractedResumeText: update.extractedResumeText,
            resumeEmbedding: update.resumeEmbedding,
            skills: candidateProfile.skills,
            phone: candidateProfile.phone,
            linkedinProfile: candidateProfile.linkedinUrl,
            portfolioUrl: candidateProfile.portfolioUrl,
            experienceSummary: candidateProfile.summary,
            resumeFileUrl: candidateProfile.resumeUrl,
            videoIntroductionUrl: candidateProfile.videoIntroUrl
          });
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        dbLogger.error('Failed to update candidate embedding', {
          candidateId: update.candidateId,
          error: String(error)
        });
        failed++;
      }
    }

    dbLogger.info('Batch embedding update completed', { success, failed });
    return { success, failed };
  }
}

export const embeddingDatabaseService = new EmbeddingDatabaseService();
export default embeddingDatabaseService;