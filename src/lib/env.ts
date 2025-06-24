/**
 * Environment configuration and validation
 * Centralizes all environment variables with proper typing and validation
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // App Configuration
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  
  // Google AI & Firebase
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  GOOGLE_CLOUD_PROJECT: z.string().min(1).optional(),
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  
  // Database
  DATABASE_URL: z.string().url().optional(),
  
  // Security
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_MAX: z.string().transform(val => parseInt(val, 10)).default('100'),
  
  // External Services
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  
  // URLs
  PRODUCTION_URL: z.string().url().optional(),
  CDN_URL: z.string().url().optional(),
  
  // Analytics
  ANALYTICS_ID: z.string().optional(),
});

// Parse and validate environment variables
function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Environment validation failed');
  }
}

// Export the validated environment variables
export const env = parseEnv();

// Environment helper functions
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

// AI Configuration helper
export const getAIConfig = () => {
  if (isDevelopment) {
    // In development, AI features might work with mock data even without API keys
    return {
      hasGoogleAI: !!env.GOOGLE_AI_API_KEY,
      hasFirebase: !!(env.FIREBASE_PROJECT_ID && env.GOOGLE_CLOUD_PROJECT),
      mockMode: !env.GOOGLE_AI_API_KEY
    };
  }
  
  // In production, require all AI services
  if (!env.GOOGLE_AI_API_KEY || !env.FIREBASE_PROJECT_ID) {
    throw new Error('Missing required AI configuration for production');
  }
  
  return {
    hasGoogleAI: true,
    hasFirebase: true,
    mockMode: false
  };
};

// Database helper
export const getDatabaseConfig = () => {
  return {
    hasDatabase: !!env.DATABASE_URL,
    url: env.DATABASE_URL
  };
};

// Security helpers
export const getSecurityConfig = () => {
  return {
    corsOrigins: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    rateLimit: env.RATE_LIMIT_MAX,
    hasAuth: !!env.NEXTAUTH_SECRET
  };
};

// Logging helper for environment status
export const logEnvironmentStatus = () => {
  console.log('🔧 Environment Configuration:');
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  AI Services: ${getAIConfig().hasGoogleAI ? '✅' : '❌'} Google AI, ${getAIConfig().hasFirebase ? '✅' : '❌'} Firebase`);
  console.log(`  Database: ${getDatabaseConfig().hasDatabase ? '✅' : '❌'}`);
  console.log(`  Authentication: ${getSecurityConfig().hasAuth ? '✅' : '❌'}`);
  
  if (getAIConfig().mockMode) {
    console.log('⚠️  Running in MOCK MODE - AI features will use placeholder data');
  }
};