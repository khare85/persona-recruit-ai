const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'ai-talent-stream.firebasestorage.app'
    });
  } else {
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
      process.exit(1);
    }
  }
}

const storage = admin.storage();
const bucket = storage.bucket();

async function checkStorageStructure() {
  console.log('🔍 Checking Firebase Storage structure...');
  console.log(`📁 Storage bucket: ${bucket.name}`);
  
  try {
    // Get all files in the bucket
    const [files] = await bucket.getFiles();
    
    if (files.length === 0) {
      console.log('📂 Storage bucket is empty');
      console.log('\n💡 To set up the folder structure, run:');
      console.log('   npm run setup:storage');
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