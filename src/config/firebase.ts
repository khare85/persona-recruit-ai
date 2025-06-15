// Backend Firebase Configuration
// This file provides Firebase Admin SDK configuration for server-side operations
import { applicationDefault, getApps, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK with Application Default Credentials
// This works automatically in Google Cloud environments (Cloud Functions, Cloud Run, etc.)
if (getApps().length === 0) {
  try {
    initializeAdminApp({
      credential: applicationDefault(),
      projectId: process.env.GCLOUD_PROJECT_ID || 'ai-talent-stream',
      storageBucket: `${process.env.GCLOUD_PROJECT_ID || 'ai-talent-stream'}.firebasestorage.app`
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
  }
}

// Export Firestore and Storage instances
export const firestore = getFirestore();
export const storage = getStorage();

export default {
  firestore,
  storage
};