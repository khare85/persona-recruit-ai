# Multi-Environment Firebase Setup Guide

This guide explains how to set up and manage separate Firebase environments for production and demo/sales purposes.

## Overview

The application supports multiple Firebase environments:
- **Production** (`ai-talent-stream`) - Live production data
- **Demo** (`ai-talent-stream-demo`) - Sales demo with sample data
- **Development** (`ai-talent-stream-dev`) - Optional development environment

## Benefits

1. **Complete Isolation**: Demo and production data never mix
2. **Safe Experimentation**: Sales team can freely create/modify/delete data
3. **Realistic Demos**: Full Firebase functionality, not just mock data
4. **Cost Effective**: Separate billing and resource usage
5. **Easy Management**: Same codebase, different configurations

## Setup Instructions

### 1. Create Demo Firebase Project

```bash
# Create new Firebase project
firebase projects:create ai-talent-stream-demo --display-name "AI Talent Stream Demo"

# List your projects to verify
firebase projects:list
```

### 2. Configure Demo Project Services

```bash
# Switch to demo project
firebase use demo

# Initialize services
firebase init firestore
firebase init storage
firebase init auth

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

### 3. Set Up Secret Manager for Demo

Create secrets in the demo project's Secret Manager:

```bash
# Switch to demo project
gcloud config set project ai-talent-stream-demo

# Create Firebase service account secret
echo '{
  "type": "service_account",
  "project_id": "ai-talent-stream-demo",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxx@ai-talent-stream-demo.iam.gserviceaccount.com",
  ...
}' | gcloud secrets create firebase-service-account-demo --data-file=-

# Create Firebase config secret
gcloud secrets create firebase-config-demo --data-file=- <<EOF
{
  "apiKey": "YOUR_DEMO_API_KEY",
  "authDomain": "ai-talent-stream-demo.firebaseapp.com",
  "projectId": "ai-talent-stream-demo",
  "storageBucket": "ai-talent-stream-demo.appspot.com",
  "messagingSenderId": "YOUR_DEMO_SENDER_ID",
  "appId": "YOUR_DEMO_APP_ID",
  "measurementId": "YOUR_DEMO_MEASUREMENT_ID"
}
EOF

# Grant access to App Engine/Cloud Run service account
gcloud secrets add-iam-policy-binding firebase-service-account-demo \
  --member="serviceAccount:ai-talent-stream-demo@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding firebase-config-demo \
  --member="serviceAccount:ai-talent-stream-demo@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4. Environment Configuration Files

The project includes these environment configuration files:

#### `.env.demo` (Local Demo Development)
```bash
# Copy this to .env.local when developing with demo environment
cp .env.demo .env.local
```

#### `.env.production.demo` (Demo Deployment)
Used when deploying to the demo Firebase App Hosting environment.

### 5. Update apphosting.yaml for Demo

Create a separate App Hosting configuration for demo:

```yaml
# apphosting.demo.yaml
env:
  - variable: NEXT_PUBLIC_ENVIRONMENT
    value: demo
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: ai-talent-stream-demo
  - variable: FIREBASE_PROJECT_ID
    value: ai-talent-stream-demo
  - variable: FIREBASE_SERVICE_ACCOUNT_SECRET
    secret: firebase-service-account-demo
  - variable: FIREBASE_CONFIG_SECRET
    secret: firebase-config-demo
```

### 6. Deployment Scripts

#### Deploy to Demo Environment
```bash
# Make script executable
chmod +x scripts/deploy-demo.sh

# Deploy to demo
./scripts/deploy-demo.sh
```

#### Deploy to Production
```bash
# Use existing deployment
firebase use production
npm run deploy:apphosting
```

### 7. Database Seeding

Create demo data for the sales team:

```bash
# Create seed script (scripts/seed-demo-data.js)
npm run seed:demo
```

## Managing Environments

### Switching Between Environments

#### Local Development
```bash
# For production development
cp .env.production .env.local

# For demo development
cp .env.demo .env.local

# Restart dev server
npm run dev
```

#### Firebase CLI
```bash
# List available projects
firebase projects:list

# Switch to demo
firebase use demo

# Switch to production
firebase use production

# Check current project
firebase use
```

### Environment-Specific Features

The application can detect which environment it's running in:

```typescript
import { environment, isDemoEnvironment } from '@/config/firebase';

// In your components
if (isDemoEnvironment) {
  // Show demo-specific features
}
```

### Demo Environment Banner

When `NEXT_PUBLIC_SHOW_DEMO_BANNER=true`, a banner appears at the top of the demo site to indicate it's a demo environment.

## Best Practices

### 1. Data Management
- **Demo Reset**: Set up a Cloud Function to reset demo data periodically
- **Sample Data**: Create realistic sample data for all user roles
- **Data Limits**: Implement limits to prevent excessive data creation

### 2. Access Control
- **Separate Auth**: Use different authentication providers or domains
- **Demo Accounts**: Create pre-configured demo accounts for each role
- **Access Logs**: Monitor who accesses the demo environment

### 3. Cost Management
- **Budgets**: Set up budget alerts for the demo project
- **Quotas**: Implement API quotas to prevent abuse
- **Monitoring**: Track usage patterns and costs

### 4. Security
- **Separate Secrets**: Never share secrets between environments
- **API Keys**: Use different API keys for external services
- **Rules**: Apply the same security rules to both environments

## Monitoring and Maintenance

### Check Environment Status
```bash
# Production
firebase use production
firebase apps:list

# Demo
firebase use demo
firebase apps:list
```

### View Logs
```bash
# Production logs
gcloud app logs tail --project=ai-talent-stream

# Demo logs
gcloud app logs tail --project=ai-talent-stream-demo
```

### Database Backups
```bash
# Export demo data
gcloud firestore export gs://ai-talent-stream-demo-backups/$(date +%Y%m%d)

# Import to refresh demo
gcloud firestore import gs://ai-talent-stream-demo-backups/20240715
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Check `.env.local` exists and has correct values
   - Restart the development server
   - Clear Next.js cache: `rm -rf .next`

2. **Wrong Firebase Project**
   - Run `firebase use` to check current project
   - Verify `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches

3. **Secret Manager Access Denied**
   - Ensure service account has `secretmanager.secretAccessor` role
   - Check secret exists: `gcloud secrets list`

4. **Demo Data Missing**
   - Run seed script: `npm run seed:demo`
   - Check Firestore rules allow writes

## URLs and Endpoints

### Production
- App: https://ai-talent-stream--ai-talent-stream.us-central1.hosted.app
- Firebase Console: https://console.firebase.google.com/project/ai-talent-stream

### Demo
- App: https://ai-talent-stream-demo--ai-talent-stream-demo.us-central1.hosted.app
- Firebase Console: https://console.firebase.google.com/project/ai-talent-stream-demo

## Next Steps

1. **Create Demo Project**: Follow steps 1-3 above
2. **Configure Secrets**: Set up Secret Manager for demo
3. **Deploy Demo**: Use the deployment script
4. **Create Demo Data**: Seed with sample data
5. **Train Sales Team**: Show them how to use the demo environment

## Support

For issues or questions:
1. Check Firebase Console for errors
2. Review Cloud Build logs
3. Verify environment variables
4. Check Secret Manager permissions