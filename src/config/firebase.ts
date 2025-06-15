
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getAnalytics, type Analytics } from 'firebase/analytics'; // Added import
// import { getFirestore, type Firestore } from 'firebase/firestore'; // Uncomment if client-side Firestore is needed
// import { getStorage, type FirebaseStorage } from 'firebase/storage'; // Uncomment if client-side Storage is needed

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Added measurementId
};

let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | undefined; // Analytics can be undefined if not initialized
// let firestore: Firestore; // Uncomment for client-side Firestore
// let storage: FirebaseStorage; // Uncomment for client-side Storage

if (getApps().length) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

auth = getAuth(app);

// Initialize Analytics only on the client side and if measurementId is present
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase Analytics could not be initialized.", error);
    // You might not want to throw an error here, just log it,
    // as Analytics is often non-critical for core app functionality.
  }
}

// firestore = getFirestore(app); // Uncomment for client-side Firestore
// storage = getStorage(app); // Uncomment for client-side Storage

export { app, auth, analytics /*, firestore, storage */ }; // Export analytics
