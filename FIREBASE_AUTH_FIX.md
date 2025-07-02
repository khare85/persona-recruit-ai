# Firebase Authentication Fix for persona.brighttiersolutions.com

## Issue
Unable to login on the custom domain `persona.brighttiersolutions.com` while login works on the preview URL.

## Root Cause
Firebase Authentication restricts sign-in to authorized domains only. Your custom domain needs to be added to Firebase's authorized domains list.

## Solution Steps

### 1. Add Custom Domain to Firebase Authorized Domains
1. Go to [Firebase Console Authentication Settings](https://console.firebase.google.com/project/persona-recruit-ai/authentication/settings)
2. Scroll to the "Authorized domains" section
3. Click "Add domain"
4. Add these domains:
   - `persona.brighttiersolutions.com`
   - `brighttiersolutions.com` (optional, for root domain)
5. Click "Save"

### 2. Update Content Security Policy (if needed)
The CSP in `/src/middleware/security.ts` needs to include Firebase auth domains. Currently it includes:
- `https://apis.google.com`
- `https://www.gstatic.com`
- `https://firestore.googleapis.com`

Add these if missing:
- `https://persona-recruit-ai.firebaseapp.com`
- `https://identitytoolkit.googleapis.com`
- `https://securetoken.googleapis.com`

### 3. Verify CORS Settings
Your CORS is already configured correctly in `.env.production`:
```
NEXT_PUBLIC_APP_URL="https://persona.brighttiersolutions.com"
CORS_ORIGIN="https://persona.brighttiersolutions.com"
```

### 4. Check OAuth Redirect URIs (if using Google Sign-in)
If you're using Google Sign-in:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=persona-recruit-ai)
2. Find your OAuth 2.0 Client ID
3. Add these Authorized redirect URIs:
   - `https://persona.brighttiersolutions.com/__/auth/handler`
   - `https://persona-recruit-ai.firebaseapp.com/__/auth/handler`

### 5. Clear Browser Cache
After making these changes:
1. Clear browser cache and cookies for persona.brighttiersolutions.com
2. Try logging in again

## Quick Checklist
- [ ] Added custom domain to Firebase authorized domains
- [ ] Updated CSP if needed
- [ ] Verified CORS settings
- [ ] Updated OAuth redirect URIs (if using Google Sign-in)
- [ ] Cleared browser cache

## Testing
1. Open browser DevTools Network tab
2. Try to login
3. Check for any blocked requests or CORS errors
4. Look for 403 errors from Firebase Auth

The most common cause is the missing authorized domain in Firebase settings. This should resolve your login issue.