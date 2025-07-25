
/**
 * @fileOverview Service for interacting with Firestore, specifically for candidate and job data with embeddings.
 * Also initializes Firebase Storage and provides file upload capabilities.
 */

import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app'; // Import App type
import type { Timestamp, FieldValue, Firestore } from 'firebase-admin/firestore';
import type { Bucket } from '@google-cloud/storage'; // Bucket type for Firebase Storage
import { getFirebaseAdmin } from '@/lib/firebase/server';

let app: App | undefined;
let db: Firestore | undefined;
let storageBucket: Bucket | undefined;

(async () => {
    try {
        app = await getFirebaseAdmin();
        if (app) {
            db = admin.firestore(app);
            const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ai-talent-stream.firebasestorage.app';
            storageBucket = admin.storage(app).bucket(bucketName);
            console.log('[FirestoreService] Firestore and Storage instances acquired.');
        } else {
            console.warn('[FirestoreService] Firebase Admin SDK app instance is not available. Firestore and Storage operations will be disabled.');
        }
    } catch (error) {
        console.error('[FirestoreService] Error getting Firebase Admin instance. Details:', error);
    }
})();

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
      public: true, // Make file publicly readable
    });

    // Construct the public URL. Format can vary slightly based on bucket/project settings.
    // This is a common format for default buckets.
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
 *      - Vector dimension: `768` (for 'textembedding-gecko-multilingual' model)
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
    console.error('[FirestoreService] Error during candidate vector search. Ensure vector index is set up correctly on "resumeEmbedding" (dim:768, COSINE) for collection "candidates_with_embeddings" using textembedding-gecko-multilingual model. Error:', error);
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
 *      - Vector dimension: `768` (for 'textembedding-gecko-multilingual' model)
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

  } catch (error) {
    console.error('[FirestoreService] Error during job vector search. Ensure vector index is set up correctly on "jobEmbedding" (dim:768, COSINE) for collection "jobs_with_embeddings" using textembedding-gecko-multilingual model. Error:', error);
    return [];
  }
}

/**
 * Attempt to reload Firebase connection (for recovery)
 */
export async function reloadFirebaseConnection(): Promise<void> {
  try {
    if (db) {
      // Test the connection with a simple operation
      const healthRef = db.collection('_health').doc('connection_test');
      await healthRef.get();
      console.log('[FirestoreService] Firebase connection is healthy');
    }
  } catch (error) {
    console.error('[FirestoreService] Firebase connection reload failed:', error);
    throw error;
  }
}

// Export db and storageBucket for use in other services if needed
// However, it's generally better practice for other services to call functions from this module
// rather than directly accessing db/storageBucket, to encapsulate logic and error handling.
export { db, storageBucket, storageBucket as storage };
