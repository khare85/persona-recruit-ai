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

// Check for JWT_SECRET
const hasJwtSecret = envLines.some(line => 
  line.trim().startsWith('JWT_SECRET=') && 
  !line.includes('your_jwt_secret') &&
  !line.includes('your-super-secure') &&
  line.split('=')[1]?.replace(/['"]/g, '').trim().length >= 32
);

if (!hasJwtSecret) {
  console.log('⚠️  JWT_SECRET is missing or insecure!');
  console.log('Generating a secure JWT_SECRET...');
  
  const newSecret = crypto.randomBytes(32).toString('base64');
  const updatedContent = envContent + '\n# JWT Secret for authentication\nJWT_SECRET="' + newSecret + '"\n';
  
  fs.writeFileSync(envPath, updatedContent);
  console.log('✅ JWT_SECRET has been added to .env.local');
} else {
  console.log('✅ JWT_SECRET is properly configured');
}

// Check other required variables
const requiredVars = [
  'GOOGLE_API_KEY',
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

if (missingVars.length > 0) {
  console.log('\n⚠️  Missing environment variables:');
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\nPlease add these to your .env.local file');
} else {
  console.log('✅ All required environment variables are set');
}

console.log('\n✨ Environment check complete!');