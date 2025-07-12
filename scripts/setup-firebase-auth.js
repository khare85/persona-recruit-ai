#!/usr/bin/env node

/**
 * Setup script for Firebase Authentication
 * This script helps configure Firebase for both demo and production environments
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupFirebaseAuth() {
  console.log('\n🔥 Firebase Authentication Setup\n');
  
  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  let existingEnv = '';
  
  if (fs.existsSync(envPath)) {
    existingEnv = fs.readFileSync(envPath, 'utf8');
    console.log('📁 Found existing .env.local file');
  }
  
  // Determine environment
  const environment = await question('Which environment are you setting up? (demo/production) [production]: ');
  const isDemo = environment.toLowerCase() === 'demo';
  
  console.log(`\n⚙️  Setting up ${isDemo ? 'DEMO' : 'PRODUCTION'} environment\n`);
  
  let envContent = existingEnv;
  
  if (isDemo) {
    // Demo environment configuration
    const demoConfig = `
# Firebase Configuration - Demo Environment
NEXT_PUBLIC_ENVIRONMENT=demo
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyCCYi7cPMfy6GMG0YyehNxZSA3xj03h8kw"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="ai-talent-stream-demo.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="ai-talent-stream-demo"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="ai-talent-stream-demo.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="828945455612"
NEXT_PUBLIC_FIREBASE_APP_ID="1:828945455612:web:3148643d1cef1635e2ba79"

# Server-side configuration
FIREBASE_PROJECT_ID="ai-talent-stream-demo"
GOOGLE_CLOUD_PROJECT="ai-talent-stream-demo"

# Demo Feature Flags
NEXT_PUBLIC_DEMO_MODE_ENABLED=true
NEXT_PUBLIC_SHOW_DEMO_BANNER=true
NEXT_PUBLIC_ENABLE_SAMPLE_DATA=true
`;
    
    envContent = demoConfig;
    console.log('✅ Demo environment configuration prepared');
    
  } else {
    // Production environment configuration
    const prodConfig = `
# Firebase Configuration - Production Environment
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDBJabwAuKxGnM0zFIh0A1ROEC8tTpQ2c8"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="ai-talent-stream.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="ai-talent-stream"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="ai-talent-stream.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="541879201595"
NEXT_PUBLIC_FIREBASE_APP_ID="1:541879201595:web:110bb13a8daec937de911e"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-QL7NT2DTQS"

# Server-side configuration
FIREBASE_PROJECT_ID="ai-talent-stream"
GOOGLE_CLOUD_PROJECT="ai-talent-stream"

# Production App Configuration
NEXT_PUBLIC_APP_URL="https://ai-talent-stream--ai-talent-stream.us-central1.hosted.app"
CORS_ORIGIN="https://ai-talent-stream--ai-talent-stream.us-central1.hosted.app"
`;
    
    envContent = prodConfig;
    console.log('✅ Production environment configuration prepared');
  }
  
  // Add common configuration
  const commonConfig = `
# Genkit AI Configuration
GOOGLE_API_KEY="AIzaSyDBJabwAuKxGnM0zFIh0A1ROEC8tTpQ2c8"
GEMINI_API_KEY="AIzaSyB0YDosIJ09xwQMux-79ZLoddQm0NU7AGU"

# Node.js Options
NODE_OPTIONS="--max-old-space-size=4096"
`;
  
  envContent += commonConfig;
  
  // Write .env.local file
  fs.writeFileSync(envPath, envContent.trim());
  console.log('\n✅ Created/Updated .env.local file');
  
  // Service Account Instructions
  console.log('\n📋 Next Steps for Firebase Admin SDK:');
  console.log('\n1. For server-side authentication, you need a service account key:');
  console.log('   - Go to Firebase Console > Project Settings > Service Accounts');
  console.log('   - Click "Generate new private key"');
  console.log('   - Save the JSON file securely');
  
  if (isDemo) {
    console.log('\n2. For the demo environment:');
    console.log('   - Use the demo project service account');
    console.log('   - Store credentials in Google Secret Manager (recommended)');
    console.log('   - Or set GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable');
  } else {
    console.log('\n2. For production:');
    console.log('   - Store credentials in Google Secret Manager');
    console.log('   - Never commit service account keys to git');
    console.log('   - Use Application Default Credentials in GCP environments');
  }
  
  console.log('\n3. Restart your development server:');
  console.log('   npm run dev');
  
  console.log('\n✅ Firebase Authentication setup complete!');
  
  rl.close();
}

setupFirebaseAuth().catch(console.error);