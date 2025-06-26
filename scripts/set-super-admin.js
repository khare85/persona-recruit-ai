#!/usr/bin/env node

/**
 * Script to set super admin role for a user
 * Usage: node scripts/set-super-admin.js <email>
 */

const admin = require('firebase-admin');
const path = require('path');

// Check if email argument is provided
const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/set-super-admin.js <email>');
  process.exit(1);
}

// Initialize Firebase Admin
try {
  // Try to use service account key if available
  const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.log('Service account key not found, trying default credentials...');
  admin.initializeApp();
}

async function setSuperAdminRole(email) {
  try {
    console.log(`Setting super admin role for: ${email}`);
    
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${user.uid}`);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'super_admin',
      companyId: null
    });
    console.log('Custom claims set successfully');
    
    // Update Firestore document
    await admin.firestore().collection('users').doc(user.uid).set({
      email: user.email,
      uid: user.uid,
      role: 'super_admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('Firestore document updated');
    
    console.log(`\n✅ Successfully set super admin role for ${email}`);
    console.log('\nNext steps:');
    console.log('1. Have the user sign out and sign back in');
    console.log('2. Or use the "Force Refresh Token" button in /debug-auth');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the function
setSuperAdminRole(email)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));