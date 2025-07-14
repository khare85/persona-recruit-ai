#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

console.log('🔍 Checking environment configuration...\n');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('Creating .env.local from .env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env.local created');
  } else {
    console.error('❌ .env.example not found either!');
    process.exit(1);
  }
}

// Read .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

// JWT_SECRET is no longer required - using Firebase Auth exclusively
console.log('ℹ️  JWT_SECRET is no longer required (using Firebase Auth)');

// Check other required variables
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_API_KEY'
];

const missingVars = [];
requiredVars.forEach(varName => {
  const hasVar = envLines.some(line => 
    line.trim().startsWith(varName + '=') && 
    line.split('=')[1]?.trim().length > 0
  );
  
  if (!hasVar) {
    missingVars.push(varName);
  }
});

// Custom check for Google API key
const hasGoogleApiKey = envLines.some(line => line.trim().startsWith('GOOGLE_API_KEY=') && line.split('=')[1]?.trim().length > 0);
const hasGeminiSecret = envLines.some(line => line.trim().startsWith('GEMINI_API_KEY_SECRET=') && line.split('=')[1]?.trim().length > 0);

if (!hasGoogleApiKey && !hasGeminiSecret) {
    missingVars.push('GOOGLE_API_KEY or GEMINI_API_KEY_SECRET');
}

if (missingVars.length > 0) {
  console.log('\n⚠️  Missing environment variables:');
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\nPlease add these to your .env.local file');
} else {
  console.log('✅ All required environment variables are set');
}

console.log('\n✨ Environment check complete!');
