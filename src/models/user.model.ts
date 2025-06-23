export interface BaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'candidate' | 'recruiter' | 'interviewer' | 'company_admin' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordHash: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  deletedAt?: Date;
}

export interface CandidateProfile {
  userId: string;
  currentTitle: string;
  experience: 'Entry Level' | '1-2 years' | '3-5 years' | '5-10 years' | '10+ years';
  location: string;
  skills: string[];
  summary: string;
  phone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  videoIntroUrl?: string;
  videoIntroThumbnail?: string;
  videoIntroDuration?: number;
  videoIntroUploadedAt?: Date;
  profileComplete: boolean;
  availableForWork: boolean;
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
  };
  willingToRelocate: boolean;
  preferredLocations?: string[];
  preferredJobTypes?: string[];
}

export interface RecruiterProfile {
  userId: string;
  companyId: string;
  department?: string;
  title: string;
  bio?: string;
  specializations?: string[];
  activeJobPostings: number;
  totalHires: number;
}

export interface InterviewerProfile {
  userId: string;
  companyId: string;
  department?: string;
  title: string;
  expertise: string[];
  interviewTypes: string[];
  availability?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  totalInterviews: number;
  averageRating?: number;
}

export interface CompanyAdmin {
  userId: string;
  companyId: string;
  permissions: string[];
  department?: string;
  title: string;
}

export interface User extends BaseUser {
  profile?: CandidateProfile | RecruiterProfile | InterviewerProfile | CompanyAdmin;
}

// Type guards
export function isCandidateProfile(profile: any): profile is CandidateProfile {
  return profile && 'currentTitle' in profile && 'skills' in profile;
}

export function isRecruiterProfile(profile: any): profile is RecruiterProfile {
  return profile && 'companyId' in profile && 'activeJobPostings' in profile;
}

export function isInterviewerProfile(profile: any): profile is InterviewerProfile {
  return profile && 'companyId' in profile && 'expertise' in profile;
}

export function isCompanyAdmin(profile: any): profile is CompanyAdmin {
  return profile && 'companyId' in profile && 'permissions' in profile;
}