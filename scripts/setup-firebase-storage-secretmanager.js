const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

async function getSecretFromManager(secretName, projectId) {
  try {
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await secretClient.accessSecretVersion({ name });
    const secretValue = version.payload.data.toString('utf8');
    return JSON.parse(secretValue);
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
    
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
      });
    }
    
    console.log('✅ Firebase initialized successfully with Secret Manager credentials');
    return admin.storage().bucket();
    
  } catch (error) {
    console.error('❌ Failed to initialize Firebase with Secret Manager:', error.message);
    
    if (error.code === 5) { // NOT_FOUND
      console.log('\n💡 Troubleshooting:');
      console.log(`   1. Ensure secret '${secretName}' exists in project '${projectId}'`);
      console.log('   2. Check that your service account has Secret Manager access');
      console.log('   3. Verify the secret contains valid Firebase service account JSON');
      console.log('\n🔧 To create the secret:');
      console.log(`   gcloud secrets create ${secretName} --data-file=serviceAccountKey.json`);
    } else if (error.code === 7) { // PERMISSION_DENIED
      console.log('\n💡 Permission issue:');
      console.log('   1. Ensure your service account has "Secret Manager Secret Accessor" role');
      console.log('   2. Check IAM permissions in Google Cloud Console');
    }
    
    throw error;
  }
}

// Define the folder structure for the application
const folders = [
  // User-related files
  'avatars/',
  'profiles/',
  
  // Company-related files
  'company-logos/',
  'company-documents/',
  
  // Candidate files
  'resumes/',
  'cover-letters/',
  'portfolios/',
  'video-intros/',
  'candidate-documents/',
  
  // Job-related files
  'job-attachments/',
  'job-images/',
  
  // Application files
  'application-documents/',
  
  // Support and communication
  'support-attachments/',
  'chat-attachments/',
  
  // System files
  'backups/',
  'exports/',
  'reports/',
  
  // Temporary uploads
  'temp/',
  
  // Media assets
  'images/',
  'videos/',
  'documents/',
  
  // AI-related files
  'ai-models/',
  'ai-training-data/',
  
  // Analytics and logs
  'analytics-exports/',
  'audit-logs/'
];

async function createStorageFolders() {
  console.log('🚀 Setting up Firebase Storage folder structure...');
  
  try {
    // Initialize Firebase with Secret Manager
    const bucket = await initializeFirebaseWithSecretManager();
    console.log(`📁 Storage bucket: ${bucket.name}`);
    
    const createdFolders = [];
    
    for (const folder of folders) {
      try {
        // Create a placeholder file in each folder to ensure the folder exists
        const placeholderFileName = `${folder}.keep`;
        const file = bucket.file(placeholderFileName);
        
        // Check if the folder already has files
        const [files] = await bucket.getFiles({ prefix: folder });
        
        if (files.length === 0) {
          // Create a placeholder file to establish the folder
          await file.save('# This file ensures the folder exists in Firebase Storage\n# You can safely delete this file once you upload actual files to this folder\n', {
            metadata: {
              contentType: 'text/plain',
              metadata: {
                purpose: 'folder-placeholder',
                createdBy: 'setup-script-secretmanager',
                createdAt: new Date().toISOString()
              }
            }
          });
          createdFolders.push(folder);
          console.log(`✅ Created folder: ${folder}`);
        } else {
          console.log(`📁 Folder already exists: ${folder} (${files.length} files)`);
        }
      } catch (error) {
        console.error(`❌ Error creating folder ${folder}:`, error.message);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Total folders processed: ${folders.length}`);
    console.log(`🆕 New folders created: ${createdFolders.length}`);
    console.log(`📁 Existing folders: ${folders.length - createdFolders.length}`);
    
    if (createdFolders.length > 0) {
      console.log('\n🆕 New folders created:');
      createdFolders.forEach(folder => console.log(`   • ${folder}`));
    }
    
    console.log('\n🔒 Setting up Storage Security Rules...');
    await setupStorageRules();
    
    console.log('\n✅ Firebase Storage setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Check Firebase Console > Storage to verify folders');
    console.log('   2. Update storage security rules if needed');
    console.log('   3. Test file uploads through your application');
    console.log(`   4. Monitor usage at: https://console.firebase.google.com/project/${admin.app().options.projectId}/storage`);
    
  } catch (error) {
    console.error('❌ Error setting up storage:', error);
    process.exit(1);
  }
}

async function setupStorageRules() {
  try {
    console.log('📋 Storage security rules should be configured in Firebase Console');
    console.log('   Recommended rules structure:');
    console.log(`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to their own folders
    match /profiles/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /resumes/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /video-intros/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Company logos - readable by all, writable by company admins
    match /company-logos/{companyId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/(default)/documents/companies/$(companyId)) &&
        get(/databases/(default)/documents/companies/$(companyId)).data.adminIds[request.auth.uid] == true;
    }
    
    // Public read access for certain folders
    match /avatars/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Admin-only access for system files
    match /backups/{allPaths=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/(default)/documents/users/$(request.auth.uid)) &&
        get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }
    
    // Support attachments
    match /support-attachments/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Temporary uploads (with size limits)
    match /temp/{allPaths=**} {
      allow write: if request.auth != null && 
        resource.size < 50 * 1024 * 1024; // 50MB limit
      allow read: if request.auth != null;
    }
    
    // Default: deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
    `);
    
  } catch (error) {
    console.error('❌ Error setting up storage rules:', error.message);
  }
}

// Run the setup
if (require.main === module) {
  createStorageFolders()
    .then(() => {
      console.log('\n🎉 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createStorageFolders };