
import admin from 'firebase-admin';

let app: admin.app.App | undefined;

const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    try {
      const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
      if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-talent-stream',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ai-talent-stream.firebasestorage.app'
        });
        console.log('[FirebaseAdmin] Initialized with Service Account JSON.');
      } else {
        app = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-talent-stream',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ai-talent-stream.firebasestorage.app'
        });
        console.log('[FirebaseAdmin] Initialized with Application Default Credentials.');
      }
    } catch (error) {
      console.error('[FirebaseAdmin] Initialization failed:', error);
      // Log the specific error and environment details for better debugging.
      console.error(`  - GOOGLE_APPLICATION_CREDENTIALS_JSON is ${serviceAccountJson ? 'set' : 'not set'}`);
      console.error(`  - Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
      throw new Error(`Firebase Admin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    app = admin.app();
    console.log('[FirebaseAdmin] Using existing Firebase Admin app instance.');
  }
  return app;
};

export const getFirebaseAdmin = async () => {
  if (!app) {
    initializeFirebaseAdmin();
  }
  return app!;
};
