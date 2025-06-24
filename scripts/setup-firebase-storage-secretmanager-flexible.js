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
        console.log('Secret content preview:', secretValue.substring(0, 100) + '...');
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
  const secretName = process.env.FIREBASE_SERVICE_ACCOUNT_SECRET || 'GOOGLE_APPLICATION_CREDENTIALS_JSON';
  
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
      console.log('\n🔧 Available secrets in your project:');
      
      try {
        const [secrets] = await secretClient.listSecrets({
          parent: `projects/${projectId}`
        });
        secrets.forEach(secret => {
          const secretName = secret.name.split('/').pop();
          console.log(`   • ${secretName}`);
        });
      } catch (listError) {
        console.log('   Could not list secrets:', listError.message);
      }
      
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