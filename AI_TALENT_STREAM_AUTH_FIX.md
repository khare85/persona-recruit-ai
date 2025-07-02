# Firebase Authentication Fix for ai-talent-stream

## Current Issue
- **Error**: `auth/api-key-not-valid`
- **Project**: ai-talent-stream

## Fixed Configuration
The correct Firebase configuration for ai-talent-stream is:

```javascript
{
  "projectId": "ai-talent-stream",
  "appId": "1:541879201595:web:110bb13a8daec937de911e",
  "storageBucket": "ai-talent-stream.firebasestorage.app",
  "apiKey": "AIzaSyDBJabwAuKxGnM0zFIh0A1ROEC8tTpQ2c8",
  "authDomain": "ai-talent-stream.firebaseapp.com",
  "messagingSenderId": "541879201595",
  "measurementId": "G-QL7NT2DTQS"
}
```

## Steps to Fix Authentication

### 1. Add Authorized Domains
Go to [Firebase Console Authentication Settings](https://console.firebase.google.com/project/ai-talent-stream/authentication/settings) and add:
- `studio--ai-talent-stream.us-central1.hosted.app`
- `localhost` (for local development)
- Any custom domains you plan to use

### 2. Enable Authentication Methods
In the same console, ensure these sign-in methods are enabled:
- Email/Password
- Google (if using Google sign-in)

### 3. Update Local Environment
Create or update `.env.local` with:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDBJabwAuKxGnM0zFIh0A1ROEC8tTpQ2c8"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="ai-talent-stream.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="ai-talent-stream"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="ai-talent-stream.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="541879201595"
NEXT_PUBLIC_FIREBASE_APP_ID="1:541879201595:web:110bb13a8daec937de911e"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-QL7NT2DTQS"
```

### 4. Clear Browser Cache
After making changes, clear your browser cache and cookies.

## Deployment Issues
The Cloud Build is failing. Check the logs at the provided URL for specific errors. Common issues:
- Missing dependencies
- Build timeout
- Memory limits

## Testing
1. Test locally first with `npm run dev`
2. Visit http://localhost:9002
3. Try to sign in/sign up
4. Check browser console for any errors