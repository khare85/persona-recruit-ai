# Super Admin Setup Guide

## Issue: Super Admin Login Shows Candidate Dashboard

This guide helps resolve the issue where a super admin user is being redirected to the candidate dashboard instead of the admin dashboard.

## Root Cause

The issue occurs when Firebase custom claims are not properly set for the super admin user. The authentication system checks for a `role` claim in the Firebase ID token, and if it's missing or incorrect, it defaults to 'candidate'.

## Solution Steps

### 1. Debug Current Auth State

First, check your current authentication state:

1. While logged in, navigate to `/debug-auth`
2. This page will show:
   - Your current user info and role
   - Firebase token claims
   - Quick navigation buttons

### 2. Set Super Admin Role

There are three ways to set the super admin role:

#### Option A: Using the Local Script (Recommended for Development)

```bash
# Make sure you have Firebase Admin SDK credentials set up
node scripts/set-super-admin.js your-email@example.com
```

#### Option B: Using Firebase Cloud Functions

1. Deploy the cloud function:
```bash
cd functions
npm run deploy -- --only functions:setSuperAdminRole
```

2. Call the function from your app or using Firebase Console

#### Option C: Manual Setup via Firebase Console

1. Go to Firebase Console → Firestore Database
2. Navigate to `users` collection
3. Find your user document (by UID)
4. Update the `role` field to `super_admin`

**Note:** This only updates Firestore. For proper authentication, you need to set custom claims using Admin SDK.

### 3. Refresh Authentication

After setting the role:

1. Sign out completely
2. Sign back in
3. OR use the "Force Refresh Token" button on `/debug-auth`

## Verification

1. Navigate to `/debug-auth` after refreshing
2. Check that:
   - "Role from Context" shows `super_admin`
   - Token claims include `"role": "super_admin"`
3. Try navigating to `/admin/dashboard`

## Firebase Security Rules

The Firestore rules are already configured to allow super_admin access:

```javascript
function hasRole(role) {
  return isAuthenticated() && request.auth.token.role == role;
}
```

## Common Issues

1. **Role still shows as 'candidate'**
   - Custom claims weren't set properly
   - Token wasn't refreshed after setting claims
   - Check Firebase Console → Authentication → User → Custom Claims

2. **Permission denied errors**
   - Ensure the user document exists in Firestore
   - Check that Firebase rules are deployed: `firebase deploy --only firestore:rules`

3. **API calls failing**
   - The API endpoints check for `super_admin` role in the token
   - Ensure token is being sent in Authorization header
   - Check browser console for specific error messages

## Production Setup

For production environments:

1. Remove or secure the initialization endpoints
2. Implement a secure admin interface for role management
3. Use Cloud Functions with proper authentication
4. Set up audit logging for role changes

## Need Help?

1. Check `/debug-auth` for current state
2. Review browser console for errors
3. Check Firebase Console for user details
4. Verify Firestore rules are deployed correctly