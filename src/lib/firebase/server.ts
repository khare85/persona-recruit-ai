
import admin from 'firebase-admin';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { apiLogger } from '@/lib/logger';

let appPromise: Promise<admin.app.App> | null = null;

const initializeFirebaseAdmin = async (): Promise<admin.app.App> => {
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  console.log('[FirebaseAdmin] Initializing new Firebase Admin app instance...');
  
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (!projectId) {
        throw new Error("Firebase Project ID is not configured in environment variables (FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID).");
    }

    // 1. Check for service account JSON in environment
    const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (serviceAccountJson) {
      console.log('[FirebaseAdmin] Using service account from GOOGLE_APPLICATION_CREDENTIALS_JSON');
      const serviceAccount = JSON.parse(serviceAccountJson);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
        storageBucket
      });
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
          const decoded = Buffer.from(secretValue, 'base64').toString('utf8');
          serviceAccount = JSON.parse(decoded);
        }
        
        console.log('[FirebaseAdmin] Using service account from Secret Manager');
        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId,
          storageBucket
        });
      }
    } catch (secretError: any) {
        if(secretError.code !== 5) { // 5 = NOT_FOUND, which is an expected case.
            console.warn('[FirebaseAdmin] Could not retrieve service account from Secret Manager:', secretError.message);
        }
    }
    
    // 3. Try Application Default Credentials (for Cloud Run, etc.)
    console.log('[FirebaseAdmin] Attempting to initialize with Application Default Credentials.');
    return admin.initializeApp({
      projectId,
      storageBucket
    });
    
  } catch (error) {
    console.error('[FirebaseAdmin] CRITICAL: Firebase Admin initialization failed.', {
      errorMessage: error instanceof Error ? error.message : String(error),
      hasServiceAccountJson: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      secretName: process.env.FIREBASE_SERVICE_ACCOUNT_SECRET || 'firebase-service-account',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
    throw error;
  }
};

export const getFirebaseAdmin = (): Promise<admin.app.App> => {
  if (!appPromise) {
    appPromise = initializeFirebaseAdmin();
  }
  return appPromise;
};

// Export commonly used services that depend on the admin app
export const auth = {
  verifyIdToken: async (token: string) => {
    const app = await getFirebaseAdmin();
    return app.auth().verifyIdToken(token);
  },
  setCustomUserClaims: async (uid: string, claims: object | null) => {
    const app = await getFirebaseAdmin();
    return app.auth().setCustomUserClaims(uid, claims);
  },
  getUserByEmail: async (email: string) => {
    const app = await getFirebaseAdmin();
    return app.auth().getUserByEmail(email);
  },
  createUser: async (properties: admin.auth.CreateRequest) => {
    const app = await getFirebaseAdmin();
    return app.auth().createUser(properties);
  },
  createCustomToken: async (uid: string, developerClaims?: object) => {
    const app = await getFirebaseAdmin();
    return app.auth().createCustomToken(uid, developerClaims);
  }
};

export const firestore = {
  getDb: async () => {
    const app = await getFirebaseAdmin();
    return app.firestore();
  }
};
