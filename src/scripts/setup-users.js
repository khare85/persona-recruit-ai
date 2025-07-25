
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
try {
  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not set.');
  }
  
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ai-talent-stream'
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function createCompanyIfNotExists(name, domain) {
    const companiesRef = db.collection('companies');
    const snapshot = await companiesRef.where('domain', '==', domain).limit(1).get();

    if (!snapshot.empty) {
        console.log(`✓ Company "${name}" already exists.`);
        return snapshot.docs[0].id;
    }

    const companyData = {
        name,
        domain,
        industry: 'Technology',
        size: '51-200',
        location: 'San Francisco, CA',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: null,
    };
    const companyRef = await companiesRef.add(companyData);
    console.log(`✅ Company "${name}" created with ID: ${companyRef.id}`);
    return companyRef.id;
}


async function setupUser(userData) {
  try {
    // Check if user exists in Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(userData.email);
      console.log(`✓ User ${userData.email} already exists in Auth (${userRecord.uid})`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email: userData.email,
          password: userData.password,
          displayName: `${userData.firstName} ${userData.lastName}`,
          emailVerified: true
        });
        console.log(`✓ Created user ${userData.email} in Auth (${userRecord.uid})`);
      } else {
        throw error;
      }
    }

    // Set custom claims
    const customClaims = { role: userData.role };
    if (userData.companyId) {
      customClaims.companyId = userData.companyId;
    }
    await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
    console.log(`✓ Set custom claims for ${userData.email}:`, customClaims);

    // Create or update user in Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    const firestoreData = {
      id: userRecord.uid,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: `${userData.firstName} ${userData.lastName}`,
      role: userData.role,
      status: 'active',
      emailVerified: true,
      passwordHash: passwordHash,
      companyId: userData.companyId || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedAt: null // FIX: Ensure deletedAt is set
    };
    
    const doc = await userDocRef.get();
    if (!doc.exists) {
      firestoreData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await userDocRef.set(firestoreData);
      console.log(`✓ Created user ${userData.email} in Firestore`);
    } else {
      await userDocRef.update(firestoreData);
      console.log(`✓ Updated user ${userData.email} in Firestore`);
    }

    return userRecord.uid;
  } catch (error) {
    console.error(`✗ Error setting up user ${userData.email}:`, error.message);
    throw error;
  }
}

async function setupUsers() {
  console.log('Setting up users...\n');
  
  const techCorpId = await createCompanyIfNotExists('TechCorp Inc.', 'techcorp.com');

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
      companyId: techCorpId
    },
    {
      email: 'candidate@example.com',
      password: 'candidate123',
      firstName: 'John',
      lastName: 'Candidate',
      role: 'candidate'
    }
  ];

  for (const userData of users) {
    await setupUser(userData);
  }
  
  console.log('\nSetup complete!');
  process.exit(0);
}

setupUsers().catch(error => {
  console.error('\nSetup script failed:', error);
  process.exit(1);
});
