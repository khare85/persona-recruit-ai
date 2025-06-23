export interface Job {
  id: string;
  companyId: string;
  recruiterId: string;
  title: string;
  department?: string;
  location: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: 'yearly' | 'monthly' | 'hourly';
  };
  description: string;
  responsibilities: string[];
  qualifications: string[];
  mustHaveRequirements: string[];
  niceToHaveRequirements?: string[];
  skills: string[];
  benefits: string[];
  quickApplyEnabled: boolean;
  status: 'draft' | 'active' | 'paused' | 'closed' | 'archived';
  applicationDeadline?: Date;
  startDate?: Date;
  stats: {
    views: number;
    applications: number;
    interviews: number;
    offers: number;
  };
  aiGenerated?: {
    generatedAt: Date;
    prompt: string;
    model: string;
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  closedAt?: Date;
  deletedAt?: Date;
  
  // Denormalized fields for performance
  companyName?: string;
  companyLogo?: string;
  recruiterName?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  candidateId: string;
  companyId: string;
  recruiterId?: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'interview_scheduled' | 'rejected' | 'withdrawn' | 'hired';
  applicationMethod: 'quick_apply' | 'full_application';
  coverLetter?: string;
  coverNote?: string; // For quick apply
  resumeUrl?: string;
  videoIntroUrl?: string;
  videoIntroIncluded: boolean;
  expectedSalary?: {
    min: number;
    max: number;
    currency: string;
  };
  availableFrom?: Date;
  willingToRelocate?: boolean;
  answers?: { // Custom screening questions
    questionId: string;
    question: string;
    answer: string;
  }[];
  matchScore?: {
    overall: number;
    mustHaveScore: number;
    skillsScore: number;
    experienceScore: number;
    breakdown?: any;
  };
  timeline: {
    event: string;
    timestamp: Date;
    userId?: string;
    notes?: string;
  }[];
  rejectionReason?: string;
  withdrawalReason?: string;
  appliedAt: Date;
  lastActivityAt: Date;
  
  // Denormalized fields for performance
  jobTitle?: string;
  companyName?: string;
  candidateName?: string;
  candidateEmail?: string;
}