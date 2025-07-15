
import admin from 'firebase-admin';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let appPromise: Promise<admin.app.App> | null = null;

const initializeFirebaseAdmin = async (): Promise<admin.app.App> => {
  if (admin.apps.length > 0) {
    console.log('[FirebaseAdmin] Using existing Firebase Admin app instance.');
    return admin.app();
  }

  console.log('[FirebaseAdmin] Initializing new Firebase Admin app instance...');
  
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-talent-stream';
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ai-talent-stream.firebasestorage.app';
    
    // Try different credential sources in order of preference
    let app: admin.app.App;
    
    // 1. Check for service account JSON in environment
    const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (serviceAccountJson) {
      console.log('[FirebaseAdmin] Using service account from GOOGLE_APPLICATION_CREDENTIALS_JSON');
      const serviceAccount = JSON.parse(serviceAccountJson);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
        storageBucket
      });
      console.log('[FirebaseAdmin] Initialized successfully with Service Account JSON.');
      return app;
    }
    
    // 2. Try to get service account from Secret Manager
    try {
      const secretClient = new SecretManagerServiceClient();
      const secretName = process.env.FIREBASE_SERVICE_ACCOUNT_SECRET || 'firebase-service-account';
      const [version] = await secretClient.accessSecretVersion({
        name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
      });
      
      if (version.payload?.data) {
        const secretValue = version.payload.data.toString('utf8');
        let serviceAccount;
        
        try {
          serviceAccount = JSON.parse(secretValue);
        } catch {
          // Try base64 decoding
          const decoded = Buffer.from(secretValue, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        }
        
        console.log('[FirebaseAdmin] Using service account from Secret Manager');
        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId,
          storageBucket
        });
        console.log('[FirebaseAdmin] Initialized successfully with Secret Manager service account.');
        return app;
      }
    } catch (secretError) {
      console.warn('[FirebaseAdmin] Could not retrieve service account from Secret Manager:', secretError);
    }
    
    // 3. Try Application Default Credentials (for Cloud Run, etc.)
    console.log('[FirebaseAdmin] Attempting to initialize with Application Default Credentials.');
    app = admin.initializeApp({
      projectId,
      storageBucket
    });
    console.log('[FirebaseAdmin] Initialized successfully with Application Default Credentials.');
    return app;
    
  } catch (error) {
    console.error('[FirebaseAdmin] CRITICAL: Initialization failed:', error);
    console.error(`  - GOOGLE_APPLICATION_CREDENTIALS_JSON is ${process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'set' : 'not set'}`);
    console.error(`  - FIREBASE_SERVICE_ACCOUNT_SECRET: ${process.env.FIREBASE_SERVICE_ACCOUNT_SECRET || 'firebase-service-account'}`);
    console.error(`  - Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
    throw new Error(`Firebase Admin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getFirebaseAdmin = (): Promise<admin.app.App> => {
  if (!appPromise) {
    appPromise = initializeFirebaseAdmin();
  }
  return appPromise;
};

// Export commonly used services
export const auth = {
  verifyIdToken: async (token: string) => {
    const app = await getFirebaseAdmin();
    return app.auth().verifyIdToken(token);
  }
};
