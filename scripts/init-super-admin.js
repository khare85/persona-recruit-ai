#!/usr/bin/env node

/**
 * Initialize super admin role for first-time setup
 * This script should be run with Firebase Admin SDK credentials
 * Usage: node scripts/init-super-admin.js <email>
 */

const admin = require('firebase-admin');
const path = require('path');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/init-super-admin.js <email>');
  console.error('Example: node scripts/init-super-admin.js admin@example.com');
  process.exit(1);
}

// Initialize Firebase Admin
let initialized = false;
try {
  // Try to use service account key if available
  const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  initialized = true;
  console.log('✓ Using service account credentials');
} catch (error) {
  try {
    // Try using default application credentials (for Google Cloud environments)
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    initialized = true;
    console.log('✓ Using application default credentials');
  } catch (error2) {
    console.error('❌ Failed to initialize Firebase Admin SDK');
    console.error('\nPlease ensure you have either:');
    console.error('1. A serviceAccountKey.json file in the project root');
    console.error('2. GOOGLE_APPLICATION_CREDENTIALS environment variable set');
    console.error('3. Running in a Google Cloud environment with proper permissions');
    process.exit(1);
  }
}

async function initializeSuperAdmin(email) {
  try {
    console.log(`\nInitializing super admin for: ${email}`);
    
    // Get or create user
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log(`✓ Found existing user: ${user.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('User not found. Please create the user first by signing up.');
        process.exit(1);
      }
      throw error;
    }
    
    // Set custom claims for super admin
    const customClaims = {
      role: 'super_admin',
      companyId: null,
      initialized: true
    };
    
    await admin.auth().setCustomUserClaims(user.uid, customClaims);
    console.log('✓ Custom claims set successfully');
    
    // Create/update Firestore document
    const userDoc = {
      uid: user.uid,
      email: user.email,
      role: 'super_admin',
      fullName: user.displayName || 'Super Admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      isSuperAdmin: true
    };
    
    await admin.firestore().collection('users').doc(user.uid).set(userDoc, { merge: true });
    console.log('✓ Firestore user document updated');
    
    // Verify the claims were set
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('\n✅ Super admin initialized successfully!');
    console.log('\nUser details:');
    console.log(`- Email: ${updatedUser.email}`);
    console.log(`- UID: ${updatedUser.uid}`);
    console.log(`- Custom Claims:`, updatedUser.customClaims);
    
    console.log('\n📝 Next steps:');
    console.log('1. Deploy the updated Firestore rules: firebase deploy --only firestore:rules');
    console.log('2. Sign out and sign back in with this email');
    console.log('3. Navigate to /debug-auth to verify the role');
    console.log('4. You should now be able to access /admin/dashboard');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'auth/invalid-email') {
      console.error('The email address is invalid.');
    } else if (error.code === 'auth/user-not-found') {
      console.error('No user found with this email. Please sign up first.');
    }
    process.exit(1);
  } finally {
    // Clean up
    await admin.app().delete();
  }
}

// Run the initialization
initializeSuperAdmin(email)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nUnexpected error:', error);
    process.exit(1);
  });