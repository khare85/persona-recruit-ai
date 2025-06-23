export interface Company {
  id: string;
  name: string;
  domain: string;
  website?: string;
  logo?: string;
  description?: string;
  size: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';
  industry: string;
  location: string;
  founded?: number;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  settings: {
    allowPublicJobBoard: boolean;
    requireVideoIntro: boolean;
    autoRejectAfterDays?: number;
    customBranding?: {
      primaryColor?: string;
      logo?: string;
      banner?: string;
    };
  };
  subscription?: {
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'cancelled' | 'past_due';
    currentPeriodEnd?: Date;
    seats: number;
    usedSeats: number;
  };
  stats: {
    totalEmployees: number;
    activeJobs: number;
    totalApplications: number;
    totalHires: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID of super admin who created it
  deletedAt?: Date;
}

export interface CompanyInvitation {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'recruiter' | 'interviewer' | 'company_admin';
  department?: string;
  invitedBy: string; // User ID
  invitationToken: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  sentAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  createdUserId?: string; // User ID created from this invitation
}