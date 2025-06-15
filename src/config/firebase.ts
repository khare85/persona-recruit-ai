
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getAnalytics, type Analytics } from 'firebase/analytics';

// Retrieve API Key and Project ID from environment variables
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// Log a warning if the API key or Project ID is missing
if (!apiKey) {
  console.warn(
    "WARNING: NEXT_PUBLIC_FIREBASE_API_KEY is missing for 'ai-talent-stream'. Client-side Firebase will not initialize correctly."
  );
}
if (!projectId) {
  console.warn(
    "WARNING: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing for 'ai-talent-stream'. Client-side Firebase will not initialize correctly."
  );
} else if (projectId !== "ai-talent-stream") {
    console.warn(
    `WARNING: NEXT_PUBLIC_FIREBASE_PROJECT_ID is set to '${projectId}' but you intend to use 'ai-talent-stream'. Please ensure consistency for client-side Firebase.`
  );
}


const firebaseConfig = {
  apiKey: apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: measurementId,
};

let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | undefined;

// Check if Firebase app has already been initialized to prevent re-initialization
if (getApps().length === 0) {
  // Only attempt to initialize if critical config is present
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      console.error("Firebase initialization failed with config:", firebaseConfig, "Error:", e);
      app = {} as FirebaseApp; // Fallback to prevent further crashes if app is accessed
    }
  } else {
    console.error("Firebase critical configuration missing for 'ai-talent-stream'. Ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set. Initialization skipped.");
    app = {} as FirebaseApp; // Fallback
  }
} else {
  app = getApp(); // Get the existing app
}

// Initialize Auth only if app was successfully initialized
if (app && app.options && app.options.apiKey) {
  try {
    auth = getAuth(app);
  } catch (e) {
    console.error("Firebase Auth initialization (getAuth) failed. Error:", e);
    console.error("This often means the API Key (NEXT_PUBLIC_FIREBASE_API_KEY), while present, is invalid for the specified Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID='ai-talent-stream'), or the Identity Toolkit API is not enabled, or the key has restrictive settings in Google Cloud Console.");
    auth = {} as Auth; // Fallback
  }
} else {
  console.error(
    "Firebase Auth initialization skipped: Firebase App was not properly initialized. " +
    "This usually means NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID for 'ai-talent-stream' was missing or empty."
  );
  auth = {} as Auth; // Fallback
}

// Initialize Analytics only on the client side and if measurementId is present and app is valid
if (app && app.options && app.options.apiKey && typeof window !== 'undefined' && firebaseConfig.measurementId) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase Analytics could not be initialized for 'ai-talent-stream'.", error);
    analytics = undefined; // Ensure analytics is undefined if init fails
  }
}

export { app, auth, analytics };
