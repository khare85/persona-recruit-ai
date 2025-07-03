#!/usr/bin/env node

/**
 * Comprehensive Integration Test Script
 * Tests Firebase Auth, Firestore, Storage, and API connectivity
 */

const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const PROJECT_ID = 'ai-talent-stream';
const secretClient = new SecretManagerServiceClient();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testSecretManager() {
  log('\n🔐 Testing Secret Manager Integration...', 'cyan');
  
  try {
    // Test accessing Firebase config secret
    const name = `projects/${PROJECT_ID}/secrets/firebase-config/versions/latest`;
    const [version] = await secretClient.accessSecretVersion({ name });
    const secretValue = version.payload.data.toString('utf8');
    const config = JSON.parse(secretValue);
    
    if (config.projectId === PROJECT_ID) {
      logSuccess('Secret Manager access successful');
      logSuccess(`Firebase config retrieved for project: ${config.projectId}`);
      return true;
    } else {
      logError(`Project ID mismatch: expected ${PROJECT_ID}, got ${config.projectId}`);
      return false;
    }
  } catch (error) {
    logError(`Secret Manager test failed: ${error.message}`);
    return false;
  }
}

async function initializeFirebase() {
  log('\n🔥 Initializing Firebase Admin SDK...', 'cyan');
  
  try {
    if (admin.apps.length === 0) {
      // Try to get service account from Secret Manager
      const name = `projects/${PROJECT_ID}/secrets/GOOGLE_APPLICATION_CREDENTIALS_JSON/versions/latest`;
      const [version] = await secretClient.accessSecretVersion({ name });
      const serviceAccountJson = JSON.parse(version.payload.data.toString('utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
        projectId: PROJECT_ID,
        storageBucket: `${PROJECT_ID}.firebasestorage.app`
      });
      
      logSuccess('Firebase Admin SDK initialized successfully');
      return true;
    } else {
      logInfo('Firebase Admin SDK already initialized');
      return true;
    }
  } catch (error) {
    logError(`Firebase initialization failed: ${error.message}`);
    return false;
  }
}

async function testFirestore() {
  log('\n🗄️  Testing Firestore Connectivity...', 'cyan');
  
  try {
    const db = admin.firestore();
    
    // Test write operation
    const testDoc = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      testData: 'Integration test',
      projectId: PROJECT_ID
    };
    
    const docRef = await db.collection('_health_test').add(testDoc);
    logSuccess('Firestore write operation successful');
    
    // Test read operation
    const snapshot = await docRef.get();
    if (snapshot.exists) {
      logSuccess('Firestore read operation successful');
      
      // Clean up test document
      await docRef.delete();
      logSuccess('Test document cleaned up');
      return true;
    } else {
      logError('Test document not found after write');
      return false;
    }
  } catch (error) {
    logError(`Firestore test failed: ${error.message}`);
    return false;
  }
}

async function testStorage() {
  log('\n📁 Testing Firebase Storage...', 'cyan');
  
  try {
    const bucket = admin.storage().bucket();
    
    // Test bucket access
    const [exists] = await bucket.exists();
    if (exists) {
      logSuccess('Storage bucket access successful');
      
      // Test file upload
      const testFileName = `test-files/integration-test-${Date.now()}.txt`;
      const file = bucket.file(testFileName);
      
      await file.save('Integration test content', {
        metadata: {
          contentType: 'text/plain',
          metadata: {
            testFile: 'true',
            timestamp: new Date().toISOString()
          }
        }
      });
      
      logSuccess('Storage file upload successful');
      
      // Test file download
      const [content] = await file.download();
      if (content.toString() === 'Integration test content') {
        logSuccess('Storage file download successful');
        
        // Clean up test file
        await file.delete();
        logSuccess('Test file cleaned up');
        return true;
      } else {
        logError('Downloaded content does not match uploaded content');
        return false;
      }
    } else {
      logError('Storage bucket does not exist or is not accessible');
      return false;
    }
  } catch (error) {
    logError(`Storage test failed: ${error.message}`);
    return false;
  }
}

async function testAuthentication() {
  log('\n🔐 Testing Authentication System...', 'cyan');
  
  try {
    // Test user creation (without actually creating a user)
    const testEmail = `test-${Date.now()}@example.com`;
    
    try {
      // Check if we can access the Auth service
      const auth = admin.auth();
      
      // Test getting user by email (should fail for non-existent user)
      try {
        await auth.getUserByEmail(testEmail);
        logWarning('Unexpected: Test user already exists');
      } catch (userError) {
        if (userError.code === 'auth/user-not-found') {
          logSuccess('Authentication service is responding correctly');
          return true;
        } else {
          logError(`Unexpected auth error: ${userError.message}`);
          return false;
        }
      }
    } catch (error) {
      logError(`Authentication test failed: ${error.message}`);
      return false;
    }
  } catch (error) {
    logError(`Authentication setup failed: ${error.message}`);
    return false;
  }
}

async function testEnvironmentVariables() {
  log('\n🌍 Testing Environment Variables...', 'cyan');
  
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} is set`);
    } else {
      logError(`${varName} is missing`);
      allPresent = false;
    }
  }
  
  // Check if project ID matches
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === PROJECT_ID) {
    logSuccess(`Project ID correctly set to ${PROJECT_ID}`);
  } else {
    logError(`Project ID mismatch: expected ${PROJECT_ID}, got ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
    allPresent = false;
  }
  
  return allPresent;
}

async function runTests() {
  log('🚀 Starting Comprehensive Integration Tests...', 'bright');
  log(`Project: ${PROJECT_ID}`, 'cyan');
  
  const results = {
    secretManager: false,
    firebase: false,
    firestore: false,
    storage: false,
    auth: false,
    environment: false
  };
  
  // Test environment variables first
  results.environment = await testEnvironmentVariables();
  
  // Test Secret Manager
  results.secretManager = await testSecretManager();
  
  // Initialize Firebase
  results.firebase = await initializeFirebase();
  
  if (results.firebase) {
    // Test Firestore
    results.firestore = await testFirestore();
    
    // Test Storage
    results.storage = await testStorage();
    
    // Test Authentication
    results.auth = await testAuthentication();
  }
  
  // Summary
  log('\n📊 Test Results Summary:', 'bright');
  log('========================', 'cyan');
  
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      logSuccess(`${test.toUpperCase()}: PASSED`);
    } else {
      logError(`${test.toUpperCase()}: FAILED`);
    }
  });
  
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  log(`\n${passedCount}/${totalCount} tests passed`, passedCount === totalCount ? 'green' : 'yellow');
  
  if (passedCount === totalCount) {
    log('\n🎉 All systems are operational!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some systems need attention', 'yellow');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  logError(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  logError(`Test runner failed: ${error.message}`);
  process.exit(1);
});