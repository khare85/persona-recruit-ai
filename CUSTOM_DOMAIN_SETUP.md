# 🌐 Custom Domain Setup Guide
**Setting up persona.brighttiersolutions.com for AI Talent Recruitment Platform**

## 📋 Current Status

### ✅ **Application Status**
- **Firebase App Hosting**: ✅ Live and operational
- **Default URL**: https://ai-talent-stream--ai-talent-stream.us-central1.hosted.app
- **Firebase Project**: ai-talent-stream (correctly configured)
- **Environment Variables**: ✅ Updated to match ai-talent-stream project

### ❌ **Custom Domain Status**
- **Domain**: persona.brighttiersolutions.com
- **Current Status**: ❌ Not accessible (404 error)
- **DNS Configuration**: ❌ Not pointing to Firebase App Hosting
- **SSL Certificate**: ❌ Not configured

## 🔧 Setup Steps Required

### **Step 1: Add Custom Domain to Firebase Console**

1. **Navigate to Firebase Console**:
   ```
   https://console.firebase.google.com/project/ai-talent-stream/apphosting
   ```

2. **Access App Hosting Backend**:
   - Click on the `ai-talent-stream` backend
   - Look for "Custom Domains" or "Domain Management" section

3. **Add Custom Domain**:
   - Click "Add Custom Domain"
   - Enter: `persona.brighttiersolutions.com`
   - Follow the verification steps

### **Step 2: DNS Configuration**

Firebase will provide DNS records that need to be configured in your domain DNS settings:

#### **Expected DNS Records** (to be provided by Firebase):
```dns
# A Record (or CNAME)
persona.brighttiersolutions.com → [Firebase IP/CNAME provided by console]

# Or CNAME Record
persona.brighttiersolutions.com → [Firebase hosting target provided by console]
```

#### **Configure DNS** (at your domain registrar):
1. Login to your DNS provider (where brighttiersolutions.com is managed)
2. Add the DNS records provided by Firebase Console
3. Wait for DNS propagation (can take up to 48 hours)

### **Step 3: SSL Certificate**
- Firebase automatically provisions SSL certificates for custom domains
- Certificate will be generated after DNS verification
- HTTPS will be enforced automatically

### **Step 4: Verification Commands**

After DNS configuration, test the setup:

```bash
# Check DNS resolution
nslookup persona.brighttiersolutions.com

# Test HTTPS access
curl -I https://persona.brighttiersolutions.com

# Check SSL certificate
openssl s_client -connect persona.brighttiersolutions.com:443 -servername persona.brighttiersolutions.com
```

## 🔍 **Current Configuration Analysis**

### **✅ Working Components**:
- Firebase App Hosting backend deployed and running
- Application build successful with all features
- Database, storage, and authentication operational
- Environment variables configured for custom domain

### **🔧 Missing Components**:
- Custom domain not added to Firebase App Hosting
- DNS records not pointing to Firebase
- SSL certificate not provisioned

## 📝 **Alternative: Firebase Hosting Integration**

If Firebase App Hosting doesn't support custom domains directly, you can use Firebase Hosting as a proxy:

### **Option A: Firebase Hosting Proxy**
1. Deploy a simple redirect/proxy on Firebase Hosting
2. Configure custom domain on Firebase Hosting
3. Set up rewrites to proxy to App Hosting backend

### **Option B: Load Balancer Setup**
1. Use Google Cloud Load Balancer
2. Configure custom domain in Cloud DNS
3. Route traffic to Firebase App Hosting backend

## 🚀 **Quick Setup Commands**

```bash
# Update production environment
cp .env.production .env.production.backup
# (Already updated in current deployment)

# Deploy with updated environment
firebase deploy --only apphosting --project=ai-talent-stream

# Add custom domain (manual step in console required)
echo "Navigate to: https://console.firebase.google.com/project/ai-talent-stream/apphosting"
echo "Add custom domain: persona.brighttiersolutions.com"
```

## 📞 **Next Steps**

1. **Manual Action Required**: Add custom domain through Firebase Console
2. **DNS Configuration**: Configure provided DNS records with domain registrar
3. **Verification**: Test domain accessibility after DNS propagation
4. **SSL Verification**: Confirm HTTPS certificate is active

## 🔗 **Useful Links**

- **Firebase Console**: https://console.firebase.google.com/project/ai-talent-stream
- **App Hosting Docs**: https://firebase.google.com/docs/app-hosting
- **Custom Domain Docs**: https://firebase.google.com/docs/hosting/custom-domain
- **DNS Help**: https://firebase.google.com/docs/hosting/custom-domain#set-up-domain

---

## ⚠️ **Important Notes**

- The application is fully functional on the default Firebase URL
- Custom domain setup requires manual configuration through Firebase Console
- DNS propagation can take 24-48 hours
- SSL certificates are automatically managed by Firebase

**Status**: Ready for custom domain configuration - manual setup required in Firebase Console.