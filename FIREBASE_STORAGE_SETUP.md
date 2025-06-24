# Firebase Storage Setup Guide

This guide will help you set up the Firebase Cloud Storage structure for Persona Recruit AI.

## Current Issue

You mentioned that you don't see any folders in Firebase Cloud Storage at `gs://ai-talent-stream.firebasestorage.app`. This is because Firebase Storage doesn't create folders until files are uploaded to them.

## Quick Fix

### Option 1: Automated Setup (Recommended)

Run this command to automatically create all necessary folders:

```bash
npm run setup:storage
```

This will create the following folder structure:
- `avatars/` - User profile pictures
- `profiles/` - User profile documents
- `company-logos/` - Company branding assets
- `resumes/` - Candidate resume files
- `video-intros/` - Candidate introduction videos
- `documents/` - General document uploads
- `support-attachments/` - Support ticket attachments
- And many more...

### Option 2: Manual Setup

If you prefer to create folders manually:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (`ai-talent-stream`)
3. Navigate to Storage
4. Click "Upload files" or "Upload folder"
5. Create a test file in each folder you need

### Option 3: Check Current Structure

To see what's currently in your storage:

```bash
npm run check:storage
```

## Prerequisites

Before running the setup scripts, ensure you have:

### For Development:
1. **Service Account Key**: Download from Firebase Console > Project Settings > Service Accounts
2. **Save as**: `serviceAccountKey.json` in the project root
3. **Never commit** this file to version control (it's in .gitignore)

### For Production:
1. **Environment Variable**: Set `GOOGLE_APPLICATION_CREDENTIALS`
2. **Points to**: Path to your service account key file

## Storage Security Rules

After creating folders, update your Firebase Storage security rules:

1. Go to Firebase Console > Storage > Rules
2. Replace with these recommended rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User profile files
    match /profiles/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Resumes - users can read/write their own
    match /resumes/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Video intros - users can read/write their own
    match /video-intros/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Company logos - public read, company admin write
    match /company-logos/{companyId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Avatars - public read, owner write
    match /avatars/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Support attachments
    match /support-attachments/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Temporary uploads with size limit
    match /temp/{allPaths=**} {
      allow write: if request.auth != null && resource.size < 50 * 1024 * 1024;
      allow read: if request.auth != null;
    }
    
    // Default: deny all
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Troubleshooting

### Error: "Could not find Firebase service account credentials"

**Solution**: 
1. Download service account key from Firebase Console
2. Save as `serviceAccountKey.json` in project root
3. Or set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### Error: "Storage bucket not found"

**Solution**:
1. Check that `FIREBASE_STORAGE_BUCKET` environment variable is set
2. Verify the bucket name in Firebase Console
3. Ensure your service account has Storage Admin permissions

### Error: "Permission denied"

**Solution**:
1. Check that your service account has "Storage Admin" role
2. Verify IAM permissions in Google Cloud Console
3. Make sure the service account key is valid and not expired

## Environment Variables

Make sure these are set in your `.env.local`:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-talent-stream
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ai-talent-stream.firebasestorage.app
FIREBASE_STORAGE_BUCKET=ai-talent-stream.firebasestorage.app

# For production deployments
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
```

## File Upload Integration

The application uses these services for file uploads:

- **`src/lib/storage.ts`** - Main file upload service
- **`src/services/videoStorage.service.ts`** - Video-specific uploads
- **`src/services/resumeProcessing.service.ts`** - Resume processing

These services will automatically use the folder structure created by the setup script.

## Monitoring

After setup, monitor your storage usage:

1. **Firebase Console**: https://console.firebase.google.com/project/ai-talent-stream/storage
2. **Usage Metrics**: Check the "Usage" tab for storage consumption
3. **Access Logs**: Enable and monitor access logs for security

## Support

If you encounter issues:

1. Check the logs when running the setup scripts
2. Verify Firebase project permissions
3. Ensure billing is enabled for your Firebase project
4. Contact support with specific error messages

---

**Next Steps After Setup:**
1. Test file uploads through your application
2. Monitor storage usage and costs
3. Adjust security rules based on your needs
4. Set up automated backups if needed