import { onCall } from "firebase-functions/v2/https";
import { auth } from "firebase-functions/v1";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const adminAuth = getAuth();

/**
 * Cloud Function that triggers when a new user is created
 * Automatically creates a candidate profile for users with role 'candidate'
 */
export const onUserCreate = auth.user().onCreate(async (user: any) => {
  try {
    console.log('New user created:', user.uid);
    
    // Set default custom claims for candidate role
    await adminAuth.setCustomUserClaims(user.uid, {
      role: 'candidate'
    });
    
    // Create basic candidate profile
    const candidateProfile = {
      userId: user.uid,
      currentTitle: 'Professional',
      summary: '',
      skills: [],
      profileComplete: false,
      availableForWork: true,
      phone: '',
      location: '',
      linkedinUrl: '',
      portfolioUrl: '',
      resumeUrl: '',
      videoIntroUrl: '',
      availability: 'immediate',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create user document in users collection
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      email: user.email,
      firstName: user.displayName?.split(' ')[0] || '',
      lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
      displayName: user.displayName || '',
      role: 'candidate',
      status: 'active',
      emailVerified: user.emailVerified,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create candidate profile
    await db.collection('candidateProfiles').doc(user.uid).set(candidateProfile);
    
    console.log('Created candidate profile for user:', user.uid);
    
  } catch (error) {
    console.error('Error creating candidate profile:', error);
    // Don't throw error to avoid blocking user creation
  }
});

/**
 * Callable function to set user role and create appropriate profile
 */
export const setUserRole = onCall(async (request: any) => {
  try {
    const { uid, role } = request.data;
    
    if (!uid || !role) {
      throw new Error('Missing uid or role parameter');
    }
    
    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, { role });
    
    // Create appropriate profile based on role
    if (role === 'candidate') {
      const candidateProfile = {
        userId: uid,
        currentTitle: 'Professional',
        summary: '',
        skills: [],
        profileComplete: false,
        availableForWork: true,
        phone: '',
        location: '',
        linkedinUrl: '',
        portfolioUrl: '',
        resumeUrl: '',
        videoIntroUrl: '',
        availability: 'immediate',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('candidateProfiles').doc(uid).set(candidateProfile);
    }
    
    return { success: true, message: 'Role set and profile created' };
    
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new Error('Failed to set user role');
  }
});