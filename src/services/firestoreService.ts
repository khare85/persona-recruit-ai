
'use server';
/**
 * @fileOverview Service for interacting with Firestore, specifically for candidate and job data with embeddings.
 * Also initializes Firebase Storage and provides file upload capabilities.
 */

import admin from 'firebase-admin';
import type { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Bucket } from '@google-cloud/storage'; // Bucket type for Firebase Storage
import { randomUUID } from 'crypto'; // For generating unique filenames

// --- Firebase Admin SDK Setup ---
// The Firebase Admin SDK needs to be initialized to interact with Firebase services.
if (!admin.apps.length) {
  try {
    console.log('[FirestoreService] Attempting to initialize Firebase Admin SDK...');
    // For deployment to Firebase App Hosting (and other GCP managed environments like Cloud Functions, Cloud Run):
    // `applicationDefault()` automatically finds the credentials provided by the environment.
    // Ensure the service account associated with your App Hosting backend has the necessary IAM permissions.
    admin.initializeApp({
       credential: admin.credential.applicationDefault(),
    });
    console.log('[FirestoreService] Firebase Admin SDK initialized successfully using Application Default Credentials.');
  } catch (error) {
    console.error('[FirestoreService] Error initializing Firebase Admin SDK with Application Default Credentials. This method is expected to work in GCP managed environments (like Firebase App Hosting). Error details:', error);
    // For local development, if Application Default Credentials are not set up (e.g., via `gcloud auth application-default login`),
    // you might need to use a service account key file. Example (DO NOT commit service account keys to your repository):
    //
    // try {
    //   const serviceAccount = require('/path/to/your/serviceAccountKey.json'); // Replace with the actual path
    //   admin.initializeApp({
    //     credential: admin.credential.cert(serviceAccount)
    //   });
    //   console.log('[FirestoreService] Firebase Admin SDK initialized successfully using a service account key file (local development).');
    // } catch (localError) {
    //   console.error('[FirestoreService] Failed to initialize with service account key file as well. Local error:', localError);
    //   console.error('[FirestoreService] Please ensure Firebase Admin SDK is correctly configured for your environment.');
    // }
  }
}

let db: admin.firestore.Firestore;
let storageBucket: Bucket;

try {
  db = admin.firestore();
  console.log('[FirestoreService] Firestore DB instance acquired.');

  storageBucket = admin.storage().bucket(); // Uses default bucket from project
  console.log(`[FirestoreService] Firebase Storage bucket '${storageBucket.name}' instance acquired.`);

} catch (error) {
  console.error('[FirestoreService] Failed to acquire Firestore DB or Storage instance. Details:', error);
  // This error might occur if admin.initializeApp() failed earlier.
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
 * Uploads a file to Firebase Storage.
 * @param fileBuffer The Buffer of the file content to upload.
 * @param destinationPath The full path in Firebase Storage where the file should be saved (e.g., `candidates/candidate123/profile.jpg`).
 * @param contentType The MIME type of the file.
 * @returns A promise that resolves to the public URL of the uploaded file.
 */
export async function uploadFileToStorage(fileBuffer: Buffer, destinationPath: string, contentType: string): Promise<string> {
  console.log(`[StorageService] Attempting to upload file to: ${destinationPath} with type: ${contentType}`);
  if (!storageBucket) {
    const errorMsg = "[StorageService] Firebase Storage bucket not available. Ensure Firebase Admin SDK initialized correctly.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const storageFile = storageBucket.file(destinationPath);

  try {
    await storageFile.save(fileBuffer, {
      metadata: {
        contentType: contentType,
      },
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${storageBucket.name}/${destinationPath}`;

    console.log(`[StorageService] File uploaded successfully. Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`[StorageService] Error uploading file to ${destinationPath}:`, error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
  }
}


/**
 * Saves/Updates a candidate's profile along with their resume embedding and AI summary to Firestore.
 */
export async function saveCandidateWithEmbedding(
  candidateId: string,
  data: Omit<CandidateWithEmbeddingFirestore, 'candidateId' | 'lastUpdatedAt' | 'resumeEmbedding' | 'extractedResumeText' | 'skills' | 'aiGeneratedSummary' | 'profilePictureUrl' | 'videoIntroductionUrl' | 'resumeFileUrl'> & {
    extractedResumeText: string;
    resumeEmbedding: number[];
    skills: string[];
    aiGeneratedSummary?: string;
    profilePictureUrl?: string;
    videoIntroductionUrl?: string;
    resumeFileUrl?: string;
    availability?: string;
  }
): Promise<{ success: boolean; message: string; candidateId?: string }> {
  console.log(`[FirestoreService] Attempting to save/update candidate ${candidateId}.`);

  if (!db) {
    const errorMsg = "[FirestoreService] Firestore DB not available. Ensure Firebase Admin SDK initialized correctly.";
    console.error(errorMsg);
    return { success: false, message: errorMsg };
  }

  try {
    const candidateRef = db.collection(CANDIDATES_COLLECTION).doc(candidateId);
    const saveData: CandidateWithEmbeddingFirestore = {
      candidateId, 
      fullName: data.fullName,
      email: data.email,
      currentTitle: data.currentTitle,
      extractedResumeText: data.extractedResumeText,
      resumeEmbedding: data.resumeEmbedding,
      skills: data.skills,
      aiGeneratedSummary: data.aiGeneratedSummary,
      profilePictureUrl: data.profilePictureUrl,
      videoIntroductionUrl: data.videoIntroductionUrl,
      resumeFileUrl: data.resumeFileUrl,
      phone: data.phone,
      linkedinProfile: data.linkedinProfile,
      portfolioUrl: data.portfolioUrl,
      experienceSummary: data.experienceSummary,
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
    const errorMsg = "[FirestoreService] Firestore DB not available for search. Ensure Firebase Admin SDK initialized correctly.";
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
        profilePictureUrl: data.profilePictureUrl,
        availability: data.availability,
        // @ts-ignore Firestore's `doc.distance` is not strongly typed yet in Node SDK, but should exist.
        distance: doc.distance,
      });
    });
    console.log(`[FirestoreService] Found ${results.length} candidates via vector search.`);
    return results;

  } catch (error) {
    console.error('[FirestoreService] Error during candidate vector search. Ensure vector index is set up correctly on "resumeEmbedding" (dim:768, COSINE) for collection "candidates_with_embeddings". Error:', error);
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
    const errorMsg = "[FirestoreService] Firestore DB not available. Ensure Firebase Admin SDK initialized correctly.";
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
    const errorMsg = "[FirestoreService] Firestore DB not available for search. Ensure Firebase Admin SDK initialized correctly.";
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
    console.error('[FirestoreService] Error during job vector search. Ensure vector index is set up correctly on "jobEmbedding" (dim:768, COSINE) for collection "jobs_with_embeddings". Error:', error);
    return [];
  }
}

// Export db and storageBucket for use in other services if needed
export { db, storageBucket };

