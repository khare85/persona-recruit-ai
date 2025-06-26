import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Cloud Function to set super admin role for a user
 * This should be called manually or through a secure admin interface
 * 
 * Usage: 
 * - Deploy this function to Firebase
 * - Call it with the user's email to grant super admin access
 */
export const setSuperAdminRole = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // In production, you should check if the caller is already a super admin
  // For initial setup, you might need to manually verify the first super admin
  
  const { email } = data;
  
  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with an email.'
    );
  }

  try {
    // Get the user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'super_admin',
      companyId: null // Super admins don't belong to a specific company
    });
    
    // Also update the Firestore document
    await admin.firestore().collection('users').doc(user.uid).update({
      role: 'super_admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: `Successfully set super admin role for ${email}`
    };
  } catch (error) {
    console.error('Error setting super admin role:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Unable to set super admin role.'
    );
  }
});

/**
 * Alternative: HTTP endpoint for initial super admin setup
 * This should be removed or secured after initial setup
 */
export const initializeSuperAdmin = functions.https.onRequest(async (req, res) => {
  // In production, add proper authentication here
  // This is only for initial setup
  
  const { email, secret } = req.body;
  
  // Add a secret key check for security
  if (secret !== process.env.ADMIN_SETUP_SECRET) {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }
  
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  
  try {
    const user = await admin.auth().getUserByEmail(email);
    
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'super_admin',
      companyId: null
    });
    
    await admin.firestore().collection('users').doc(user.uid).set({
      email: user.email,
      role: 'super_admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    res.json({
      success: true,
      message: `Successfully initialized super admin for ${email}`
    });
  } catch (error) {
    console.error('Error initializing super admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});