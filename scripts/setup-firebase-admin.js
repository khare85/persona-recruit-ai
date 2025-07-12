#!/usr/bin/env node

/**
 * Setup Firebase Admin SDK for local development
 * This script helps configure service account credentials
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🔥 Firebase Admin SDK Setup\n');

// Check if running in Google Cloud environment
const isGoogleCloud = process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT;

if (isGoogleCloud) {
  console.log('✅ Running in Google Cloud environment');
  console.log('   Application Default Credentials will be used automatically');
  process.exit(0);
}

console.log('📋 Local Development Setup Instructions:\n');

console.log('Option 1: Use gcloud CLI (Recommended for local development)');
console.log('─────────────────────────────────────────────────────────');
console.log('1. Install Google Cloud SDK if not already installed:');
console.log('   https://cloud.google.com/sdk/docs/install\n');
console.log('2. Authenticate with your Google account:');
console.log('   gcloud auth application-default login\n');
console.log('3. Set the default project:');
console.log('   gcloud config set project ai-talent-stream\n');

console.log('\nOption 2: Use Service Account Key (For CI/CD or specific needs)');
console.log('──────────────────────────────────────────────────────────────');
console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
console.log('2. Click "Generate new private key"');
console.log('3. Save the JSON file as "service-account-key.json" in project root');
console.log('4. Add to .env.local:');
console.log('   GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"\n');
console.log('⚠️  IMPORTANT: Never commit service account keys to git!');
console.log('   Add "service-account-key.json" to .gitignore\n');

// Check current authentication status
console.log('\n🔍 Checking current authentication status...\n');

try {
  const authList = execSync('gcloud auth application-default print-access-token 2>&1', { encoding: 'utf8' });
  if (authList) {
    console.log('✅ Application Default Credentials are configured');
    
    // Check project
    const currentProject = execSync('gcloud config get-value project 2>/dev/null', { encoding: 'utf8' }).trim();
    if (currentProject) {
      console.log(`📦 Current project: ${currentProject}`);
      
      if (currentProject !== 'ai-talent-stream' && currentProject !== 'ai-talent-stream-demo') {
        console.log('\n⚠️  Warning: Current project is not ai-talent-stream');
        console.log('   Run: gcloud config set project ai-talent-stream');
      }
    }
  }
} catch (error) {
  console.log('❌ Application Default Credentials not configured');
  console.log('   Run: gcloud auth application-default login');
}

// Check for existing service account key
const serviceAccountPath = path.join(process.cwd(), 'service-account-key.json');
if (fs.existsSync(serviceAccountPath)) {
  console.log('\n⚠️  Found service-account-key.json in project root');
  console.log('   Make sure it\'s added to .gitignore!');
  
  // Check .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignore.includes('service-account-key.json')) {
      console.log('\n❗ Adding service-account-key.json to .gitignore...');
      fs.appendFileSync(gitignorePath, '\n# Service account keys\nservice-account-key.json\n');
    }
  }
}

console.log('\n✅ Setup check complete!');
console.log('\nFor production deployment:');
console.log('- Firebase App Hosting uses Application Default Credentials automatically');
console.log('- No additional configuration needed for deployed apps');

process.exit(0);