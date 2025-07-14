
import admin from 'firebase-admin';

let appPromise: Promise<admin.app.App> | null = null;

const initializeFirebaseAdmin = (): Promise<admin.app.App> => {
  if (admin.apps.length > 0) {
    console.log('[FirebaseAdmin] Using existing Firebase Admin app instance.');
    return Promise.resolve(admin.app());
  }

  console.log('[FirebaseAdmin] Initializing new Firebase Admin app instance...');
  
  try {
    const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-talent-stream',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ai-talent-stream.firebasestorage.app'
      });
      console.log('[FirebaseAdmin] Initialized successfully with Service Account JSON.');
      return Promise.resolve(app);
    } else {
      // For Vercel, Firebase Hosting, Cloud Run, etc.
      console.log('[FirebaseAdmin] Attempting to initialize with Application Default Credentials.');
      const app = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-talent-stream',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ai-talent-stream.firebasestorage.app'
      });
      console.log('[FirebaseAdmin] Initialized successfully with Application Default Credentials.');
      return Promise.resolve(app);
    }
  } catch (error) {
    console.error('[FirebaseAdmin] CRITICAL: Initialization failed:', error);
    console.error(`  - GOOGLE_APPLICATION_CREDENTIALS_JSON is ${process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'set' : 'not set'}`);
    console.error(`  - Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
    // Return a rejected promise to ensure callers handle the failure.
    return Promise.reject(new Error(`Firebase Admin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
};

export const getFirebaseAdmin = (): Promise<admin.app.App> => {
  if (!appPromise) {
    appPromise = initializeFirebaseAdmin();
  }
  return appPromise;
};
