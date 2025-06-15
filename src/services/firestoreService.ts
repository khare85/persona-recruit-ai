
'use server';
/**
 * @fileOverview Service for interacting with Firestore, specifically for candidate and job data with embeddings.
 */

import admin from 'firebase-admin';
import type { Timestamp } from 'firebase-admin/firestore';

// --- Firebase Admin SDK Setup ---
// **USER ACTION REQUIRED for actual deployment/local testing with credentials:**
// 1. Ensure your Google Cloud project has Firestore enabled.
// 2. Download your service account key JSON file from the Firebase or Google Cloud Console.
// 3. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the absolute path of this JSON file.
//    - Locally: Create a .env.local file in your project root and add:
//      GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"
//      (Ensure .env.local is in .gitignore)
//    - Deployment (e.g., Firebase App Hosting): Configure this as a secret in your hosting environment.
// 4. Ensure the GCLOUD_PROJECT_ID, DOCAI_LOCATION, and DOCAI_PROCESSOR_ID env variables are set.
//
// The initialization below will be attempted. If credentials are not found or are invalid,
// Firestore operations will fail at runtime.

if (!admin.apps.length) {
  try {
    console.log('[FirestoreService] Attempting to initialize Firebase Admin SDK...');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('[FirestoreService] Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('[FirestoreService] Error initializing Firebase Admin SDK. Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly and the service account has appropriate permissions. Details:', error);
    // In a real app, you might want to throw this error or implement a more robust retry/fallback.
    // For this demo, operations will likely fail if this step doesn't succeed.
  }
}

let db: admin.firestore.Firestore;
try {
  db = admin.firestore();
  console.log('[FirestoreService] Firestore DB instance acquired.');
} catch (error) {
  console.error('[FirestoreService] Failed to acquire Firestore DB instance. Admin SDK might not be initialized. Details:', error);
  // db remains undefined, operations will fail.
}
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
  extractedResumeText: string; // Full text used for embedding
  resumeEmbedding: number[];    // Vector embedding
  skills: string[];
  phone?: string;
  linkedinProfile?: string;
  portfolioUrl?: string;
  experienceSummary?: string;   // Shorter summary for display/quick review
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
  fullJobDescriptionText: string; // Full text used for embedding
  jobEmbedding: number[];         // Vector embedding
  location?: string;
  jobLevel?: string;
  department?: string;
  responsibilitiesSummary?: string; // For display
  qualificationsSummary?: string;   // For display
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
  console.log(`[FirestoreService] Attempting to save/update candidate ${candidateId} with embedding.`);

  if (!db) {
    const errorMsg = "[FirestoreService] Firestore DB not available. Firebase Admin SDK might not have initialized correctly.";
    console.error(errorMsg);
    return { success: false, message: errorMsg };
  }

  try {
    const candidateRef = db.collection(CANDIDATES_COLLECTION).doc(candidateId);
    const saveData: CandidateWithEmbeddingFirestore = {
      ...data,
      candidateId, // Ensure candidateId is part of the data being saved
      extractedResumeText: data.extractedResumeText,
      resumeEmbedding: data.resumeEmbedding,
      skills: data.skills,
      lastUpdatedAt: admin.firestore.Timestamp.now(),
    };
    await candidateRef.set(saveData, { merge: true });
    console.log(`[FirestoreService] Successfully saved/updated candidate ${candidateId} in Firestore.`);
    return { success: true, message: 'Candidate profile and embedding (simulated) save to Firestore.', candidateId };
  } catch (error) {
    console.error(`[FirestoreService] Error saving candidate ${candidateId} to Firestore:`, error);
    return { success: false, message: `Error saving candidate to Firestore: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Placeholder function to search for candidates by semantic similarity of their resume embeddings.
 * **USER ACTION REQUIRED for actual search functionality:**
 * 1. Create a vector index in Firestore on the 'resumeEmbedding' field in the 'candidates_with_embeddings' collection.
 *    - Go to your Google Cloud Console -> Firestore -> Indexes.
 *    - Create a new index.
 *    - Collection ID: `candidates_with_embeddings`
 *    - Fields to index:
 *      - `resumeEmbedding`: Vector (Dimension: 768 for 'text-embedding-004'. Distance Measure: COSINE is common).
 *    - You might also add other fields (e.g., 'lastUpdatedAt') for filtering/sorting in conjunction with vector search.
 * 2. Replace the mock logic below with actual Firestore vector search queries using `findNearest`.
 *
 * @param queryEmbedding The embedding vector of the search query.
 * @param topN The number of top matching candidates to return.
 * @returns A promise that resolves to an array of matching candidate data (or their IDs).
 */
export async function searchCandidatesByEmbedding(
  queryEmbedding: number[],
  topN: number = 5
): Promise<Partial<CandidateWithEmbeddingFirestore>[]> {
  console.log(`[FirestoreService] Attempting to search for ${topN} candidates with query embedding (length: ${queryEmbedding.length}).`);

  if (!db) {
    const errorMsg = "[FirestoreService] Firestore DB not available for search. Firebase Admin SDK might not have initialized correctly.";
    console.error(errorMsg);
    return [];
  }
  try {
    // --- Actual Firestore Vector Search Logic (Illustrative - Needs Index) ---
    // This code is illustrative and requires a vector index to be set up on 'resumeEmbedding'.
    // const snapshot = await db.collection(CANDIDATES_COLLECTION)
    //   .findNearest('resumeEmbedding', admin.firestore.FieldValue.vector(queryEmbedding), {
    //     limit: topN,
    //     distanceMeasure: 'COSINE' // Or 'EUCLIDEAN', 'DOT_PRODUCT'
    //   })
    //   .get();
    //
    // if (snapshot.empty) {
    //   console.log('[FirestoreService] No candidates found via vector search.');
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
    //     // Optionally return other fields like experienceSummary for display
    //     experienceSummary: data.experienceSummary,
    //   });
    // });
    // console.log(`[FirestoreService] Found ${results.length} candidates via vector search (conceptual).`);
    // return results;
    // --- End Actual Firestore Vector Search Logic ---

    // Current mock implementation:
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate async operation
    console.warn("[FirestoreService] searchCandidatesByEmbedding is using MOCK DATA. Implement actual vector search after setting up Firestore indexes.");
    const mockResults: Partial<CandidateWithEmbeddingFirestore>[] = Array.from({ length: Math.min(topN, 2) }).map((_, i) => ({
        candidateId: `mock-cand-${i+1}`,
        fullName: `Mock Candidate ${i+1} (Search Result)`,
        currentTitle: 'Mock Title from Search',
        skills: ['Mock Searched Skill A', 'Mock Searched Skill B'],
        experienceSummary: 'This is a mock candidate profile returned by the placeholder search function.',
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
  console.log(`[FirestoreService] Attempting to save/update job ${jobId} with embedding.`);

  if (!db) {
    const errorMsg = "[FirestoreService] Firestore DB not available. Firebase Admin SDK might not have initialized correctly.";
    console.error(errorMsg);
    return { success: false, message: errorMsg };
  }

  try {
    const jobRef = db.collection(JOBS_COLLECTION).doc(jobId);
    const saveData: JobWithEmbeddingFirestore = {
      ...data,
      jobId, // Ensure jobId is part of the data being saved
      fullJobDescriptionText: data.fullJobDescriptionText,
      jobEmbedding: data.jobEmbedding,
      lastUpdatedAt: admin.firestore.Timestamp.now(),
    };
    await jobRef.set(saveData, { merge: true });
    console.log(`[FirestoreService] Successfully saved/updated job ${jobId} in Firestore.`);
    return { success: true, message: 'Job details and embedding (simulated) save to Firestore.', jobId };
  } catch (error) {
    console.error(`[FirestoreService] Error saving job ${jobId} to Firestore:`, error);
    return { success: false, message: `Error saving job to Firestore: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Placeholder function to search for jobs by semantic similarity of their description embeddings.
 * **USER ACTION REQUIRED for actual search functionality:**
 * 1. Create a vector index in Firestore on the 'jobEmbedding' field in the 'jobs_with_embeddings' collection.
 *    - Go to your Google Cloud Console -> Firestore -> Indexes.
 *    - Create a new index.
 *    - Collection ID: `jobs_with_embeddings`
 *    - Fields to index:
 *      - `jobEmbedding`: Vector (Dimension: 768 for 'text-embedding-004'. Distance Measure: COSINE is common).
 *    - You might also add other fields (e.g., 'companyName', 'location') for filtering/sorting.
 * 2. Replace the mock logic below with actual Firestore vector search queries using `findNearest`.
 *
 * @param queryEmbedding The embedding vector of the search query.
 * @param topN The number of top matching jobs to return.
 * @returns A promise that resolves to an array of matching job data (or their IDs).
 */
export async function searchJobsByEmbedding(
  queryEmbedding: number[],
  topN: number = 5
): Promise<Partial<JobWithEmbeddingFirestore>[]> {
  console.log(`[FirestoreService] Attempting to search for ${topN} jobs with query embedding (length: ${queryEmbedding.length}).`);

  if (!db) {
    const errorMsg = "[FirestoreService] Firestore DB not available for search. Firebase Admin SDK might not have initialized correctly.";
    console.error(errorMsg);
    return [];
  }
  try {
    // --- Actual Firestore Vector Search Logic (Illustrative - Needs Index) ---
    // const snapshot = await db.collection(JOBS_COLLECTION)
    //   .findNearest('jobEmbedding', admin.firestore.FieldValue.vector(queryEmbedding), {
    //     limit: topN,
    //     distanceMeasure: 'COSINE'
    //   })
    //   .get();
    //
    // if (snapshot.empty) {
    //   console.log('[FirestoreService] No jobs found via vector search.');
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
    //       // Optionally return other fields like responsibilitiesSummary for display
    //       responsibilitiesSummary: data.responsibilitiesSummary,
    //     });
    // });
    // console.log(`[FirestoreService] Found ${results.length} jobs via vector search (conceptual).`);
    // return results;
    // --- End Actual Firestore Vector Search Logic ---

    // Current mock implementation:
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate async operation
    console.warn("[FirestoreService] searchJobsByEmbedding is using MOCK DATA. Implement actual vector search after setting up Firestore indexes.");
    const mockResults: Partial<JobWithEmbeddingFirestore>[] = Array.from({ length: Math.min(topN, 2) }).map((_, i) => ({
      jobId: `mock-job-${i+1}`,
      title: `Mock Job Title ${i+1} (Search Result)`,
      companyName: 'Mock Company Inc. (Search Result)',
      location: 'Remote (Mock)',
      responsibilitiesSummary: 'This is a mock job description returned by the placeholder search function.'
    }));
    return mockResults;

  } catch (error) {
    console.error('[FirestoreService] Error during job vector search:', error);
    return [];
  }
}
