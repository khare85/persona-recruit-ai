# Project Overview: AI Talent Recruitment Platform

## Project Type
- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Custom auth with Firebase
- **AI**: Google Genkit with Gemini models
- **Deployment**: Firebase App Hosting (backend ID: `ai-talent-stream`)

## Key Project Structure
```
/home/user/studio/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin dashboard
│   │   ├── recruiter/      # Recruiter interface
│   │   ├── candidate/      # Candidate interface
│   │   ├── interviewer/    # Interviewer interface
│   │   └── company/        # Company management
│   ├── components/         # React components
│   ├── lib/               # Utility functions
│   ├── ai/                # AI/Genkit configurations
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── scripts/               # Deployment and setup scripts
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
├── storage.rules          # Storage security rules
├── apphosting.yaml        # Firebase App Hosting configuration
├── .gcloudignore          # Cloud deployment ignore file
├── .firebaseignore        # Firebase deployment ignore file
├── package-lock.json      # Dependency lock file (required for deployment)
└── package.json           # Dependencies and scripts
```

## Firebase Configuration
- **Project ID**: `ai-talent-stream`
- **Backend ID**: `ai-talent-stream`
- **Live URL**: https://ai-talent-stream--ai-talent-stream.us-central1.hosted.app
- **Services Used**:
  - Firestore (with rules and indexes)
  - Storage (with rules)
  - App Hosting (Next.js deployment)
  - Authentication
  - Secret Manager (for sensitive configs)
- **App Hosting Backend**: Configured with 2 CPU, 8GB RAM, auto-scaling 0-50 instances
- **Region**: us-central1

## Important Commands
```bash
# Development
npm run dev                    # Start dev server on port 9002
npm run genkit:dev            # Start Genkit development

# Building
npm run build                 # Build for production
npm run build:production      # Build with production env

# Linting & Type Checking
npm run lint                  # Run ESLint
npm run typecheck            # Run TypeScript type checking

# Deployment
firebase deploy --only apphosting     # Deploy to Firebase App Hosting
npm run deploy:db                     # Deploy Firestore rules and indexes

# Setup Scripts
npm run setup:storage         # Setup Firebase Storage
npm run check:storage         # Check Storage configuration
```

## User Roles
1. **Admin**: Full system access, user management, analytics
2. **Recruiter**: Job posting, candidate management, interview scheduling
3. **Candidate**: Profile creation, job applications, interview participation
4. **Interviewer**: Conduct interviews, provide feedback
5. **Company**: Company profile management, billing

## Key Features
- AI-powered candidate screening using Gemini
- Video interview recording and analysis
- Resume parsing with Google Document AI
- Real-time interview scheduling
- Multi-company support
- Comprehensive analytics dashboard

## API Structure
- `/api/admin/*` - Admin endpoints
- `/api/recruiter/*` - Recruiter endpoints
- `/api/candidate/*` - Candidate endpoints
- `/api/interview/*` - Interview management
- `/api/ai/*` - AI processing endpoints
- `/api/upload/*` - File upload endpoints

## Environment Variables & Secret Management

### Secret Manager Integration
**All sensitive secrets are stored in Google Cloud Secret Manager**, not in .env files. The application retrieves secrets at runtime using the Secret Manager API.

### Secret Naming Convention
Secrets are stored with the following pattern:
- `FIREBASE_*` - Firebase configuration secrets
- `GOOGLE_*` - Google Cloud service credentials
- `OPENAI_API_KEY` - OpenAI API key
- `ELEVENLABS_*` - ElevenLabs API configuration
- Other service-specific secrets

### Accessing Secrets
The app uses Google Cloud Secret Manager client to fetch secrets:
```javascript
// Example from server-side code
const secretManagerServiceClient = new SecretManagerServiceClient();
const [version] = await secretManagerServiceClient.accessSecretVersion({
  name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
});
```

### Local Development
For local development, you have two options:
1. Use Service Account credentials with Secret Manager access
2. Create a `.env.local` file with non-sensitive config (project IDs, public keys)

### Important Scripts for Secret Management
- `npm run setup:storage:secretmanager` - Setup storage with Secret Manager
- `npm run check:storage:secretmanager` - Verify Secret Manager configuration
- `npm run check:firestore` - Check Firestore with Secret Manager

### Environment Variables Structure
```bash
# Public variables (can be in .env files)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Private variables (must be in Secret Manager)
FIREBASE_SERVICE_ACCOUNT_KEY
GOOGLE_APPLICATION_CREDENTIALS
OPENAI_API_KEY
ELEVENLABS_API_KEY
# ... other sensitive credentials
```

## Testing & Development Notes
- Always run `npm run lint` and `npm run typecheck` before committing
- The app uses server-side rendering (SSR) with Next.js App Router
- API routes handle backend logic
- Firestore is the primary database
- Files are stored in Firebase Storage with structured paths

## Recent Changes (Latest)
- **✅ Package Lock Fix**: Resolved missing dependency lock file deployment issue
- **✅ Repository Cleanup**: Removed unnecessary Firebase cache and debug files
- **✅ Deployment Optimization**: Simplified .dockerignore and .gcloudignore for better builds
- **✅ Live Deployment**: Application successfully deployed and running on Firebase App Hosting
- **Updated Firebase Project**: Migrated from `persona-recruit-ai` to `ai-talent-stream`
- **Secret Manager Configuration**: Complete Firebase config stored in Secret Manager
- **Enhanced Resource Allocation**: Upgraded to 8GB RAM for App Hosting backend
- **Role-Based Security**: Comprehensive Firestore and Storage rules with 5 user roles
- **AI Vector Search**: Firestore indexes configured for embedding-based candidate matching
- Switched from Firebase Hosting to Firebase App Hosting
- Removed static HTML generation in favor of dynamic SSR

## Common Issues & Solutions
1. **Build Memory Issues**: Use `NODE_OPTIONS='--max-old-space-size=8192'` (now allocated 8GB RAM)
2. **Port Conflicts**: Dev server runs on port 9002
3. **Authentication**: Custom auth system with Firebase integration
4. **File Uploads**: Use structured paths in Firebase Storage
5. **Secret Manager Access**: Ensure service account has Secret Manager Accessor role
6. **Missing package-lock.json**: Ensure file is not excluded in .gitignore and is committed to git
7. **Deployment Failures**: Check Cloud Build logs at Firebase Console > App Hosting

## Deployment Status & Monitoring

### Current Deployment
- **Status**: ✅ Live and Running
- **URL**: https://ai-talent-stream--ai-talent-stream.us-central1.hosted.app
- **Last Updated**: July 3, 2025
- **Build Status**: Monitor at [Firebase Console](https://console.firebase.google.com/project/ai-talent-stream/apphosting)

### Monitoring & Logs
- **Cloud Build Logs**: Firebase Console > App Hosting > Build History
- **Application Logs**: Firebase Console > App Hosting > Logs
- **Performance**: Firebase Console > Performance Monitoring
- **Firestore Usage**: Firebase Console > Firestore > Usage

### Deployment Commands
```bash
# Deploy application
firebase deploy --only apphosting --project=ai-talent-stream

# Deploy database rules
firebase deploy --only firestore:rules,firestore:indexes,storage:rules --project=ai-talent-stream

# Check deployment status
firebase apphosting:backends:list --project=ai-talent-stream
```

## Security Considerations
- Firestore rules enforce user-based access control
- Storage rules restrict file access by user type
- API routes validate authentication tokens
- Sensitive data stored in Secret Manager
- Package dependencies secured with lock files
- Firebase cache files excluded from repository