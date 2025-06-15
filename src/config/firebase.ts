// Client-side Firebase Configuration
// This file provides Firebase SDK configuration for client-side operations
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate essential configuration
const requiredConfig = {
  apiKey: firebaseConfig.apiKey,
  projectId: firebaseConfig.projectId
};

const missingKeys = Object.entries(requiredConfig)
  .filter(([_, value]) => !value)
  .map(([key, _]) => key);

if (missingKeys.length > 0) {
  const projectName = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-talent-stream';
  console.warn(`WARNING: ${missingKeys.map(key => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`).join(', ')} ${missingKeys.length === 1 ? 'is' : 'are'} missing${projectName !== 'ai-talent-stream' ? ` for '${projectName}'` : ''}. Client-side Firebase will not initialize correctly.`);
  if (!firebaseConfig.apiKey) {
    console.warn(`WARNING: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing${projectName !== 'ai-talent-stream' ? ` for '${projectName}'` : ''}. Firebase services, especially Authentication, will not initialize correctly. Ensure this environment variable is set with a valid Web API Key from your${projectName !== 'ai-talent-stream' ? ` '${projectName}'` : ''} Firebase project settings.`);
  }
  if (!firebaseConfig.projectId) {
    console.warn(`WARNING: Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) is missing${projectName !== 'ai-talent-stream' ? ` for '${projectName}'` : ''}. Firebase services will not initialize correctly. Ensure this environment variable is set${projectName !== 'ai-talent-stream' ? ` to '${projectName}'` : ''}.`);
  }
}

// Initialize Firebase app
let app;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let analytics: Analytics | undefined;

if (missingKeys.length === 0) {
  // Only initialize if we have the required configuration
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Initialize Firebase services
  try {
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Initialize Analytics only on the client side and if measurementId is present
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
  } catch (error) {
    console.error('Error initializing Firebase services:', error);
  }
} else {
  const projectName = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-talent-stream';
  console.error(`Firebase critical configuration${projectName !== 'ai-talent-stream' ? ` (API Key or Project ID for '${projectName}')` : ' missing. Ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set.'} is missing. Initialization skipped.`);
  console.error(`Firebase Auth initialization skipped: Firebase App was not properly initialized. This usually means NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID${projectName !== 'ai-talent-stream' ? ` for '${projectName}'` : ''} was missing or empty.`);
}

// Export initialized instances
export { auth, db, storage, analytics };

// Also export the app for any custom initialization needs
export default app;