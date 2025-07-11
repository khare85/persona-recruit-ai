#!/bin/bash

# Setup Demo Secrets in Secret Manager
# Run this after enabling billing for ai-talent-stream-demo

set -e

echo "🔐 Setting up Secret Manager for Demo Environment..."

# Check if we're in the right project
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "ai-talent-stream-demo" ]; then
    echo "❌ Wrong project! Current: $CURRENT_PROJECT"
    echo "   Run: gcloud config set project ai-talent-stream-demo"
    exit 1
fi

# Enable Secret Manager API
echo "📦 Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
sleep 10

# Copy GOOGLE_API_KEY from production (if exists)
echo "🔑 Setting up Google API Key..."
if gcloud secrets describe GOOGLE_API_KEY --project=ai-talent-stream &>/dev/null; then
    echo "   Copying GOOGLE_API_KEY from production..."
    GOOGLE_API_KEY=$(gcloud secrets versions access latest --secret="GOOGLE_API_KEY" --project=ai-talent-stream)
    echo "$GOOGLE_API_KEY" | gcloud secrets create GOOGLE_API_KEY --data-file=-
else
    echo "   Creating placeholder GOOGLE_API_KEY (update with real value)..."
    echo "YOUR_GOOGLE_API_KEY_HERE" | gcloud secrets create GOOGLE_API_KEY --data-file=-
fi

# Create Firebase service account secret placeholder
echo "🔧 Creating Firebase service account secret..."
cat <<EOF | gcloud secrets create firebase-service-account --data-file=-
{
  "type": "service_account",
  "project_id": "ai-talent-stream-demo",
  "private_key_id": "UPDATE_THIS",
  "private_key": "-----BEGIN PRIVATE KEY-----\\nUPDATE_THIS\\n-----END PRIVATE KEY-----\\n",
  "client_email": "firebase-adminsdk-xxxxx@ai-talent-stream-demo.iam.gserviceaccount.com",
  "client_id": "UPDATE_THIS",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "UPDATE_THIS"
}
EOF

# Create demo configuration
echo "📋 Creating demo configuration..."
cat <<EOF | gcloud secrets create demo-config --data-file=-
{
  "environment": "demo",
  "projectId": "ai-talent-stream-demo",
  "features": {
    "demoMode": true,
    "showDemoBanner": true,
    "enableSampleData": true,
    "maxDemoUsers": 100,
    "autoResetHours": 24
  },
  "demoAccounts": [
    {
      "email": "admin@demo.ai-talent-stream.com",
      "password": "DemoAdmin123!",
      "role": "super_admin",
      "displayName": "Demo Admin"
    },
    {
      "email": "recruiter@demo.ai-talent-stream.com", 
      "password": "DemoRecruiter123!",
      "role": "recruiter",
      "displayName": "Demo Recruiter"
    },
    {
      "email": "candidate@demo.ai-talent-stream.com",
      "password": "DemoCandidate123!",
      "role": "candidate",
      "displayName": "Demo Candidate"
    }
  ]
}
EOF

echo "✅ Demo secrets created!"
echo ""
echo "📝 Next steps:"
echo "1. Update firebase-service-account secret with actual service account JSON"
echo "2. Get service account from: https://console.firebase.google.com/project/ai-talent-stream-demo/settings/serviceaccounts/adminsdk"
echo "3. Update GOOGLE_API_KEY if needed"
echo "4. Test the setup with: npm run setup:demo"
echo ""
echo "🔗 Secrets in demo project:"
gcloud secrets list