import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Comprehensive validation schemas for all API endpoints
 */

// Base validation schemas
export const emailSchema = z.string().email().min(3).max(254);
export const passwordSchema = z.string().min(8).max(128)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)\.]{10,20}$/, 'Invalid phone number format');
export const urlSchema = z.string().url().max(2048);
export const mongoIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

// File validation schemas
export const imageFileSchema = z.object({
  type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().max(5 * 1024 * 1024), // 5MB
  name: z.string().max(255)
});

export const documentFileSchema = z.object({
  type: z.enum(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  size: z.number().max(10 * 1024 * 1024), // 10MB
  name: z.string().max(255)
});

// User schemas
export const userRegistrationSchema = z.object({
  fullName: z.string().min(2).max(100).transform(sanitizeString),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['candidate', 'recruiter', 'company_admin']),
  companyName: z.string().min(2).max(200).optional().transform(val => val ? sanitizeString(val) : val),
  phone: phoneSchema.optional(),
  acceptedTerms: z.boolean().refine(val => val === true, 'Terms must be accepted')
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const userProfileUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional().transform(val => val ? sanitizeString(val) : val),
  phone: phoneSchema.optional(),
  location: z.string().min(2).max(100).optional().transform(val => val ? sanitizeString(val) : val),
  timezone: z.string().max(50).optional(),
  title: z.string().min(2).max(200).optional().transform(val => val ? sanitizeString(val) : val),
  bio: z.string().max(2000).optional().transform(val => val ? sanitizeString(val) : val),
  linkedinProfile: urlSchema.optional(),
  portfolioUrl: urlSchema.optional(),
  githubProfile: urlSchema.optional(),
  preferences: z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().max(10).optional(),
    dateFormat: z.string().max(20).optional(),
    timeFormat: z.enum(['12h', '24h']).optional()
  }).optional()
});

// Candidate schemas
export const candidateCreateSchema = z.object({
  fullName: z.string().min(2).max(100).transform(sanitizeString),
  email: emailSchema,
  phone: phoneSchema.optional(),
  currentTitle: z.string().min(2).max(200).transform(sanitizeString),
  location: z.string().min(2).max(100).transform(sanitizeString),
  experience: z.string().min(1).max(50).transform(sanitizeString),
  skills: z.array(z.string().min(1).max(50).transform(sanitizeString)).min(1).max(30),
  summary: z.string().min(50).max(2000).transform(sanitizeString),
  resumeUrl: urlSchema.optional(),
  portfolioUrl: urlSchema.optional(),
  linkedinProfile: urlSchema.optional(),
  availability: z.string().min(1).max(100).transform(sanitizeString),
  salaryExpectation: z.string().max(100).optional().transform(val => val ? sanitizeString(val) : val),
  isOpenToRemote: z.boolean().default(false)
});

export const candidateUpdateSchema = candidateCreateSchema.partial().extend({
  status: z.enum(['Active', 'Inactive', 'Hired', 'Not Looking']).optional()
});

// Job schemas
export const jobCreateSchema = z.object({
  title: z.string().min(2).max(200).transform(sanitizeString),
  location: z.string().min(2).max(100).transform(sanitizeString),
  type: z.enum(['Full-time', 'Part-time', 'Contract', 'Remote']),
  department: z.string().min(2).max(50).transform(sanitizeString),
  experience: z.string().min(1).max(100).transform(sanitizeString),
  salary: z.string().max(100).optional().transform(val => val ? sanitizeString(val) : val),
  description: z.string().min(50).max(5000).transform(sanitizeString),
  requirements: z.array(z.string().min(1).max(200).transform(sanitizeString)).min(1).max(20),
  mustHaveRequirements: z.array(z.string().min(1).max(200).transform(sanitizeString)).min(1).max(10),
  benefits: z.array(z.string().min(1).max(200).transform(sanitizeString)).min(1).max(20),
  skills: z.array(z.string().min(1).max(50).transform(sanitizeString)).min(1).max(30),
  responsibilities: z.array(z.string().min(1).max(300).transform(sanitizeString)).optional(),
  isRemote: z.boolean().default(false),
  urgency: z.enum(['Low', 'Medium', 'High']).default('Medium')
});

export const jobUpdateSchema = jobCreateSchema.partial().extend({
  status: z.enum(['Active', 'Closed', 'Draft']).optional()
});

// Application schemas
export const applicationCreateSchema = z.object({
  jobId: z.string().min(1),
  candidateId: z.string().min(1),
  coverLetter: z.string().max(2000).optional().transform(val => val ? sanitizeString(val) : val),
  resumeUrl: urlSchema.optional(),
  expectedSalary: z.string().max(100).optional().transform(val => val ? sanitizeString(val) : val),
  availableStartDate: z.string().datetime().optional(),
  additionalNotes: z.string().max(1000).optional().transform(val => val ? sanitizeString(val) : val)
});

export const applicationUpdateSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected']),
  notes: z.string().max(2000).optional().transform(val => val ? sanitizeString(val) : val),
  rejectionReason: z.string().max(500).optional().transform(val => val ? sanitizeString(val) : val)
});

// Interview schemas
export const interviewCreateSchema = z.object({
  applicationId: z.string().min(1),
  candidateId: z.string().min(1),
  jobId: z.string().min(1),
  interviewerId: z.string().min(1),
  scheduledDate: z.string().datetime(),
  duration: z.number().min(15).max(240).default(60), // 15 minutes to 4 hours
  type: z.enum(['phone', 'video', 'in-person', 'technical', 'behavioral']),
  location: z.string().max(200).optional().transform(val => val ? sanitizeString(val) : val),
  notes: z.string().max(1000).optional().transform(val => val ? sanitizeString(val) : val),
  meetingLink: urlSchema.optional()
});

export const interviewUpdateSchema = z.object({
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled', 'rescheduled']),
  actualStartTime: z.string().datetime().optional(),
  actualEndTime: z.string().datetime().optional(),
  notes: z.string().max(2000).optional().transform(val => val ? sanitizeString(val) : val),
  recordingUrl: urlSchema.optional()
});

export const interviewFeedbackSchema = z.object({
  overallRating: z.number().min(1).max(5),
  recommendation: z.enum(['Hire', 'No Hire', 'Maybe', 'Strong Hire']),
  technicalSkills: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
  problemSolving: z.number().min(1).max(5).optional(),
  culturalFit: z.number().min(1).max(5).optional(),
  leadership: z.number().min(1).max(5).optional(),
  strengths: z.string().max(1000).optional().transform(val => val ? sanitizeString(val) : val),
  weaknesses: z.string().max(1000).optional().transform(val => val ? sanitizeString(val) : val),
  detailedFeedback: z.string().max(5000).optional().transform(val => val ? sanitizeString(val) : val),
  questionsAsked: z.array(z.string().max(500).transform(sanitizeString)).max(20),
  confidenceLevel: z.number().min(1).max(5).optional(),
  additionalNotes: z.string().max(2000).optional().transform(val => val ? sanitizeString(val) : val)
});

// Company schemas
export const companyCreateSchema = z.object({
  name: z.string().min(2).max(200).transform(sanitizeString),
  domain: z.string().min(2).max(100).transform(sanitizeString),
  size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']),
  industry: z.string().min(2).max(100).transform(sanitizeString),
  description: z.string().max(2000).optional().transform(val => val ? sanitizeString(val) : val),
  website: urlSchema.optional(),
  location: z.string().min(2).max(200).transform(sanitizeString),
  founded: z.number().min(1800).max(new Date().getFullYear()).optional()
});

export const companyUpdateSchema = companyCreateSchema.partial();

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1).default(1)),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100).default(20)),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200).transform(sanitizeString).optional(),
  skills: z.string().transform(val => val ? val.split(',').map(s => sanitizeString(s.trim())) : []).optional(),
  location: z.string().max(100).transform(sanitizeString).optional(),
  experience: z.string().max(50).transform(sanitizeString).optional(),
  availability: z.string().max(100).transform(sanitizeString).optional(),
  salaryMin: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  salaryMax: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  remote: z.string().transform(val => val === 'true').optional()
});

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters and normalize whitespace
  return DOMPurify.sanitize(input.trim(), { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  type: 'image' | 'document' | 'resume'
): { isValid: boolean; error?: string } {
  try {
    const maxSizes = {
      image: 5 * 1024 * 1024, // 5MB
      document: 10 * 1024 * 1024, // 10MB
      resume: 10 * 1024 * 1024 // 10MB
    };

    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/webp'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    if (file.size > maxSizes[type]) {
      return {
        isValid: false,
        error: `File size must be less than ${maxSizes[type] / (1024 * 1024)}MB`
      };
    }

    if (!allowedTypes[type].includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed for ${type} uploads`
      };
    }

    // Check for potentially malicious file extensions
    const extension = file.name.split('.').pop()?.toLowerCase();
    const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'com', 'pif', 'vbs', 'js', 'jar'];
    
    if (extension && dangerousExtensions.includes(extension)) {
      return {
        isValid: false,
        error: 'File type not allowed for security reasons'
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'File validation failed'
    };
  }
}

/**
 * Rate limiting validation
 */
export const rateLimitConfig = {
  // Requests per minute by endpoint type
  auth: 5,        // Login/signup attempts
  upload: 10,     // File uploads
  search: 30,     // Search requests
  api: 100,       // General API requests
  ai: 20          // AI-powered requests
};

/**
 * IP address validation and sanitization
 */
export function validateAndSanitizeIP(ip: string): string | null {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (ipRegex.test(ip) || ipv6Regex.test(ip)) {
    return ip;
  }
  
  return null;
}