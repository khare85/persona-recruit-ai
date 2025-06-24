/**
 * Firebase Configuration Management Service
 * Manages Firebase rules, authentication settings, and other backend configurations
 * through Secret Manager and provides frontend interfaces for management
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import admin from 'firebase-admin';

const secretClient = new SecretManagerServiceClient();

export interface FirebaseConfig {
  // Authentication Configuration
  auth: {
    signInMethods: string[];
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    sessionTimeout: number;
    multiFactorAuth: boolean;
    emailVerification: boolean;
  };
  
  // Firestore Security Rules
  firestoreRules: {
    rules: string;
    version: string;
    lastUpdated: string;
    updatedBy: string;
  };
  
  // Storage Security Rules
  storageRules: {
    rules: string;
    version: string;
    lastUpdated: string;
    updatedBy: string;
  };
  
  // API Configuration
  api: {
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
      requestsPerHour: number;
    };
    cors: {
      allowedOrigins: string[];
      allowedMethods: string[];
      allowedHeaders: string[];
    };
    apiKeys: {
      [key: string]: {
        name: string;
        permissions: string[];
        rateLimit: number;
        enabled: boolean;
      };
    };
  };
  
  // User Roles and Permissions
  roles: {
    [roleName: string]: {
      displayName: string;
      permissions: string[];
      inheritFrom?: string[];
      isDefault?: boolean;
    };
  };
  
  // Feature Flags
  features: {
    [featureName: string]: {
      enabled: boolean;
      rolloutPercentage: number;
      allowedRoles: string[];
    };
  };
}

export class FirebaseConfigService {
  private static instance: FirebaseConfigService;
  private projectId: string;
  
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'ai-talent-stream';
  }
  
  static getInstance(): FirebaseConfigService {
    if (!FirebaseConfigService.instance) {
      FirebaseConfigService.instance = new FirebaseConfigService();
    }
    return FirebaseConfigService.instance;
  }
  
  // Secret Manager Operations
  async getSecret(secretName: string): Promise<any> {
    try {
      const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await secretClient.accessSecretVersion({ name });
      const secretValue = version.payload.data.toString('utf8');
      
      try {
        return JSON.parse(secretValue);
      } catch {
        const decoded = Buffer.from(secretValue, 'base64').toString('utf8');
        return JSON.parse(decoded);
      }
    } catch (error) {
      console.error(`Error accessing secret ${secretName}:`, error);
      throw error;
    }
  }
  
  async setSecret(secretName: string, data: any): Promise<void> {
    try {
      const secretValue = JSON.stringify(data, null, 2);
      
      // Try to add a new version to existing secret
      try {
        await secretClient.addSecretVersion({
          parent: `projects/${this.projectId}/secrets/${secretName}`,
          payload: {
            data: Buffer.from(secretValue, 'utf8'),
          },
        });
      } catch (error) {
        // If secret doesn't exist, create it
        if (error.code === 5) { // NOT_FOUND
          await secretClient.createSecret({
            parent: `projects/${this.projectId}`,
            secretId: secretName,
            secret: {
              replication: {
                automatic: {},
              },
            },
          });
          
          await secretClient.addSecretVersion({
            parent: `projects/${this.projectId}/secrets/${secretName}`,
            payload: {
              data: Buffer.from(secretValue, 'utf8'),
            },
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error(`Error setting secret ${secretName}:`, error);
      throw error;
    }
  }
  
  // Firebase Configuration Management
  async getFirebaseConfig(): Promise<FirebaseConfig> {
    try {
      return await this.getSecret('firebase-config');
    } catch (error) {
      // Return default configuration if secret doesn't exist
      return this.getDefaultConfig();
    }
  }
  
  async updateFirebaseConfig(config: Partial<FirebaseConfig>, updatedBy: string): Promise<void> {
    const currentConfig = await this.getFirebaseConfig();
    const updatedConfig = {
      ...currentConfig,
      ...config,
      lastUpdated: new Date().toISOString(),
      updatedBy
    };
    
    await this.setSecret('firebase-config', updatedConfig);
  }
  
  // Firestore Rules Management
  async updateFirestoreRules(rules: string, updatedBy: string): Promise<void> {
    const config = await this.getFirebaseConfig();
    config.firestoreRules = {
      rules,
      version: `v${Date.now()}`,
      lastUpdated: new Date().toISOString(),
      updatedBy
    };
    
    await this.updateFirebaseConfig(config, updatedBy);
    
    // Apply rules to Firebase (requires additional Firebase Admin setup)
    await this.applyFirestoreRules(rules);
  }
  
  async updateStorageRules(rules: string, updatedBy: string): Promise<void> {
    const config = await this.getFirebaseConfig();
    config.storageRules = {
      rules,
      version: `v${Date.now()}`,
      lastUpdated: new Date().toISOString(),
      updatedBy
    };
    
    await this.updateFirebaseConfig(config, updatedBy);
    
    // Apply rules to Firebase Storage
    await this.applyStorageRules(rules);
  }
  
  // Role and Permission Management
  async updateUserRole(userId: string, role: string, permissions?: string[]): Promise<void> {
    const config = await this.getFirebaseConfig();
    
    // Validate role exists
    if (!config.roles[role]) {
      throw new Error(`Role '${role}' does not exist`);
    }
    
    // Set custom claims for the user
    const customClaims = {
      role,
      permissions: permissions || config.roles[role].permissions,
      updatedAt: Date.now()
    };
    
    await admin.auth().setCustomUserClaims(userId, customClaims);
  }
  
  async createRole(roleName: string, roleConfig: FirebaseConfig['roles'][string], updatedBy: string): Promise<void> {
    const config = await this.getFirebaseConfig();
    config.roles[roleName] = roleConfig;
    
    await this.updateFirebaseConfig({ roles: config.roles }, updatedBy);
  }
  
  async deleteRole(roleName: string, updatedBy: string): Promise<void> {
    const config = await this.getFirebaseConfig();
    delete config.roles[roleName];
    
    await this.updateFirebaseConfig({ roles: config.roles }, updatedBy);
  }
  
  // Feature Flag Management
  async updateFeatureFlag(featureName: string, settings: FirebaseConfig['features'][string], updatedBy: string): Promise<void> {
    const config = await this.getFirebaseConfig();
    config.features[featureName] = settings;
    
    await this.updateFirebaseConfig({ features: config.features }, updatedBy);
  }
  
  async isFeatureEnabled(featureName: string, userRole?: string): Promise<boolean> {
    const config = await this.getFirebaseConfig();
    const feature = config.features[featureName];
    
    if (!feature || !feature.enabled) return false;
    
    // Check role permissions
    if (userRole && feature.allowedRoles.length > 0) {
      if (!feature.allowedRoles.includes(userRole)) return false;
    }
    
    // Check rollout percentage (simple implementation)
    return Math.random() * 100 < feature.rolloutPercentage;
  }
  
  // API Configuration
  async updateAPIConfig(apiConfig: Partial<FirebaseConfig['api']>, updatedBy: string): Promise<void> {
    const config = await this.getFirebaseConfig();
    config.api = { ...config.api, ...apiConfig };
    
    await this.updateFirebaseConfig({ api: config.api }, updatedBy);
  }
  
  // User Management with Roles
  async createUserWithRole(userData: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId?: string;
    department?: string;
    permissions?: string[];
  }): Promise<admin.auth.UserRecord> {
    const config = await this.getFirebaseConfig();
    
    // Validate role
    if (!config.roles[userData.role]) {
      throw new Error(`Invalid role: ${userData.role}`);
    }
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: userData.email,
      password: userData.password,
      displayName: `${userData.firstName} ${userData.lastName}`,
      emailVerified: !config.auth.emailVerification, // Set based on config
    });
    
    // Set custom claims
    const customClaims = {
      role: userData.role,
      permissions: userData.permissions || config.roles[userData.role].permissions,
      companyId: userData.companyId,
      department: userData.department,
      createdAt: Date.now()
    };
    
    await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);
    
    // Create user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      companyId: userData.companyId,
      department: userData.department,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      profileComplete: false,
      isActive: true
    });
    
    return userRecord;
  }
  
  // Helper Methods
  private async applyFirestoreRules(rules: string): Promise<void> {
    // This would require Firebase Management API or Cloud Resource Manager API
    // For now, we'll log the rules that should be applied
    console.log('Firestore rules to be applied:', rules);
    
    // In production, you would use:
    // const management = require('@google-cloud/firestore-admin');
    // await management.updateSecurityRules(rules);
  }
  
  private async applyStorageRules(rules: string): Promise<void> {
    // Similar to Firestore, this would require Firebase Management API
    console.log('Storage rules to be applied:', rules);
  }
  
  private getDefaultConfig(): FirebaseConfig {
    return {
      auth: {
        signInMethods: ['email', 'google'],
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSymbols: false
        },
        sessionTimeout: 3600, // 1 hour
        multiFactorAuth: false,
        emailVerification: true
      },
      firestoreRules: {
        rules: this.getDefaultFirestoreRules(),
        version: 'v1.0.0',
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      },
      storageRules: {
        rules: this.getDefaultStorageRules(),
        version: 'v1.0.0',
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      },
      api: {
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 100,
          requestsPerHour: 1000
        },
        cors: {
          allowedOrigins: ['http://localhost:3000', 'https://your-domain.com'],
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization']
        },
        apiKeys: {}
      },
      roles: {
        super_admin: {
          displayName: 'Super Administrator',
          permissions: ['*'], // All permissions
          isDefault: false
        },
        company_admin: {
          displayName: 'Company Administrator',
          permissions: [
            'company.read',
            'company.write',
            'jobs.read',
            'jobs.write',
            'candidates.read',
            'applications.read',
            'team.manage'
          ],
          isDefault: false
        },
        recruiter: {
          displayName: 'Recruiter',
          permissions: [
            'jobs.read',
            'jobs.write',
            'candidates.read',
            'applications.read',
            'interviews.manage'
          ],
          isDefault: false
        },
        candidate: {
          displayName: 'Candidate',
          permissions: [
            'profile.read',
            'profile.write',
            'jobs.read',
            'applications.read',
            'applications.write'
          ],
          isDefault: true
        }
      },
      features: {
        aiMatching: {
          enabled: true,
          rolloutPercentage: 100,
          allowedRoles: ['company_admin', 'recruiter']
        },
        videoInterviews: {
          enabled: true,
          rolloutPercentage: 80,
          allowedRoles: ['company_admin', 'recruiter', 'candidate']
        },
        advancedAnalytics: {
          enabled: true,
          rolloutPercentage: 100,
          allowedRoles: ['super_admin', 'company_admin']
        }
      }
    };
  }
  
  private getDefaultFirestoreRules(): string {
    return `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        (hasRole('super_admin') || hasRole('company_admin'));
    }
    
    // Company documents
    match /companies/{companyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (hasRole('super_admin') || 
         (hasRole('company_admin') && request.auth.token.companyId == companyId));
    }
    
    // Job postings
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (hasRole('super_admin') || hasRole('company_admin') || hasRole('recruiter'));
    }
    
    // Job applications
    match /jobApplications/{applicationId} {
      allow read: if request.auth != null && 
        (resource.data.candidateId == request.auth.uid ||
         hasRole('super_admin') || hasRole('company_admin') || hasRole('recruiter'));
      allow create: if request.auth != null && request.auth.uid == resource.data.candidateId;
      allow update: if request.auth != null && 
        (hasRole('super_admin') || hasRole('company_admin') || hasRole('recruiter'));
    }
    
    // Candidate profiles
    match /candidateProfiles/{profileId} {
      allow read, write: if request.auth != null && request.auth.uid == profileId;
      allow read: if request.auth != null && 
        (hasRole('super_admin') || hasRole('company_admin') || hasRole('recruiter'));
    }
    
    // Helper function to check user roles
    function hasRole(role) {
      return request.auth != null && request.auth.token.role == role;
    }
    
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
    `.trim();
  }
  
  private getDefaultStorageRules(): string {
    return `
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
      allow read: if request.auth != null && 
        (request.auth.token.role == 'super_admin' || 
         request.auth.token.role == 'company_admin' || 
         request.auth.token.role == 'recruiter');
    }
    
    // Video intros - users can read/write their own
    match /video-intros/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        (request.auth.token.role == 'super_admin' || 
         request.auth.token.role == 'company_admin' || 
         request.auth.token.role == 'recruiter');
    }
    
    // Company logos - public read, company admin write
    match /company-logos/{companyId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'super_admin' || 
         (request.auth.token.role == 'company_admin' && 
          request.auth.token.companyId == companyId));
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
    
    // Default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
    `.trim();
  }
}

export const firebaseConfigService = FirebaseConfigService.getInstance();