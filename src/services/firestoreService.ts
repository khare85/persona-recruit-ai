
'use server';
/**
 * @fileOverview Service for interacting with Firestore, specifically for candidate and job data with embeddings.
 */

import admin from 'firebase-admin';
import type { Timestamp, FieldValue } from 'firebase-admin/firestore';

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

if (!admin.apps.length) {
  try {
    console.log('[FirestoreService] Attempting to initialize Firebase Admin SDK...');
    // Initialize Firebase Admin SDK.
    // If GOOGLE_APPLICATION_CREDENTIALS is set, it will be used automatically.
    // Otherwise, you might need to pass credential explicitly:
    // admin.initializeApp({
    //   credential: admin.credential.cert(require('/path/to/your/serviceAccountKey.json'))
    // });
    // For App Hosting and similar environments, applicationDefault usually works if secrets are set up.
    admin.initializeApp({
       credential: admin.credential.applicationDefault(),
    });
    console.log('[FirestoreService] Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('[FirestoreService] Error initializing Firebase Admin SDK. Ensure GOOGLE_APPLICATION_CREDENTIALS (or direct cert path) is set correctly and the service account has appropriate permissions. Details:', error);
  }
}

let db: admin.firestore.Firestore;
try {
  db = admin.firestore();
  console.log('[FirestoreService] Firestore DB instance acquired.');
} catch (error) {
  console.error('[FirestoreService] Failed to acquire Firestore DB instance. Admin SDK might not be initialized. Details:', error);
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
  availability?: string; // e.g., "Immediate", "2 weeks notice" - New Field
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
  data: Omit<CandidateWithEmbeddingFirestore, 'candidateId' | 'lastUpdatedAt' | 'resumeEmbedding' | 'extractedResumeText' | 'skills'> & { extractedResumeText: string; resumeEmbedding: number[], skills: string[], availability?: string }
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
      candidateId,
      extractedResumeText: data.extractedResumeText,
      resumeEmbedding: data.resumeEmbedding,
      skills: data.skills,
      availability: data.availability, // Save availability if provided
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
 * Searches for candidates by semantic similarity of their resume embeddings.
 * **USER ACTION REQUIRED for actual search functionality:**
 * 1. Go to your Google Cloud Console -> Firestore -> Indexes tab.
 * 2. Create a new Vector Index for the collection: `candidates_with_embeddings`.
 * 3. Fields to index:
 *    - `resumeEmbedding`:
 *      - Index Type: Vector
 *      - Vector dimension: `768` (for 'text-embedding-004' model from Google AI Studio)
 *      - Distance measure: `COSINE` (recommended for text embeddings)
 *    - (Optional) You can add other fields like `availability` or `lastUpdatedAt` for filtering in conjunction with vector search if needed.
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
      .findNearest('resumeEmbedding', admin.firestore.FieldValue.vector(queryEmbedding) as FieldValue, { // Cast to FieldValue
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
 * **USER ACTION REQUIRED for actual search functionality:**
 * 1. Go to your Google Cloud Console -> Firestore -> Indexes tab.
 * 2. Create a new Vector Index for the collection: `jobs_with_embeddings`.
 * 3. Fields to index:
 *    - `jobEmbedding`:
 *      - Index Type: Vector
 *      - Vector dimension: `768` (for 'text-embedding-004' model)
 *      - Distance measure: `COSINE`
 *    - (Optional) Add other fields like `companyName`, `location` for filtering.
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
      .findNearest('jobEmbedding', admin.firestore.FieldValue.vector(queryEmbedding) as FieldValue, { // Cast to FieldValue
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

  } catch (error) {
    console.error('[FirestoreService] Error during job vector search. Ensure vector index is set up correctly on "jobEmbedding" field with COSINE distance and dimension 768 for collection "jobs_with_embeddings". Error:', error);
    return [];
  }
}
