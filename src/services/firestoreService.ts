
'use server';
/**
 * @fileOverview Service for interacting with Firestore, specifically for candidate and job data with embeddings.
 * Also initializes Firebase Storage.
 */

import admin from 'firebase-admin';
import type { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Bucket } from '@google-cloud/storage'; // Bucket type for Firebase Storage

// --- Firebase Admin SDK Setup ---
// Assumes GOOGLE_APPLICATION_CREDENTIALS environment variable is set in the deployment environment (e.g., App Hosting secrets).
// For local development, ensure .env.local has GOOGLE_APPLICATION_CREDENTIALS pointing to your service account key JSON file.
// Also ensure GCLOUD_PROJECT_ID, DOCAI_LOCATION, and DOCAI_PROCESSOR_ID are set.

if (!admin.apps.length) {
  try {
    console.log('[FirestoreService] Attempting to initialize Firebase Admin SDK...');
    admin.initializeApp({
       credential: admin.credential.applicationDefault(), // Automatically uses GOOGLE_APPLICATION_CREDENTIALS
    });
    console.log('[FirestoreService] Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('[FirestoreService] Error initializing Firebase Admin SDK. Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly and the service account has appropriate permissions. Details:', error);
  }
}

let db: admin.firestore.Firestore;
let storageBucket: Bucket; // Variable to hold the storage bucket instance

try {
  db = admin.firestore();
  console.log('[FirestoreService] Firestore DB instance acquired.');

  // Initialize Firebase Storage and get a reference to the default bucket
  // The default bucket is usually named <project-id>.appspot.com
  storageBucket = admin.storage().bucket();
  console.log(`[FirestoreService] Firebase Storage bucket '${storageBucket.name}' instance acquired.`);

} catch (error) {
  console.error('[FirestoreService] Failed to acquire Firestore DB or Storage instance. Admin SDK might not be initialized correctly. Details:', error);
  // If these are critical at module load, you might consider throwing an error
  // or implementing a more robust retry/fallback mechanism.
  // For now, we log the error and proceed; functions using db or storageBucket should check if they are defined.
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
  experienceSummary?: string;
  aiGeneratedSummary?: string;
  avatarUrl?: string; // URL of the avatar image in Firebase Storage or external
  videoIntroUrl?: string; // URL of the video intro in Firebase Storage or external
  availability?: string;
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
  responsibilitiesSummary?: string;
  qualificationsSummary?: string;
  lastUpdatedAt: Timestamp;
}


/**
 * Saves/Updates a candidate's profile along with their resume embedding and AI summary to Firestore.
 * @param candidateId The unique ID of the candidate.
 * @param data The candidate data including the embedding and AI summary.
 */
export async function saveCandidateWithEmbedding(
  candidateId: string,
  data: Omit<CandidateWithEmbeddingFirestore, 'candidateId' | 'lastUpdatedAt' | 'resumeEmbedding' | 'extractedResumeText' | 'skills' | 'aiGeneratedSummary' | 'avatarUrl' | 'videoIntroUrl'> & {
    extractedResumeText: string;
    resumeEmbedding: number[];
    skills: string[];
    aiGeneratedSummary?: string;
    avatarUrl?: string; // URLs will be passed after upload
    videoIntroUrl?: string; // URLs will be passed after upload
    availability?: string;
  }
): Promise<{ success: boolean; message: string; candidateId?: string }> {
  console.log(`[FirestoreService] Attempting to save/update candidate ${candidateId}.`);

  if (!db) {
    const errorMsg = "[FirestoreService] Firestore DB not available. Firebase Admin SDK might not have initialized correctly.";
    console.error(errorMsg);
    return { success: false, message: errorMsg };
  }

  try {
    const candidateRef = db.collection(CANDIDATES_COLLECTION).doc(candidateId);
    const saveData: CandidateWithEmbeddingFirestore = {
      ...data,
      candidateId,
      extractedResumeText: data.extractedResumeText,
      resumeEmbedding: data.resumeEmbedding,
      skills: data.skills,
      aiGeneratedSummary: data.aiGeneratedSummary,
      avatarUrl: data.avatarUrl,
      videoIntroUrl: data.videoIntroUrl,
      availability: data.availability,
      lastUpdatedAt: admin.firestore.Timestamp.now(),
    };
    await candidateRef.set(saveData, { merge: true });
    console.log(`[FirestoreService] Successfully saved/updated candidate ${candidateId} in Firestore.`);
    return { success: true, message: 'Candidate profile, embedding, and AI summary saved to Firestore.', candidateId };
  } catch (error) {
    console.error(`[FirestoreService] Error saving candidate ${candidateId} to Firestore:`, error);
    return { success: false, message: `Error saving candidate to Firestore: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Searches for candidates by semantic similarity of their resume embeddings.
 * **MANUAL ACTION REQUIRED for search functionality:**
 * 1. After some data is ingested, go to your Google Cloud Console -> Firestore -> Indexes tab.
 * 2. Create a new Vector Index for the collection: `candidates_with_embeddings`.
 * 3. Fields to index:
 *    - `resumeEmbedding`:
 *      - Index Type: Vector
 *      - Vector dimension: `768` (for 'text-embedding-004' model from Google AI Studio)
 *      - Distance measure: `COSINE` (recommended for text embeddings)
 * 4. Firestore will take some time to build this index. Ensure it's active before relying on search.
 *
 * @param queryEmbedding The embedding vector of the search query.
 * @param topN The number of top matching candidates to return.
 * @returns A promise that resolves to an array of matching candidate data including their distance.
 */
export async function searchCandidatesByEmbedding(
  queryEmbedding: number[],
  topN: number = 5
): Promise<(Partial<CandidateWithEmbeddingFirestore> & { distance?: number })[]> {
  console.log(`[FirestoreService] Attempting to search for ${topN} candidates with query embedding (length: ${queryEmbedding.length}).`);

  if (!db) {
    const errorMsg = "[FirestoreService] Firestore DB not available for search. Firebase Admin SDK might not have initialized correctly.";
    console.error(errorMsg);
    return [];
  }
  try {
    const snapshot = await db.collection(CANDIDATES_COLLECTION)
      .findNearest('resumeEmbedding', admin.firestore.FieldValue.vector(queryEmbedding) as FieldValue, {
        limit: topN,
        distanceMeasure: 'COSINE'
      })
      .get();

    if (snapshot.empty) {
      console.log('[FirestoreService] No candidates found via vector search.');
      return [];
    }
    const results: (Partial<CandidateWithEmbeddingFirestore> & { distance?: number })[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as CandidateWithEmbeddingFirestore;
      results.push({
        candidateId: doc.id,
        fullName: data.fullName,
        currentTitle: data.currentTitle,
        skills: data.skills,
        experienceSummary: data.experienceSummary,
        aiGeneratedSummary: data.aiGeneratedSummary,
        avatarUrl: data.avatarUrl,
        availability: data.availability,
        // @ts-ignore Firestore's `doc.distance` is not strongly typed yet in Node SDK, but should exist.
        distance: doc.distance,
      });
    });
    console.log(`[FirestoreService] Found ${results.length} candidates via vector search.`);
    return results;

  } catch (error) {
    console.error('[FirestoreService] Error during candidate vector search. Ensure vector index is set up correctly on "resumeEmbedding" field with COSINE distance and dimension 768 for collection "candidates_with_embeddings". Error:', error);
    // Consider how to handle this error in the calling flow. For now, returning empty.
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
  console.log(`[FirestoreService] Attempting to save/update job ${jobId}.`);

  if (!db) {
    const errorMsg = "[FirestoreService] Firestore DB not available. Firebase Admin SDK might not have initialized correctly.";
    console.error(errorMsg);
    return { success: false, message: errorMsg };
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
 * Searches for jobs by semantic similarity of their description embeddings.
 * **MANUAL ACTION REQUIRED for search functionality:**
 * 1. After some data is ingested, go to your Google Cloud Console -> Firestore -> Indexes tab.
 * 2. Create a new Vector Index for the collection: `jobs_with_embeddings`.
 * 3. Fields to index:
 *    - `jobEmbedding`:
 *      - Index Type: Vector
 *      - Vector dimension: `768` (for 'text-embedding-004' model)
 *      - Distance measure: `COSINE`
 * 4. Firestore will take some time to build this index. Ensure it's active.
 *
 * @param queryEmbedding The embedding vector of the search query.
 * @param topN The number of top matching jobs to return.
 * @returns A promise that resolves to an array of matching job data including their distance.
 */
export async function searchJobsByEmbedding(
  queryEmbedding: number[],
  topN: number = 5
): Promise<(Partial<JobWithEmbeddingFirestore> & { distance?: number })[]> {
  console.log(`[FirestoreService] Attempting to search for ${topN} jobs with query embedding (length: ${queryEmbedding.length}).`);

  if (!db) {
    const errorMsg = "[FirestoreService] Firestore DB not available for search. Firebase Admin SDK might not have initialized correctly.";
    console.error(errorMsg);
    return [];
  }
  try {
    const snapshot = await db.collection(JOBS_COLLECTION)
      .findNearest('jobEmbedding', admin.firestore.FieldValue.vector(queryEmbedding) as FieldValue, {
        limit: topN,
        distanceMeasure: 'COSINE'
      })
      .get();

    if (snapshot.empty) {
      console.log('[FirestoreService] No jobs found via vector search.');
      return [];
    }
    const results: (Partial<JobWithEmbeddingFirestore> & { distance?: number })[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as JobWithEmbeddingFirestore;
      results.push({
          jobId: doc.id,
          title: data.title,
          companyName: data.companyName,
          location: data.location,
          responsibilitiesSummary: data.responsibilitiesSummary,
          // @ts-ignore Firestore's `doc.distance` is not strongly typed yet in Node SDK, but should exist.
          distance: doc.distance,
        });
    });
    console.log(`[FirestoreService] Found ${results.length} jobs via vector search.`);
    return results;

  } catch (error)
{
    console.error('[FirestoreService] Error during job vector search. Ensure vector index is set up correctly on "jobEmbedding" field with COSINE distance and dimension 768 for collection "jobs_with_embeddings". Error:', error);
    return [];
  }
}

// Export db and storageBucket for use in other services if needed
export { db, storageBucket };
