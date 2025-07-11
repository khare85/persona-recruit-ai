#!/bin/bash

# Deploy to Demo Environment
# This script deploys the application to the demo Firebase project

set -e

echo "🎭 Deploying to Demo Environment..."

# Check if demo environment file exists
if [ ! -f ".env.demo" ]; then
    echo "❌ Error: .env.demo file not found!"
    echo "Please create .env.demo with your demo Firebase configuration"
    exit 1
fi

# Load demo environment variables
export $(cat .env.demo | grep -v '^#' | xargs)

# Switch to demo Firebase project
echo "📦 Switching to demo Firebase project..."
firebase use demo

# Build the application with demo environment
echo "🔨 Building application for demo environment..."
NODE_ENV=production npm run build:production

# Deploy Firestore rules and indexes
echo "📋 Deploying Firestore rules and indexes..."
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Storage rules
echo "📁 Deploying Storage rules..."
firebase deploy --only storage:rules

# Deploy to Firebase App Hosting
echo "🚀 Deploying to Firebase App Hosting..."
firebase deploy --only apphosting

# Create demo data if needed
echo "🌱 Setting up demo data..."
npm run setup:demo-data || echo "Demo data setup skipped"

echo "✅ Demo deployment complete!"
echo "🔗 Demo URL: https://ai-talent-stream-demo--ai-talent-stream-demo.us-central1.hosted.app"
echo ""
echo "📝 Next steps:"
echo "1. Share the demo URL with your sales team"
echo "2. Create demo user accounts for different roles"
echo "3. Test all features to ensure they work correctly"