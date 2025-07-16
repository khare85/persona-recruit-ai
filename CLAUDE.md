# Project Overview: AI Talent Recruitment Platform

## Project Type
- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Authentication (no JWT)
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

## Authentication Architecture
- **Frontend**: Firebase Auth SDK for user authentication
- **Backend**: Firebase Admin SDK for token verification
- **Token Management**: Firebase ID tokens (no custom JWT)
- **User Roles**: Set via Firebase Auth custom claims
- **Session Management**: Handled entirely by Firebase Auth
- **API Security**: All API routes verify Firebase ID tokens

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

**Note**: JWT_SECRET is NOT used - authentication is handled entirely by Firebase Auth

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
- **✅ Candidate Dashboard Fix**: Fixed 404 error by creating /candidate/dashboard redirect and correcting route to /candidates/dashboard
- **✅ Complete Firebase Auth Migration**: Removed all JWT dependencies and code, using Firebase Auth exclusively
- **✅ Authentication Cleanup**: Updated all auth utilities, API routes, and client hooks to use Firebase Auth
- **✅ Package Dependencies**: Removed jsonwebtoken and @types/jsonwebtoken packages
- **✅ Candidate Registration Fix**: Fixed missing location field and updated registration flow
- **✅ Video Recorder Fix**: Resolved black screen issue with proper video element configuration
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
3. **Authentication**: Firebase Authentication only (no custom JWT tokens)
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

## AI Flows and Services Architecture

### Core AI Configuration
- **Genkit Setup**: `/src/ai/genkit.ts` - Central AI configuration using Google Genkit with Gemini 2.0 Flash
- **Model**: `googleai/gemini-2.0-flash` for text generation
- **Embedding Model**: `textembedding-gecko-multilingual` for vector embeddings

### Available AI Flows (`/src/ai/flows/`)

#### 1. **Resume Processing Flows**
- **`generate-resume-summary-flow.ts`**: Creates professional 3-5 sentence summaries from resume text
- **`resume-skill-extractor.ts`**: Extracts technical and soft skills from resume content
- **`process-resume-document-ai-flow.ts`**: Parses resume files using Google Cloud Document AI
- **Input**: Resume text or base64 file content
- **Output**: Structured data (summary, skills array, extracted text)
- **Integration**: Used by resume processing service

#### 2. **Candidate Matching Flows**
- **`advanced-candidate-job-matching-flow.ts`**: Two-stage semantic search + LLM analysis
- **`candidate-job-matcher.ts`**: Detailed candidate-job compatibility analysis
- **`candidate-screener-flow.ts`**: Logic-based skill matching and screening
- **`ai-talent-semantic-search-flow.ts`**: Vector-based candidate search using Firestore embeddings
- **Input**: Job requirements, candidate profiles, search queries
- **Output**: Match scores, compatibility analysis, ranked candidates
- **Integration**: API endpoints `/api/ai/advanced-match`, candidate search

#### 3. **Job Management Flows**
- **`job-description-generator.ts`**: AI-powered job description creation
- **`job-skill-generator-flow.ts`**: Generates relevant skills for job postings
- **`job-recommendation-semantic-flow.ts`**: Vector-based job recommendations
- **`job-recommendation-engine.ts`**: Basic job recommendations with market data
- **Input**: Job title, experience level, industry, candidate profile
- **Output**: Complete job descriptions, skills arrays, job recommendations
- **Integration**: Job generation service, candidate recommendations API

#### 4. **Interview Flows**
- **`live-interview-flow.ts`**: AI-powered conversational interviewer
- **`video-interview-analysis.ts`**: Comprehensive video interview analysis with behavioral assessment
- **Input**: Job description, candidate info, conversation history, video data
- **Output**: AI responses, behavioral analysis, competency scores
- **Integration**: Interview start API, video analysis services

#### 5. **Core AI Utilities**
- **`generate-text-embedding-flow.ts`**: Creates vector embeddings for semantic search
- **`ai-talent-search-flow.ts`**: Wrapper around semantic search with filtering
- **Input**: Text content, search queries
- **Output**: Numerical embedding vectors, filtered search results
- **Integration**: All semantic search functionality

### AI Services (`/src/services/`)

#### 1. **AI Orchestrator** (`ai/AIOrchestrator.ts`)
- **Purpose**: Central AI operations management with performance optimization
- **Features**: Complete candidate processing pipeline, batch processing, rate limiting
- **Integration**: Singleton service available system-wide

#### 2. **Gemini Service** (`ai/GeminiService.ts`)
- **Purpose**: Enhanced Gemini API wrapper with caching and retry logic
- **Features**: Resume analysis, skill extraction, job generation, video analysis, bias detection
- **Integration**: Used by AI Orchestrator

#### 3. **Candidate Scoring Service** (`candidateScoringService.ts`)
- **Purpose**: Comprehensive candidate evaluation against job requirements
- **Features**: Detailed scoring, batch processing, skills proficiency assessment
- **Integration**: Available as singleton service

#### 4. **Job Generation Service** (`jobGenerationService.ts`)
- **Purpose**: AI-powered job description creation
- **Features**: Complete job descriptions, skills generation, structured output
- **Integration**: Available as singleton service

### Integration Guidelines

#### ✅ **ALWAYS USE EXISTING AI FLOWS**
When implementing AI functionality, use these existing flows:
1. **Resume Processing**: Use `generate-resume-summary-flow.ts` + `resume-skill-extractor.ts`
2. **Candidate Matching**: Use `advanced-candidate-job-matching-flow.ts`
3. **Job Creation**: Use `job-description-generator.ts` + `job-skill-generator-flow.ts`
4. **Embeddings**: Use `generate-text-embedding-flow.ts`
5. **Search**: Use `ai-talent-semantic-search-flow.ts`

#### ❌ **DO NOT CREATE NEW AI FLOWS**
- All major AI functionality already exists
- Use existing flows and services instead of creating new ones
- Extend existing flows if additional functionality is needed

#### 🔧 **Current Integration Status**
- **✅ Fully Integrated**: Resume processing, candidate search, job recommendations, video interview analysis, bias detection
- **⚠️ Partially Integrated**: Live interviews, candidate screening
- **❌ Not Integrated**: Job description generation UI

### AI API Endpoints
- **`/api/ai/advanced-match`**: Advanced candidate matching
- **`/api/candidates/job-recommendations`**: Personalized job recommendations
- **`/api/interview/start`**: AI-powered interview initialization
- **`/api/candidates/resume-process`**: Resume parsing and profile extraction
- **`/api/interviews/[id]/analyze`**: Video interview analysis using AI
- **`/api/ai/bias-detection`**: General bias detection analysis
- **`/api/applications/[id]/bias-check`**: Application decision bias checking
- **`/api/jobs/[id]/bias-check`**: Job description bias checking

### Important Notes
- All AI flows use Google Genkit framework
- Text generation uses Gemini 2.0 Flash model
- Embeddings use `textembedding-gecko-multilingual`
- Comprehensive error handling and fallbacks implemented
- Rate limiting and caching built into services
- Vector search uses Firestore with embedding indexes

## Security Considerations
- Firestore rules enforce user-based access control
- Storage rules restrict file access by user type
- API routes validate authentication tokens
- Sensitive data stored in Secret Manager
- Package dependencies secured with lock files
- Firebase cache files excluded from repository