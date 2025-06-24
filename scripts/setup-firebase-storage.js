const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Check if we're in production and have a service account key
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'ai-talent-stream.firebasestorage.app'
    });
  } else {
    // For development, use the service account key file if it exists
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    try {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || serviceAccount.project_id + '.appspot.com'
      });
    } catch (error) {
      console.error('❌ Error: Could not find Firebase service account credentials');
      console.log('📝 Please ensure you have either:');
      console.log('   1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable (production)');
      console.log('   2. Place serviceAccountKey.json in the project root (development)');
      console.log('   3. Downloaded service account key from Firebase Console > Project Settings > Service Accounts');
      process.exit(1);
    }
  }
}

const storage = admin.storage();
const bucket = storage.bucket();

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
  console.log(`📁 Storage bucket: ${bucket.name}`);
  
  try {
    const createdFolders = [];
    
    for (const folder of folders) {
      try {
        // Create a placeholder file in each folder to ensure the folder exists
        // Firebase Storage doesn't have "folders" per se, but rather file paths
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
                createdBy: 'setup-script',
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