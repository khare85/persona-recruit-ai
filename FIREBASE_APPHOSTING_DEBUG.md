# Firebase App Hosting Debug Guide

## Current Issue
The Cloud Build is failing after file extraction. The build process appears to start but then fails silently.

## Build Log Pattern
1. Files are extracted successfully
2. Build process stops without error message
3. Build marked as failed

## Likely Causes

### 1. Missing GitHub Repository Connection
Firebase App Hosting typically requires a GitHub repository connection for automatic builds.

**Solution**: 
- Use `persona-recruit-ai-1` backend which has GitHub connected
- Or manually connect GitHub to the backend

### 2. Build Configuration Issues
The build might be failing due to:
- Memory limits
- Timeout issues
- Missing dependencies
- Incompatible Node.js version

### 3. Permission Issues
The Cloud Build service account might lack permissions.

## Debugging Steps

1. **Check Full Build Logs**
   - Visit the Cloud Build URL provided
   - Look for errors after the file extraction phase
   - Check for timeout messages

2. **Try Manual Build**
   ```bash
   # Test if the build works locally
   npm ci --legacy-peer-deps
   npm run build
   ```

3. **Use Different Backend**
   Switch to persona-recruit-ai project which has working backends:
   ```bash
   firebase use persona-recruit-ai
   firebase deploy --only apphosting
   ```

4. **Check Service Account Permissions**
   The Cloud Build service account needs:
   - Storage Object Admin
   - Firebase Admin
   - Cloud Build Service Account

## Alternative Solutions

### Option 1: Use Static Export
```bash
# In next.config.ts add:
output: 'export'

# Then deploy to regular Firebase Hosting
firebase deploy --only hosting
```

### Option 2: Use Cloud Run Directly
Deploy the Docker container directly to Cloud Run without App Hosting.

### Option 3: Debug Cloud Build
1. Go to Cloud Build logs
2. Look for the actual error after file extraction
3. Common errors:
   - "npm: command not found" - Docker image issue
   - "Out of memory" - Increase memory limits
   - "Timeout" - Increase timeout in apphosting.yaml

## Configuration Files Status
✅ package.json - Optimized
✅ apphosting.yaml - Correct environment variables
✅ .npmrc - Legacy peer deps enabled
✅ .node-version - Set to 20.11.0
✅ firebase.json - Simplified
✅ API Keys - Correct for ai-talent-stream

The configuration is correct, but the Cloud Build process itself is failing.