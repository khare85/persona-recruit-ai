#!/bin/bash

# Database and Storage Deployment Script for AI Talent Recruitment Platform
# This script deploys all Firestore indexes, security rules, and storage configuration

set -e

echo "🚀 Starting database and storage deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run 'firebase login' first."
    exit 1
fi

# Get current project
PROJECT=$(firebase use --json | jq -r '.result.current // empty')
if [ -z "$PROJECT" ]; then
    echo "❌ No Firebase project selected. Please run 'firebase use <project-id>' first."
    exit 1
fi

echo "📂 Current Firebase project: $PROJECT"

# Confirm deployment
read -p "🔄 Deploy database indexes and security rules to '$PROJECT'? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

echo "📋 Validating configuration files..."

# Check if required files exist
REQUIRED_FILES=("firestore.indexes.json" "firestore.rules" "storage.rules")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
    echo "✅ Found: $file"
done

echo "🔍 Validating Firestore rules..."
if ! firebase firestore:rules:validate firestore.rules; then
    echo "❌ Firestore rules validation failed"
    exit 1
fi

echo "🔍 Validating Storage rules..."
if ! firebase storage:rules:validate storage.rules; then
    echo "❌ Storage rules validation failed"
    exit 1
fi

echo "📊 Deploying Firestore indexes (including vector indexes)..."
firebase deploy --only firestore:indexes --project "$PROJECT"

echo "🔒 Deploying Firestore security rules..."
firebase deploy --only firestore:rules --project "$PROJECT"

echo "📁 Deploying Storage security rules..."
firebase deploy --only storage --project "$PROJECT"

echo "🔧 Verifying deployment..."

# Check if indexes are being built
echo "📈 Checking index status..."
firebase firestore:indexes --project "$PROJECT"

echo "✅ Database and storage deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Monitor index build progress in Firebase Console. This can take 10-30 minutes."
echo "   2. Test application functionality that requires database access."
echo "   3. Monitor performance and security rule effectiveness."
echo ""
echo "🔗 Useful links:"
echo "   - Firestore Console: https://console.firebase.google.com/project/$PROJECT/firestore"
echo "   - Storage Console: https://console.firebase.google.com/project/$PROJECT/storage"
echo "   - Performance Monitoring: https://console.firebase.google.com/project/$PROJECT/performance"
