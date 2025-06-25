
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

try {
  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not set.');
  }
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'ai-talent-stream'
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function createCompany() {
  try {
    const companyData = {
      name: 'DesignFirst Studio',
      domain: 'designfirst.com',
      industry: 'Design',
      size: '11-50',
      location: 'New York, NY',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedAt: null
    };
    
    // Check if company already exists
    const companiesSnapshot = await db.collection('companies')
      .where('domain', '==', companyData.domain)
      .limit(1)
      .get();
      
    if (!companiesSnapshot.empty) {
      console.log(`✓ Company "${companyData.name}" already exists.`);
      return companiesSnapshot.docs[0].id;
    }
    
    const companyRef = await db.collection('companies').add(companyData);
    console.log(`✅ Company "${companyData.name}" created with ID: ${companyRef.id}`);
    return companyRef.id;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
}

async function createCompanyAdmin(companyId, companyName) {
  try {
    const adminEmail = 'admin@designfirst.com';
    const adminPassword = 'admin123';

    // Check if user exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(adminEmail);
      console.log(`✓ User ${adminEmail} already exists in Auth.`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: 'DesignFirst Admin',
          emailVerified: true
        });
        console.log(`✓ Created user ${adminEmail} in Auth.`);
      } else {
        throw error;
      }
    }
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'company_admin',
      companyId: companyId
    });
    console.log(`✓ Set custom claims for ${adminEmail}.`);

    // Create/update user in Firestore
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const userDoc = {
      id: userRecord.uid,
      email: adminEmail,
      firstName: 'Company',
      lastName: 'Administrator',
      role: 'company_admin',
      status: 'active',
      companyId: companyId,
      passwordHash: hashedPassword,
      emailVerified: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
    console.log(`✓ Created/updated user document for ${adminEmail} in Firestore.`);

    return userRecord.uid;
  } catch (error) {
    console.error('Error creating company admin:', error);
    throw error;
  }
}

async function main() {
  try {
    const companyId = await createCompany();
    const companyName = 'DesignFirst Studio';
    const adminId = await createCompanyAdmin(companyId, companyName);
    
    console.log('\n🎉 Company admin setup complete!');
    console.log(`Company: ${companyName} (${companyId})`);
    console.log(`Admin: admin@designfirst.com / admin123`);
    console.log(`Admin User ID: ${adminId}`);
  } catch (error) {
    console.error('An error occurred during setup:', error);
  } finally {
    process.exit(0);
  }
}

main();
