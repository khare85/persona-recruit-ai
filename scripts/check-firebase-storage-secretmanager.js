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

async function checkStorageStructure() {
  console.log('🔍 Checking Firebase Storage structure...');
  
  try {
    // Initialize Firebase with Secret Manager
    const bucket = await initializeFirebaseWithSecretManager();
    console.log(`📁 Storage bucket: ${bucket.name}`);
    
    // Get all files in the bucket
    const [files] = await bucket.getFiles();
    
    if (files.length === 0) {
      console.log('📂 Storage bucket is empty');
      console.log('\n💡 To set up the folder structure, run:');
      console.log('   npm run setup:storage:secretmanager');
      return;
    }
    
    console.log(`📊 Total files: ${files.length}`);
    
    // Organize files by folder
    const folders = {};
    files.forEach(file => {
      const parts = file.name.split('/');
      if (parts.length > 1) {
        const folder = parts[0] + '/';
        if (!folders[folder]) {
          folders[folder] = [];
        }
        folders[folder].push(file.name);
      } else {
        if (!folders['root']) {
          folders['root'] = [];
        }
        folders['root'].push(file.name);
      }
    });
    
    // Display folder structure
    console.log('\n📁 Folder structure:');
    Object.keys(folders).sort().forEach(folder => {
      const fileCount = folders[folder].length;
      console.log(`   ${folder} (${fileCount} files)`);
      
      // Show first few files as examples
      if (fileCount <= 3) {
        folders[folder].forEach(fileName => {
          console.log(`     • ${fileName}`);
        });
      } else {
        folders[folder].slice(0, 2).forEach(fileName => {
          console.log(`     • ${fileName}`);
        });
        console.log(`     ... and ${fileCount - 2} more files`);
      }
    });
    
    // Check for placeholder files
    const placeholderFiles = files.filter(file => file.name.endsWith('.keep'));
    if (placeholderFiles.length > 0) {
      console.log(`\n🏷️  Found ${placeholderFiles.length} placeholder files (.keep files)`);
      console.log('   These files maintain folder structure and can be deleted once you upload actual files');
    }
    
    // Storage usage
    let totalSize = 0;
    files.forEach(file => {
      if (file.metadata && file.metadata.size) {
        totalSize += parseInt(file.metadata.size);
      }
    });
    
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    const sizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(3);
    
    console.log(`\n💾 Storage usage: ${sizeMB} MB (${sizeGB} GB)`);
    
    console.log('\n🔗 Firebase Console Links:');
    console.log(`   Storage: https://console.firebase.google.com/project/${admin.app().options.projectId}/storage`);
    console.log(`   Rules: https://console.firebase.google.com/project/${admin.app().options.projectId}/storage/rules`);
    
  } catch (error) {
    console.error('❌ Error checking storage:', error.message);
    
    if (error.code === 'storage/bucket-not-found') {
      console.log('\n💡 The storage bucket does not exist or is not accessible.');
      console.log('   Check your Firebase project configuration and permissions.');
    }
    
    process.exit(1);
  }
}

// Run the check
if (require.main === module) {
  checkStorageStructure()
    .then(() => {
      console.log('\n✅ Storage check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkStorageStructure };