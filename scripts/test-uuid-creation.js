#!/usr/bin/env node

/**
 * Test script to verify UUID generation in user creation flow
 * Run with: node scripts/test-uuid-creation.js
 */

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function testUUIDCreation() {
  console.log('Testing UUID generation in user creation...\n');

  try {
    // Test data
    const testEmail = `test-uuid-${Date.now()}@example.com`;
    const testUser = {
      email: testEmail,
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      role: 'candidate',
      userType: 'individual',
      status: 'active',
      emailVerified: false,
      companyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };

    // Create user in Firebase Auth
    console.log('1. Creating user in Firebase Auth...');
    const userRecord = await admin.auth().createUser({
      email: testEmail,
      password: 'TestPassword123!',
      displayName: testUser.displayName,
      emailVerified: false
    });
    console.log(`✓ User created with UID: ${userRecord.uid}`);

    // Generate UUID
    const userUUID = uuidv4();
    console.log(`✓ Generated UUID: ${userUUID}`);

    // Add UUID to user data
    const userDocData = {
      ...testUser,
      id: userRecord.uid,
      uuid: userUUID
    };

    // Create user document in Firestore
    console.log('\n2. Creating user document in Firestore...');
    await db.collection('users').doc(userRecord.uid).set(userDocData);
    console.log('✓ User document created');

    // Verify the document
    console.log('\n3. Verifying user document...');
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    const userData = userDoc.data();

    console.log('✓ User document retrieved successfully');
    console.log('\nUser data:');
    console.log(`  - ID: ${userData.id}`);
    console.log(`  - UUID: ${userData.uuid}`);
    console.log(`  - Email: ${userData.email}`);
    console.log(`  - Role: ${userData.role}`);
    console.log(`  - User Type: ${userData.userType}`);

    // Create candidate profile with UUID
    if (userRecord.uid && userData.role === 'candidate') {
      console.log('\n4. Creating candidate profile...');
      const profileUUID = uuidv4();
      const candidateProfile = {
        id: `candidate_${userRecord.uid}`,
        uuid: profileUUID,
        userId: userRecord.uid,
        phone: '',
        location: '',
        currentTitle: '',
        experience: 'Entry Level',
        summary: '',
        skills: [],
        profileComplete: false,
        availableForWork: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('candidateProfiles').doc(userRecord.uid).set(candidateProfile);
      console.log('✓ Candidate profile created');
      console.log(`  - Profile UUID: ${profileUUID}`);
    }

    // Clean up test data
    console.log('\n5. Cleaning up test data...');
    await db.collection('users').doc(userRecord.uid).delete();
    await db.collection('candidateProfiles').doc(userRecord.uid).delete();
    await admin.auth().deleteUser(userRecord.uid);
    console.log('✓ Test data cleaned up');

    console.log('\n✅ UUID creation test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testUUIDCreation()
  .then(() => {
    console.log('\n✨ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });