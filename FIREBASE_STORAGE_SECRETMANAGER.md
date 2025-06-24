# Firebase Storage Setup with Secret Manager

Since you're using Google Cloud Secret Manager, this guide will help you set up Firebase Storage using secrets instead of local service account files.

## 🔐 Secret Manager Configuration

### Required Environment Variables

```bash
# Project Configuration
GOOGLE_CLOUD_PROJECT=ai-talent-stream
FIREBASE_PROJECT_ID=ai-talent-stream
FIREBASE_STORAGE_BUCKET=ai-talent-stream.firebasestorage.app

# Secret Manager Configuration (optional - defaults shown)
FIREBASE_SERVICE_ACCOUNT_SECRET=firebase-service-account
```

### Expected Secret Structure

Your secret should contain the Firebase service account JSON with this structure:

```json
{
  "type": "service_account",
  "project_id": "ai-talent-stream",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@ai-talent-stream.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## 🚀 Quick Setup Commands

### Check Current Storage Structure
```bash
npm run check:storage:secretmanager
```

### Set Up Complete Folder Structure
```bash
npm run setup:storage:secretmanager
```

## 📁 Folder Structure Created

The setup will create these organized folders:

```
📁 User Files
├── avatars/              # Profile pictures
├── profiles/             # User profile documents
└── resumes/             # Candidate resumes

📁 Company Files  
├── company-logos/        # Company branding
└── company-documents/    # Company-specific docs

📁 Candidate Content
├── cover-letters/        # Cover letter documents
├── portfolios/          # Portfolio files
├── video-intros/        # Video introductions
└── candidate-documents/ # Other candidate files

📁 Job Management
├── job-attachments/     # Job posting attachments
└── job-images/          # Job-related images

📁 Communication
├── support-attachments/ # Support ticket files
└── chat-attachments/    # Chat message files

📁 System & Analytics
├── backups/             # System backups
├── exports/             # Data exports
├── reports/             # Generated reports
├── analytics-exports/   # Analytics data
└── audit-logs/          # Security audit logs

📁 Media & Processing
├── images/              # General images
├── videos/              # Video content
├── documents/           # General documents
└── temp/                # Temporary uploads

📁 AI & ML
├── ai-models/           # AI model files
└── ai-training-data/    # Training datasets
```

## 🔧 Secret Manager Setup

### 1. Create the Secret (if not exists)

```bash
# If you have the service account file locally
gcloud secrets create firebase-service-account \
  --data-file=serviceAccountKey.json \
  --project=ai-talent-stream

# Or create empty and add content later
gcloud secrets create firebase-service-account \
  --project=ai-talent-stream
```

### 2. Add Service Account Content

```bash
# From file
gcloud secrets versions add firebase-service-account \
  --data-file=serviceAccountKey.json \
  --project=ai-talent-stream

# From stdin
cat serviceAccountKey.json | gcloud secrets versions add firebase-service-account \
  --data-file=- \
  --project=ai-talent-stream
```

### 3. Grant Access Permissions

```bash
# Grant your compute service account access to the secret
gcloud secrets add-iam-policy-binding firebase-service-account \
  --member="serviceAccount:YOUR-SERVICE-ACCOUNT@ai-talent-stream.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=ai-talent-stream
```

## 🔒 Required IAM Permissions

Your service account needs these roles:

```yaml
# Secret Manager
- roles/secretmanager.secretAccessor  # Read secrets

# Firebase Storage
- roles/storage.admin                 # Full storage access
- roles/firebase.admin               # Firebase admin access

# Optional: For Cloud Run/Compute Engine
- roles/storage.objectAdmin          # Object-level storage access
```

## 🧪 Testing the Setup

### 1. Test Secret Access
```bash
# Verify secret exists and is accessible
gcloud secrets versions access latest \
  --secret=firebase-service-account \
  --project=ai-talent-stream
```

### 2. Test Storage Setup
```bash
# Check current state
npm run check:storage:secretmanager

# If empty, set up folders
npm run setup:storage:secretmanager
```

### 3. Verify in Console
- **Firebase Console**: https://console.firebase.google.com/project/ai-talent-stream/storage
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager?project=ai-talent-stream

## 🛠️ Troubleshooting

### Error: "Secret not found"
```bash
# List all secrets in project
gcloud secrets list --project=ai-talent-stream

# Check specific secret
gcloud secrets describe firebase-service-account --project=ai-talent-stream
```

**Solution**: Create the secret or verify the name matches `FIREBASE_SERVICE_ACCOUNT_SECRET`.

### Error: "Permission denied"
```bash
# Check IAM bindings
gcloud secrets get-iam-policy firebase-service-account --project=ai-talent-stream
```

**Solution**: Grant `secretmanager.secretAccessor` role to your service account.

### Error: "Invalid JSON in secret"
```bash
# Validate secret content
gcloud secrets versions access latest \
  --secret=firebase-service-account \
  --project=ai-talent-stream | jq .
```

**Solution**: Ensure the secret contains valid Firebase service account JSON.

### Error: "Storage bucket not found"
**Solution**: Verify `FIREBASE_STORAGE_BUCKET` environment variable matches your actual bucket name.

## 🔐 Security Best Practices

### 1. Least Privilege Access
- Only grant `secretAccessor` role to services that need it
- Use separate secrets for different environments
- Regularly rotate service account keys

### 2. Secret Versioning
```bash
# Create new version when rotating keys
gcloud secrets versions add firebase-service-account \
  --data-file=new-serviceAccountKey.json
```

### 3. Audit Access
```bash
# View secret access logs
gcloud logging read "resource.type=secret AND resource.labels.secret_id=firebase-service-account" \
  --project=ai-talent-stream
```

## 📊 Monitoring & Alerts

### 1. Set up alerts for:
- Failed secret access attempts
- Storage quota usage
- Unauthorized access patterns

### 2. Monitor metrics:
- Secret access frequency
- Storage usage growth
- API error rates

## 🔄 Environment-Specific Configuration

### Development
```bash
FIREBASE_SERVICE_ACCOUNT_SECRET=firebase-service-account-dev
```

### Staging
```bash
FIREBASE_SERVICE_ACCOUNT_SECRET=firebase-service-account-staging
```

### Production
```bash
FIREBASE_SERVICE_ACCOUNT_SECRET=firebase-service-account-prod
```

## 📝 Integration with Application

The Firebase Storage service in your app (`src/lib/storage.ts`) will automatically use the Secret Manager configuration when these environment variables are set:

- `GOOGLE_CLOUD_PROJECT`
- `FIREBASE_SERVICE_ACCOUNT_SECRET`

No code changes required - the existing storage service will work with both local files and Secret Manager.

---

**Next Steps:**
1. ✅ Verify secret exists and is accessible
2. ✅ Run `npm run setup:storage:secretmanager`
3. ✅ Check Firebase Console for created folders
4. ✅ Test file uploads through your application
5. ✅ Configure storage security rules
6. ✅ Set up monitoring and alerts