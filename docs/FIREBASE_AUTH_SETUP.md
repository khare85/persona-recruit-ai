# Firebase Authentication Setup Guide

This guide explains how to set up Firebase Authentication for both demo and production environments.

## Quick Start

1. **Set up client-side configuration:**
   ```bash
   npm run setup:auth
   ```
   - Choose `production` or `demo` environment
   - This creates/updates `.env.local` with Firebase configuration

2. **Set up server-side authentication:**
   ```bash
   npm run setup:admin
   ```
   - Follow the instructions to configure Application Default Credentials

3. **Restart the development server:**
   ```bash
   npm run dev
   ```

## Environment Configuration

### Production Environment
- **Project ID**: `ai-talent-stream`
- **URL**: https://ai-talent-stream--ai-talent-stream.us-central1.hosted.app
- **Firebase Config**: Stored in `.env.local`

### Demo Environment
- **Project ID**: `ai-talent-stream-demo`
- **URL**: https://ai-talent-stream-demo--ai-talent-stream-demo.us-central1.hosted.app
- **Firebase Config**: Stored in `.env.local` with `NEXT_PUBLIC_ENVIRONMENT=demo`

## Authentication Flow

### Client-Side (Firebase SDK)
1. Firebase SDK is initialized in `/src/config/firebase.ts`
2. Authentication state is managed by `/src/contexts/AuthContext.tsx`
3. Users sign in with email/password or social providers
4. Firebase ID tokens are automatically managed

### Server-Side (Firebase Admin SDK)
1. Admin SDK is initialized in `/src/services/firestoreService.ts`
2. API routes verify Firebase ID tokens using Admin SDK
3. User roles are stored as custom claims in Firebase Auth

## Common Issues & Solutions

### Issue: "Firebase critical configuration is missing"
**Solution**: Run `npm run setup:auth` and restart the dev server

### Issue: "Failed to get Firebase ID token"
**Solution**: 
1. Check if you're logged in (Firebase Auth)
2. Clear browser cache/cookies
3. Try signing out and back in

### Issue: "Error verifying Firebase token" (Server-side)
**Solution**:
1. Run `npm run setup:admin`
2. For local development: `gcloud auth application-default login`
3. For production: Ensure Application Default Credentials are configured

### Issue: Authentication works locally but not in production
**Solution**:
1. Verify environment variables are set in Firebase App Hosting
2. Check that the correct project is selected: `firebase use production`
3. Ensure Service Account has proper permissions

## Security Best Practices

1. **Never commit service account keys** to version control
2. Use **Application Default Credentials** for local development
3. Store sensitive credentials in **Google Secret Manager** for production
4. Enable **Firebase App Check** for additional security
5. Implement proper **Firestore Security Rules**

## Testing Authentication

### Manual Testing
1. Visit http://localhost:9002/auth
2. Create a new account or sign in
3. Check browser console for authentication status
4. Try accessing protected routes (e.g., /admin/dashboard)

### Debugging Tips
- Check browser console for client-side errors
- Check server logs for API authentication errors
- Verify Firebase project configuration in Firebase Console
- Use Firebase Auth Emulator for testing without affecting production

## Deployment

### Deploy to Demo Environment
```bash
firebase use demo
npm run deploy:demo
```

### Deploy to Production
```bash
firebase use production
npm run deploy:production
```

## Additional Resources
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)