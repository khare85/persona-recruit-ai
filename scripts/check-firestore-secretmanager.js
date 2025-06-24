const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

async function getSecretFromManager(secretName, projectId) {
  try {
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await secretClient.accessSecretVersion({ name });
    let secretValue = version.payload.data.toString('utf8');
    
    // Try to parse as JSON first
    try {
      return JSON.parse(secretValue);
    } catch (jsonError) {
      // If that fails, try base64 decoding first
      try {
        const decoded = Buffer.from(secretValue, 'base64').toString('utf8');
        return JSON.parse(decoded);
      } catch (base64Error) {
        console.error('❌ Secret is not valid JSON or base64-encoded JSON');
        throw new Error('Invalid secret format');
      }
    }
  } catch (error) {
    console.error(`❌ Error accessing secret ${secretName}:`, error.message);
    throw error;
  }
}

async function initializeFirebaseWithSecretManager() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'ai-talent-stream';
  const secretName = process.env.FIREBASE_SERVICE_ACCOUNT_SECRET || 'firebase-service-account';
  
  console.log(`🔐 Retrieving Firebase credentials from Secret Manager...`);
  console.log(`📁 Project: ${projectId}`);
  console.log(`🔑 Secret: ${secretName}`);
  
  try {
    // Get service account from Secret Manager
    const serviceAccount = await getSecretFromManager(secretName, projectId);
    
    // Validate service account structure
    if (!serviceAccount || typeof serviceAccount !== 'object') {
      throw new Error('Service account must be a valid JSON object');
    }
    
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Service account missing required fields: project_id, private_key, or client_email');
    }
    
    console.log(`✅ Service account loaded for project: ${serviceAccount.project_id}`);
    console.log(`📧 Service account email: ${serviceAccount.client_email}`);
    
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
      });
    }
    
    console.log('✅ Firebase initialized successfully with Secret Manager credentials');
    return admin.firestore();
    
  } catch (error) {
    console.error('❌ Failed to initialize Firebase with Secret Manager:', error.message);
    throw error;
  }
}

async function checkFirestoreConnection() {
  console.log('🔍 Checking Firestore connection and structure...');
  
  try {
    // Initialize Firebase with Secret Manager
    const db = await initializeFirebaseWithSecretManager();
    console.log(`🗄️  Firestore database initialized`);
    
    // Test basic connectivity
    console.log('\n📡 Testing Firestore connectivity...');
    const testDoc = db.collection('_test').doc('connection-test');
    
    // Write a test document
    await testDoc.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      test: 'Firebase connection successful',
      source: 'secret-manager-test'
    });
    
    console.log('✅ Successfully wrote test document to Firestore');
    
    // Read the test document back
    const docSnapshot = await testDoc.get();
    if (docSnapshot.exists) {
      console.log('✅ Successfully read test document from Firestore');
      const data = docSnapshot.data();
      console.log(`📄 Test document data:`, {
        test: data.test,
        source: data.source,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || 'No timestamp'
      });
    } else {
      console.log('⚠️  Test document was not found');
    }
    
    // Clean up test document
    await testDoc.delete();
    console.log('🧹 Cleaned up test document');
    
    // Check existing collections
    console.log('\n📚 Checking existing collections...');
    const collections = await db.listCollections();
    
    if (collections.length === 0) {
      console.log('📭 No collections found in Firestore');
      console.log('💡 This is normal for a new project');
    } else {
      console.log(`📊 Found ${collections.length} collections:`);
      
      for (const collection of collections) {
        const collectionRef = db.collection(collection.id);
        
        try {
          // Get collection size (limited to avoid large queries)
          const snapshot = await collectionRef.limit(1).get();
          const countSnapshot = await collectionRef.count().get();
          const docCount = countSnapshot.data().count;
          
          console.log(`   • ${collection.id} (${docCount} documents)`);
          
          // Show sample document structure for non-empty collections
          if (!snapshot.empty && docCount > 0) {
            const sampleDoc = snapshot.docs[0];
            const sampleData = sampleDoc.data();
            const fieldCount = Object.keys(sampleData).length;
            const fieldNames = Object.keys(sampleData).slice(0, 5); // Show first 5 fields
            
            console.log(`     └─ Sample fields: ${fieldNames.join(', ')}${fieldCount > 5 ? `, ... (${fieldCount - 5} more)` : ''}`);
          }
        } catch (error) {
          console.log(`   • ${collection.id} (error reading: ${error.message})`);
        }
      }
    }
    
    // Check Firestore rules
    console.log('\n🔒 Firestore Security Rules Info:');
    console.log('   Rules configuration: https://console.firebase.google.com/project/ai-talent-stream/firestore/rules');
    console.log('   Current rules should be reviewed to ensure proper access control');
    
    // Test common application collections
    console.log('\n🧪 Testing common application collections...');
    const commonCollections = ['users', 'companies', 'jobs', 'applications', 'candidates'];
    
    for (const collectionName of commonCollections) {
      try {
        const collectionRef = db.collection(collectionName);
        const countSnapshot = await collectionRef.count().get();
        const docCount = countSnapshot.data().count;
        console.log(`   ✅ ${collectionName}: ${docCount} documents`);
      } catch (error) {
        console.log(`   ⚠️  ${collectionName}: ${error.message}`);
      }
    }
    
    // Performance and quota info
    console.log('\n📊 Firestore Usage Info:');
    console.log('   Monitor usage: https://console.firebase.google.com/project/ai-talent-stream/firestore/usage');
    console.log('   Quotas & limits: https://firebase.google.com/docs/firestore/quotas');
    
    console.log('\n🔗 Firebase Console Links:');
    console.log(`   Firestore Database: https://console.firebase.google.com/project/ai-talent-stream/firestore`);
    console.log(`   Authentication: https://console.firebase.google.com/project/ai-talent-stream/authentication`);
    console.log(`   Storage: https://console.firebase.google.com/project/ai-talent-stream/storage`);
    console.log(`   Project Settings: https://console.firebase.google.com/project/ai-talent-stream/settings/general`);
    
  } catch (error) {
    console.error('❌ Error checking Firestore:', error.message);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission issue:');
      console.log('   1. Ensure your service account has Firestore access');
      console.log('   2. Check IAM permissions in Google Cloud Console');
      console.log('   3. Verify Firestore is enabled for your project');
    } else if (error.code === 'not-found') {
      console.log('\n💡 Database not found:');
      console.log('   1. Ensure Firestore is enabled for your project');
      console.log('   2. Create a Firestore database in the Firebase Console');
      console.log('   3. Choose between Native mode or Datastore mode');
    }
    
    process.exit(1);
  }
}

// Test specific database operations
async function testDatabaseOperations() {
  console.log('\n🧪 Testing database operations...');
  
  try {
    const db = await initializeFirebaseWithSecretManager();
    
    // Test batch operations
    const batch = db.batch();
    const testCollection = db.collection('_test_operations');
    
    // Create multiple test documents
    for (let i = 1; i <= 3; i++) {
      const docRef = testCollection.doc(`test-${i}`);
      batch.set(docRef, {
        id: i,
        name: `Test Document ${i}`,
        created: admin.firestore.FieldValue.serverTimestamp(),
        data: { nested: { value: i * 10 } }
      });
    }
    
    // Execute batch
    await batch.commit();
    console.log('✅ Batch write operation successful');
    
    // Test query operations
    const querySnapshot = await testCollection.where('id', '<=', 2).get();
    console.log(`✅ Query operation successful (${querySnapshot.size} documents)`);
    
    // Test transaction
    await db.runTransaction(async (transaction) => {
      const doc1Ref = testCollection.doc('test-1');
      const doc1 = await transaction.get(doc1Ref);
      
      if (doc1.exists) {
        transaction.update(doc1Ref, { 
          updated: admin.firestore.FieldValue.serverTimestamp(),
          counter: admin.firestore.FieldValue.increment(1)
        });
      }
      
      return doc1.data();
    });
    console.log('✅ Transaction operation successful');
    
    // Cleanup test documents
    const deleteSnapshot = await testCollection.get();
    const deleteBatch = db.batch();
    deleteSnapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
    console.log('🧹 Cleaned up test documents');
    
  } catch (error) {
    console.error('❌ Database operation test failed:', error.message);
  }
}

// Run the check
if (require.main === module) {
  checkFirestoreConnection()
    .then(() => testDatabaseOperations())
    .then(() => {
      console.log('\n✅ Firestore check completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkFirestoreConnection, testDatabaseOperations };