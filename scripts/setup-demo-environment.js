#!/usr/bin/env node

/**
 * Setup Demo Environment
 * This script helps set up the demo Firebase environment with proper configuration
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const DEMO_PROJECT_ID = 'ai-talent-stream-demo';
const PROD_PROJECT_ID = 'ai-talent-stream';

async function setupDemoEnvironment() {
  console.log('🎭 Setting up Demo Environment...\n');

  try {
    // Check if running in the correct project
    const currentProject = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
    if (currentProject !== DEMO_PROJECT_ID) {
      console.log(`⚠️  Warning: Current project is ${currentProject}, but we're setting up ${DEMO_PROJECT_ID}`);
      console.log('   Make sure to run: gcloud config set project ai-talent-stream-demo\n');
    }

    // Initialize Secret Manager client
    const secretManager = new SecretManagerServiceClient();
    const projectPath = `projects/${DEMO_PROJECT_ID}`;

    // 1. Check for required secrets
    console.log('📋 Checking required secrets...');
    const requiredSecrets = [
      'firebase-service-account-demo',
      'firebase-config-demo',
      'GEMINI_API_KEY' // Can be shared across environments
    ];

    for (const secretName of requiredSecrets) {
      try {
        const [secret] = await secretManager.getSecret({
          name: `${projectPath}/secrets/${secretName}`,
        });
        console.log(`✅ Secret '${secretName}' exists`);
      } catch (error) {
        console.log(`❌ Secret '${secretName}' not found`);
        console.log(`   Create it with: gcloud secrets create ${secretName} --data-file=<file>`);
      }
    }

    // 2. Create demo-specific configuration
    console.log('\n📝 Creating demo configuration...');
    
    const demoConfig = {
      environment: 'demo',
      features: {
        demoMode: true,
        showDemoBanner: true,
        enableSampleData: true,
        maxDemoUsers: 100,
        autoResetHours: 24
      },
      authentication: {
        providers: ['email', 'google'],
        allowSignUp: true,
        requireEmailVerification: false,
        sessionLength: 86400 // 24 hours
      },
      storage: {
        maxUploadSize: 10485760, // 10MB
        allowedFileTypes: ['image/*', 'application/pdf', 'video/mp4']
      },
      firestore: {
        enableOffline: true,
        cacheSizeBytes: 41943040 // 40MB
      },
      demoAccounts: [
        {
          email: 'admin@demo.ai-talent-stream.com',
          password: 'DemoAdmin123!',
          role: 'super_admin',
          displayName: 'Demo Admin'
        },
        {
          email: 'recruiter@demo.ai-talent-stream.com',
          password: 'DemoRecruiter123!',
          role: 'recruiter',
          displayName: 'Demo Recruiter'
        },
        {
          email: 'candidate@demo.ai-talent-stream.com',
          password: 'DemoCandidate123!',
          role: 'candidate',
          displayName: 'Demo Candidate'
        },
        {
          email: 'interviewer@demo.ai-talent-stream.com',
          password: 'DemoInterviewer123!',
          role: 'interviewer',
          displayName: 'Demo Interviewer'
        },
        {
          email: 'company@demo.ai-talent-stream.com',
          password: 'DemoCompany123!',
          role: 'company_admin',
          displayName: 'Demo Company Admin'
        }
      ]
    };

    // 3. Save configuration to Secret Manager
    console.log('\n🔐 Saving demo configuration to Secret Manager...');
    
    const configSecretName = `${projectPath}/secrets/demo-environment-config`;
    
    try {
      // Try to create the secret
      await secretManager.createSecret({
        parent: projectPath,
        secretId: 'demo-environment-config',
        secret: {
          replication: {
            automatic: {},
          },
        },
      });
      console.log('✅ Created new secret: demo-environment-config');
    } catch (error) {
      if (error.code === 6) { // ALREADY_EXISTS
        console.log('ℹ️  Secret demo-environment-config already exists');
      } else {
        throw error;
      }
    }

    // Add secret version
    await secretManager.addSecretVersion({
      parent: configSecretName,
      payload: {
        data: Buffer.from(JSON.stringify(demoConfig, null, 2)),
      },
    });
    console.log('✅ Updated demo configuration');

    // 4. Create .env.demo.local with actual values
    console.log('\n📄 Creating .env.demo.local file...');
    
    const envContent = `# Demo Environment Configuration (Local Development)
# Generated on ${new Date().toISOString()}
# 
# TO USE: Copy this file to .env.local when developing with demo environment
#
# WARNING: This file contains sensitive data. Do not commit to version control!

# Firebase Configuration (Demo Project)
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_ACTUAL_DEMO_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${DEMO_PROJECT_ID}.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${DEMO_PROJECT_ID}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${DEMO_PROJECT_ID}.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_ACTUAL_DEMO_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_ACTUAL_DEMO_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_ACTUAL_DEMO_MEASUREMENT_ID

# Environment Identifier
NEXT_PUBLIC_ENVIRONMENT=demo
NEXT_PUBLIC_APP_URL=https://${DEMO_PROJECT_ID}--${DEMO_PROJECT_ID}.us-central1.hosted.app

# Feature Flags for Demo
NEXT_PUBLIC_DEMO_MODE_ENABLED=true
NEXT_PUBLIC_SHOW_DEMO_BANNER=true
NEXT_PUBLIC_ENABLE_SAMPLE_DATA=true

# Demo-specific settings
NEXT_PUBLIC_MAX_DEMO_USERS=100
NEXT_PUBLIC_DEMO_DATA_RESET_HOURS=24

# Secret Manager Configuration
FIREBASE_PROJECT_ID=${DEMO_PROJECT_ID}
FIREBASE_SERVICE_ACCOUNT_SECRET=firebase-service-account-demo
FIREBASE_CONFIG_SECRET=firebase-config-demo
`;

    await fs.writeFile(path.join(process.cwd(), '.env.demo.local'), envContent);
    console.log('✅ Created .env.demo.local (remember to fill in actual values!)');

    // 5. Instructions
    console.log('\n📋 Next Steps:');
    console.log('1. Update .env.demo.local with actual Firebase configuration values');
    console.log('2. Create any missing secrets in Secret Manager');
    console.log('3. Deploy Firestore rules and indexes: firebase deploy --only firestore');
    console.log('4. Deploy Storage rules: firebase deploy --only storage');
    console.log('5. Run demo data seeding script: npm run seed:demo');
    console.log('6. Deploy to demo environment: npm run deploy:demo');
    
    console.log('\n🎭 Demo accounts will be created:');
    demoConfig.demoAccounts.forEach(account => {
      console.log(`   ${account.role}: ${account.email} / ${account.password}`);
    });

    console.log('\n✅ Demo environment setup complete!');

  } catch (error) {
    console.error('\n❌ Error setting up demo environment:', error);
    process.exit(1);
  }
}

// Run the setup
setupDemoEnvironment();