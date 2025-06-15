
'use server';
/**
 * @fileOverview Service for interacting with Firestore, specifically for candidate and job data with embeddings.
 */

import admin from 'firebase-admin';
import type { Timestamp } from 'firebase-admin/firestore';

// --- Firebase Admin SDK Setup ---
// Ensure your GOOGLE_APPLICATION_CREDENTIALS environment variable is set to the path of your service account key JSON file.
// For App Hosting, this is typically handled by setting secrets.
if (!admin.apps.length) {
  try {
    // admin.initializeApp(); // This will use GOOGLE_APPLICATION_CREDENTIALS by default if set.
    // OR, if you prefer to explicitly load from a path (less common for App Hosting):
    // const serviceAccount = require('/path/to/your/serviceAccountKey.json'); // Update this path if used
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount)
    // });
    admin.initializeApp({
      credential: admin.credential.applicationDefault(), // Recommended for environments where GOOGLE_APPLICATION_CREDENTIALS is set
    });
    console.log('[FirestoreService] Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('[FirestoreService] Error initializing Firebase Admin SDK:', error);
    // Depending on your error handling strategy, you might want to throw this error
    // or handle it in a way that prevents the app from starting if Firebase is critical.
  }
}

const db = admin.firestore();
// --- End Firebase Admin SDK Setup ---

const CANDIDATES_COLLECTION = 'candidates_with_embeddings';
const JOBS_COLLECTION = 'jobs_with_embeddings';


/**
 * Represents the structure of candidate data stored in Firestore, including their resume embedding.
 */
export interface CandidateWithEmbeddingFirestore {
  candidateId: string;
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
  avatarUrl?: string;
  videoIntroUrl?: string;
  lastUpdatedAt: Timestamp;
}

/**
 * Represents the structure of job data stored in Firestore, including its description embedding.
 */
export interface JobWithEmbeddingFirestore {
  jobId: string;
  title: string;
  companyName: string;
  fullJobDescriptionText: string;
  jobEmbedding: number[];
  location?: string;
  jobLevel?: string;
  department?: string;
  responsibilitiesSummary?: string;
  qualificationsSummary?: string;
  lastUpdatedAt: Timestamp;
}


/**
 * Saves/Updates a candidate's profile along with their resume embedding to Firestore.
 * @param candidateId The unique ID of the candidate.
 * @param data The candidate data including the embedding.
 */
export async function saveCandidateWithEmbedding(
  candidateId: string,
  data: Omit<CandidateWithEmbeddingFirestore, 'candidateId' | 'lastUpdatedAt' | 'resumeEmbedding' | 'extractedResumeText' | 'skills'> & { extractedResumeText: string; resumeEmbedding: number[], skills: string[] }
): Promise<{ success: boolean; message: string; candidateId?: string }> {
  console.log(`[FirestoreService] Saving/updating candidate ${candidateId} with embedding.`);
  
  if (!admin.apps.length || !db) {
    console.error("[FirestoreService] Firebase Admin SDK not initialized or Firestore DB unavailable.");
    return { success: false, message: "Firebase Admin SDK not initialized or Firestore DB unavailable." };
  }

  try {
    const candidateRef = db.collection(CANDIDATES_COLLECTION).doc(candidateId);
    const saveData: CandidateWithEmbeddingFirestore = {
      ...data,
      candidateId,
      extractedResumeText: data.extractedResumeText,
      resumeEmbedding: data.resumeEmbedding,
      skills: data.skills,
      lastUpdatedAt: admin.firestore.Timestamp.now(),
    };
    await candidateRef.set(saveData, { merge: true });
    console.log(`[FirestoreService] Successfully saved/updated candidate ${candidateId} in Firestore.`);
    return { success: true, message: 'Candidate profile and embedding saved to Firestore.', candidateId };
  } catch (error) {
    console.error(`[FirestoreService] Error saving candidate ${candidateId} to Firestore:`, error);
    return { success: false, message: `Error saving candidate to Firestore: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Placeholder function to search for candidates by semantic similarity of their resume embeddings.
 * In a real implementation, this would use Firestore's vector search capabilities.
 * @param queryEmbedding The embedding vector of the search query.
 * @param topN The number of top matching candidates to return.
 * @returns A promise that resolves to an array of matching candidate data (or their IDs).
 */
export async function searchCandidatesByEmbedding(
  queryEmbedding: number[],
  topN: number = 5
): Promise<Partial<CandidateWithEmbeddingFirestore>[]> {
  console.log(`[FirestoreService] Searching for ${topN} candidates with query embedding (length: ${queryEmbedding.length}).`);
  
  if (!admin.apps.length || !db) {
    console.error("[FirestoreService] Firebase Admin SDK not initialized or Firestore DB unavailable for search.");
    return [];
  }
  try {
    // This is placeholder logic. Actual vector search requires an index and specific query syntax.
    // Example (conceptual, assuming 'resumeEmbedding' is indexed for vector search):
    // const snapshot = await db.collection(CANDIDATES_COLLECTION)
    //   .findNearest('resumeEmbedding', admin.firestore.FieldValue.vector(queryEmbedding), {
    //     limit: topN,
    //     distanceMeasure: 'COSINE' // Or 'EUCLIDEAN', 'DOT_PRODUCT'
    //   })
    //   .get();
    //
    // if (snapshot.empty) {
    //   return [];
    // }
    // const results: Partial<CandidateWithEmbeddingFirestore>[] = [];
    // snapshot.forEach(doc => {
    //   const data = doc.data() as CandidateWithEmbeddingFirestore;
    //   results.push({ 
    //     candidateId: doc.id, 
    //     fullName: data.fullName,
    //     currentTitle: data.currentTitle,
    //     skills: data.skills,
    //     // extractedResumeText: data.extractedResumeText, // Optionally return for context
    //     // resumeEmbedding: data.resumeEmbedding, // Usually not returned in search results
    //   });
    // });
    // console.log(`[FirestoreService] Found ${results.length} candidates via vector search (conceptual).`);
    // return results;

    // Since vector search setup is a separate step, returning mock data for now.
    await new Promise(resolve => setTimeout(resolve, 300));
    console.warn("[FirestoreService] searchCandidatesByEmbedding is using mock data. Implement actual vector search.");
    const mockResults: Partial<CandidateWithEmbeddingFirestore>[] = Array.from({ length: Math.min(topN, 2) }).map((_, i) => ({
        candidateId: `mock-cand-${i+1}`,
        fullName: `Mock Candidate ${i+1}`,
        currentTitle: 'Mock Title',
        skills: ['Mock Skill A', 'Mock Skill B'],
    }));
    return mockResults;

  } catch (error) {
    console.error('[FirestoreService] Error during candidate vector search:', error);
    return [];
  }
}


/**
 * Saves/Updates a job's details along with its description embedding to Firestore.
 * @param jobId The unique ID of the job.
 * @param data The job data including the embedding.
 */
export async function saveJobWithEmbedding(
  jobId: string,
  data: Omit<JobWithEmbeddingFirestore, 'jobId' | 'lastUpdatedAt' | 'jobEmbedding' | 'fullJobDescriptionText'> & { fullJobDescriptionText: string; jobEmbedding: number[] }
): Promise<{ success: boolean; message: string; jobId?: string }> {
  console.log(`[FirestoreService] Saving/updating job ${jobId} with embedding.`);
  
  if (!admin.apps.length || !db) {
    console.error("[FirestoreService] Firebase Admin SDK not initialized or Firestore DB unavailable.");
    return { success: false, message: "Firebase Admin SDK not initialized or Firestore DB unavailable." };
  }

  try {
    const jobRef = db.collection(JOBS_COLLECTION).doc(jobId);
    const saveData: JobWithEmbeddingFirestore = {
      ...data,
      jobId,
      fullJobDescriptionText: data.fullJobDescriptionText,
      jobEmbedding: data.jobEmbedding,
      lastUpdatedAt: admin.firestore.Timestamp.now(),
    };
    await jobRef.set(saveData, { merge: true });
    console.log(`[FirestoreService] Successfully saved/updated job ${jobId} in Firestore.`);
    return { success: true, message: 'Job details and embedding saved to Firestore.', jobId };
  } catch (error) {
    console.error(`[FirestoreService] Error saving job ${jobId} to Firestore:`, error);
    return { success: false, message: `Error saving job to Firestore: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Placeholder function to search for jobs by semantic similarity of their description embeddings.
 * @param queryEmbedding The embedding vector of the search query.
 * @param topN The number of top matching jobs to return.
 * @returns A promise that resolves to an array of matching job data (or their IDs).
 */
export async function searchJobsByEmbedding(
  queryEmbedding: number[],
  topN: number = 5
): Promise<Partial<JobWithEmbeddingFirestore>[]> {
  console.log(`[FirestoreService] Searching for ${topN} jobs with query embedding (length: ${queryEmbedding.length}).`);
  
  if (!admin.apps.length || !db) {
    console.error("[FirestoreService] Firebase Admin SDK not initialized or Firestore DB unavailable for search.");
    return [];
  }
  try {
    // This is placeholder logic. Actual vector search requires an index and specific query syntax.
    // Example (conceptual, assuming 'jobEmbedding' is indexed for vector search):
    // const snapshot = await db.collection(JOBS_COLLECTION)
    //   .findNearest('jobEmbedding', admin.firestore.FieldValue.vector(queryEmbedding), {
    //     limit: topN,
    //     distanceMeasure: 'COSINE'
    //   })
    //   .get();
    //
    // if (snapshot.empty) {
    //   return [];
    // }
    // const results: Partial<JobWithEmbeddingFirestore>[] = [];
    // snapshot.forEach(doc => {
    //   const data = doc.data() as JobWithEmbeddingFirestore;
    //   results.push({ 
    //       jobId: doc.id, 
    //       title: data.title,
    //       companyName: data.companyName,
    //       location: data.location,
    //     });
    // });
    // console.log(`[FirestoreService] Found ${results.length} jobs via vector search (conceptual).`);
    // return results;
    
    // Since vector search setup is a separate step, returning mock data for now.
    await new Promise(resolve => setTimeout(resolve, 300));
    console.warn("[FirestoreService] searchJobsByEmbedding is using mock data. Implement actual vector search.");
    const mockResults: Partial<JobWithEmbeddingFirestore>[] = Array.from({ length: Math.min(topN, 2) }).map((_, i) => ({
      jobId: `mock-job-${i+1}`,
      title: `Mock Job Title ${i+1}`,
      companyName: 'Mock Company Inc.',
      location: 'Remote',
    }));
    return mockResults;

  } catch (error) {
    console.error('[FirestoreService] Error during job vector search:', error);
    return []; 
  }
}
