
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ai-talent-stream'
});

const db = admin.firestore();

const users = [
  {
    email: 'admin@brighttier.com',
    password: 'admin123',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin'
  },
  {
    email: 'recruiter@techcorp.com',
    password: 'recruiter123',
    firstName: 'Tech',
    lastName: 'Recruiter',
    role: 'recruiter',
    companyId: null // Will be assigned later
  },
  {
    email: 'candidate@example.com',
    password: 'candidate123',
    firstName: 'John',
    lastName: 'Candidate',
    role: 'candidate'
  }
];

async function setupUsers() {
  console.log('Setting up users...\n');
  
  for (const userData of users) {
    try {
      // Check if user exists in Firebase Auth
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(userData.email);
        console.log(`✓ User ${userData.email} already exists in Firebase Auth (${userRecord.uid})`);
      } catch (error) {
        // User doesn't exist, create it
        userRecord = await admin.auth().createUser({
          email: userData.email,
          password: userData.password,
          displayName: `${userData.firstName} ${userData.lastName}`,
          emailVerified: true // Set as verified for testing
        });
        console.log(`✓ Created user ${userData.email} in Firebase Auth (${userRecord.uid})`);
      }
      
      // Set custom claims for role
      const customClaims = { role: userData.role };
      if (userData.companyId) {
        customClaims.companyId = userData.companyId;
      }
      await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
      console.log(`✓ Set custom claims for ${userData.email}:`, customClaims);

      // Check if user exists in Firestore
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      
      if (!userDoc.exists) {
        // Create user in Firestore
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(userData.password, 12);
        
        await db.collection('users').doc(userRecord.uid).set({
          id: userRecord.uid,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          status: 'active',
          emailVerified: true,
          passwordHash: passwordHash,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✓ Created user ${userData.email} in Firestore with role: ${userData.role}`);
      } else {
        // Update role if different
        const existingData = userDoc.data();
        if (existingData.role !== userData.role) {
          await db.collection('users').doc(userRecord.uid).update({
            role: userData.role,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✓ Updated ${userData.email} role from ${existingData.role} to ${userData.role}`);
        } else {
          console.log(`✓ User ${userData.email} already exists in Firestore with role: ${userData.role}`);
        }
      }
      
    } catch (error) {
      console.error(`✗ Error setting up user ${userData.email}:`, error.message);
    }
  }
  
  console.log('\nSetup complete!');
  process.exit(0);
}

setupUsers();
