

import admin from 'firebase-admin';
import { db } from './firestoreService';
import { User, CandidateProfile, RecruiterProfile, InterviewerProfile, CompanyAdmin } from '@/models/user.model';
import { Company, CompanyInvitation } from '@/models/company.model';
import { Job, JobApplication } from '@/models/job.model';
import { dbLogger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  CANDIDATE_PROFILES: 'candidateProfiles',
  INTERVIEWER_PROFILES: 'interviewerProfiles',
  COMPANIES: 'companies',
  COMPANY_INVITATIONS: 'companyInvitations',
  JOBS: 'jobs',
  JOB_APPLICATIONS: 'jobApplications',
  INTERVIEWS: 'interviews'
} as const;

// Database service class
class DatabaseService {
  private db = db;

  // Helper to ensure DB is available
  private ensureDb() {
    if (!this.db) {
      throw new Error('Firestore database not available. Check Firebase configuration.');
    }
  }

  // Generic helpers
  private async create<T>(collection: string, data: T, id?: string): Promise<string> {
    this.ensureDb();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    const docRef = id ? this.db!.collection(collection).doc(id) : this.db!.collection(collection).doc();
    
    await docRef.set({
      ...data,
      id: docRef.id, // Ensure the ID is part of the document data
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null // Explicitly set for soft delete support
    });

    return docRef.id;
  }

  private async update<T>(collection: string, id: string, data: Partial<T>): Promise<void> {
    this.ensureDb();
    await this.db!.collection(collection).doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  private async get<T>(collection: string, id: string): Promise<T | null> {
    this.ensureDb();
    const doc = await this.db!.collection(collection).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as T;
  }

  private async delete(collection: string, id: string, hard = false): Promise<void> {
    this.ensureDb();
    if (hard) {
      await this.db!.collection(collection).doc(id).delete();
    } else {
      await this.update(collection, id, { deletedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  }

  private async list<T>(
    collection: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: { field: string; direction: 'asc' | 'desc' };
      where?: { field: string; operator: any; value: any }[];
      includeDeleted?: boolean;
    }
  ): Promise<{ items: T[]; total: number; hasMore: boolean }> {
    this.ensureDb();
    let query: any = this.db!.collection(collection);

    // For companies, use a simpler query to avoid index requirements for now
    if (collection === COLLECTIONS.COMPANIES) {
      // Simple query without complex sorting
      if (!options?.includeDeleted) {
        query = query.where('deletedAt', '==', null);
      }
      
      // Apply simple pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const snapshot = await query.get();
      const items = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as T));

      return { 
        items, 
        total: items.length, // Simplified - in production use count query
        hasMore: false 
      };
    }

    // Original logic for other collections
    // Apply where conditions
    if (options?.where) {
      options.where.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
    }

    // Exclude soft deleted by default
    if (!options?.includeDeleted) {
      query = query.where('deletedAt', '==', null);
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction);
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    // Get total count for pagination
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    // Apply pagination
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    const items = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as T));

    const hasMore = options?.limit ? items.length === options.limit : false;

    return { items, total, hasMore };
  }

  // User Management
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const plainPassword = userData.passwordHash; // Misnamed in seeding, this is the plain password
      
      // 1. Create user in Firebase Authentication
      let authUser;
      try {
        authUser = await admin.auth().createUser({
          email: userData.email,
          password: plainPassword,
          displayName: `${userData.firstName} ${userData.lastName}`,
          emailVerified: userData.emailVerified || false,
        });
        dbLogger.info('User created in Firebase Auth', { uid: authUser.uid, email: userData.email });
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-exists') {
          dbLogger.warn('User already exists in Firebase Auth, fetching existing user.', { email: userData.email });
          authUser = await admin.auth().getUserByEmail(userData.email);
        } else {
          dbLogger.error('Error creating user in Firebase Auth', { error: String(authError), email: userData.email });
          throw authError;
        }
      }

      // 2. Create user document in Firestore (for custom login and roles)
      const passwordHash = await bcrypt.hash(plainPassword, 12);
      
      const userFirestoreData = {
        ...userData,
        passwordHash,
        emailVerified: authUser.emailVerified,
        status: 'active' as const,
      };
      
      // Use the UID from Firebase Auth as the document ID in Firestore for consistency
      const userId = authUser.uid;
      await this.db.collection(COLLECTIONS.USERS).doc(userId).set({
        ...userFirestoreData,
        id: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      dbLogger.info('User document created in Firestore', { userId, email: userData.email, role: userData.role });
      return userId;
    } catch (error) {
      dbLogger.error('Error in createUser database service', { error: String(error), email: userData.email });
      throw error;
    }
  }


  async getUserById(id: string): Promise<User | null> {
    return this.get<User>(COLLECTIONS.USERS, id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    this.ensureDb();
    const snapshot = await this.db!.collection(COLLECTIONS.USERS)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    // Filter out deleted users in code instead of query
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      if (!userData.deletedAt) {
        return { id: doc.id, ...userData } as User;
      }
    }
    
    return null;
  }

  async getUserByResetToken(resetToken: string): Promise<User | null> {
    this.ensureDb();
    const snapshot = await this.db!.collection(COLLECTIONS.USERS)
      .where('resetToken', '==', resetToken)
      .where('deletedAt', '==', null)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    if (data.passwordHash) {
      data.passwordHash = await bcrypt.hash(data.passwordHash, 12);
    }
    return this.update(COLLECTIONS.USERS, id, data);
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete(COLLECTIONS.USERS, id);
  }

  async updateUserLastLogin(id: string): Promise<void> {
    try {
      await this.update(COLLECTIONS.USERS, id, {
        lastLogin: new Date()
      });
      dbLogger.info('User last login updated', { userId: id });
    } catch (error) {
      dbLogger.error('Error updating user last login', { error: String(error), userId: id });
      // Don't throw here as login should succeed even if this fails
    }
  }

  async listUsers(options?: {
    limit?: number;
    offset?: number;
    role?: string;
    status?: string;
    companyId?: string;
  }): Promise<{ items: User[]; total: number; hasMore: boolean }> {
    const where: any[] = [];
    
    if (options?.role) {
      where.push({ field: 'role', operator: '==', value: options.role });
    }
    if (options?.status) {
      where.push({ field: 'status', operator: '==', value: options.status });
    }

    return this.list<User>(COLLECTIONS.USERS, {
      limit: options?.limit,
      offset: options?.offset,
      where,
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  // Candidate Profile Management
  async createCandidateProfile(profile: Omit<CandidateProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await this.create(COLLECTIONS.CANDIDATE_PROFILES, profile, profile.userId);
      dbLogger.info('Candidate profile created', { userId: profile.userId });
    } catch (error) {
      dbLogger.error('Error creating candidate profile', { error: String(error), userId: profile.userId });
      throw error;
    }
  }

  async getCandidateProfile(userId: string): Promise<CandidateProfile | null> {
    return this.get<CandidateProfile>(COLLECTIONS.CANDIDATE_PROFILES, userId);
  }

  async updateCandidateProfile(userId: string, data: Partial<CandidateProfile>): Promise<void> {
    return this.update(COLLECTIONS.CANDIDATE_PROFILES, userId, data);
  }

  // Interviewer Profile Management
  async createInterviewerProfile(profile: Omit<InterviewerProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await this.create(COLLECTIONS.INTERVIEWER_PROFILES, profile, profile.userId);
      dbLogger.info('Interviewer profile created', { userId: profile.userId });
    } catch (error) {
      dbLogger.error('Error creating interviewer profile', { error: String(error), userId: profile.userId });
      throw error;
    }
  }

  // Company Management
  async createCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<string> {
    try {
      const companyData = {
        ...company,
        stats: {
          totalEmployees: 0,
          activeJobs: 0,
          totalApplications: 0,
          totalHires: 0
        }
      };

      const companyId = await this.create(COLLECTIONS.COMPANIES, companyData);
      dbLogger.info('Company created', { companyId, name: company.name });
      return companyId;
    } catch (error) {
      dbLogger.error('Error creating company', { error: String(error), name: company.name });
      throw error;
    }
  }
  
  async getCompanyAdmins(companyId: string): Promise<User[]> {
    this.ensureDb();
    const snapshot = await this.db!.collection(COLLECTIONS.USERS)
        .where('companyId', '==', companyId)
        .where('role', '==', 'company_admin')
        .where('deletedAt', '==', null)
        .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  async getCompanyRecruiters(companyId: string): Promise<User[]> {
    this.ensureDb();
    const snapshot = await this.db!.collection(COLLECTIONS.USERS)
        .where('companyId', '==', companyId)
        .where('role', '==', 'recruiter')
        .where('deletedAt', '==', null)
        .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  async getCompanyById(id: string): Promise<Company | null> {
    return this.get<Company>(COLLECTIONS.COMPANIES, id);
  }

  async updateCompany(id: string, data: Partial<Company>): Promise<void> {
    return this.update(COLLECTIONS.COMPANIES, id, data);
  }

  async deleteCompany(id: string): Promise<void> {
    return this.delete(COLLECTIONS.COMPANIES, id);
  }

  async listCompanies(options?: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
  }): Promise<{ items: Company[]; total: number; hasMore: boolean }> {
    const where: any[] = [];
    
    if (options?.status) {
      where.push({ field: 'status', operator: '==', value: options.status });
    }

    return this.list<Company>(COLLECTIONS.COMPANIES, {
      limit: options?.limit,
      offset: options?.offset,
      where,
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async getCompanyByDomain(domain: string): Promise<Company | null> {
    this.ensureDb();
    const snapshot = await this.db!.collection(COLLECTIONS.COMPANIES)
      .where('domain', '==', domain)
      .where('deletedAt', '==', null)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Company;
  }

  async getCompanyUserCount(companyId: string): Promise<number> {
    this.ensureDb();
    const snapshot = await this.db!.collection(COLLECTIONS.USERS)
      .where('companyId', '==', companyId)
      .where('deletedAt', '==', null)
      .count()
      .get();
    
    return snapshot.data().count;
  }

  async getCompanyActiveJobsCount(companyId: string): Promise<number> {
    this.ensureDb();
    const snapshot = await this.db!.collection(COLLECTIONS.JOBS)
      .where('companyId', '==', companyId)
      .where('status', '==', 'active')
      .where('deletedAt', '==', null)
      .count()
      .get();
    
    return snapshot.data().count;
  }

  // Company Invitation Management
  async createCompanyInvitation(invitation: Omit<CompanyInvitation, 'id' | 'sentAt'>): Promise<string> {
    try {
      const invitationData = {
        ...invitation,
        sentAt: new Date()
      };

      const invitationId = await this.create(COLLECTIONS.COMPANY_INVITATIONS, invitationData);
      dbLogger.info('Company invitation created', { invitationId, email: invitation.email, companyId: invitation.companyId });
      return invitationId;
    } catch (error) {
      dbLogger.error('Error creating company invitation', { error: String(error), email: invitation.email });
      throw error;
    }
  }

  async getInvitationByToken(token: string): Promise<CompanyInvitation | null> {
    this.ensureDb();
    const snapshot = await this.db!.collection(COLLECTIONS.COMPANY_INVITATIONS)
      .where('invitationToken', '==', token)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as CompanyInvitation;
  }

  async updateInvitation(id: string, data: Partial<CompanyInvitation>): Promise<void> {
    return this.update(COLLECTIONS.COMPANY_INVITATIONS, id, data);
  }

  async getCompanyInvitations(companyId: string, status?: string): Promise<CompanyInvitation[]> {
    this.ensureDb();
    let query: any = this.db!.collection(COLLECTIONS.COMPANY_INVITATIONS)
      .where('companyId', '==', companyId);
    
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('sentAt', 'desc').get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as CompanyInvitation));
  }

  // Job Management
  async createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<string> {
    try {
      const jobData = {
        ...job,
        stats: {
          views: 0,
          applications: 0,
          interviews: 0,
          offers: 0
        }
      };

      const jobId = await this.create(COLLECTIONS.JOBS, jobData);
      dbLogger.info('Job created', { jobId, title: job.title, companyId: job.companyId });
      return jobId;
    } catch (error) {
      dbLogger.error('Error creating job', { error: String(error), title: job.title });
      throw error;
    }
  }

  async getJobById(id: string): Promise<Job | null> {
    return this.get<Job>(COLLECTIONS.JOBS, id);
  }
  
  async getRecentJobs(limit: number): Promise<Job[]> {
    const { items } = await this.list<Job>(COLLECTIONS.JOBS, { limit, orderBy: { field: 'publishedAt', direction: 'desc' } });
    return items;
  }


  async updateJob(id: string, data: Partial<Job>): Promise<void> {
    return this.update(COLLECTIONS.JOBS, id, data);
  }

  async listJobs(options?: {
    limit?: number;
    offset?: number;
    companyId?: string;
    status?: string;
    recruiterId?: string;
  }): Promise<{ items: Job[]; total: number; hasMore: boolean }> {
    const where: any[] = [];
    
    if (options?.companyId) {
      where.push({ field: 'companyId', operator: '==', value: options.companyId });
    }
    if (options?.status) {
      where.push({ field: 'status', operator: '==', value: options.status });
    }
    if (options?.recruiterId) {
      where.push({ field: 'recruiterId', operator: '==', value: options.recruiterId });
    }

    return this.list<Job>(COLLECTIONS.JOBS, {
      limit: options?.limit,
      offset: options?.offset,
      where,
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  // Job Application Management
  async createJobApplication(application: Omit<JobApplication, 'id' | 'appliedAt' | 'lastActivityAt' | 'timeline'>): Promise<string> {
    try {
      const now = new Date();
      const applicationData = {
        ...application,
        appliedAt: now,
        lastActivityAt: now,
        timeline: [{
          event: 'Application submitted',
          timestamp: now,
          userId: application.candidateId
        }]
      };

      const applicationId = await this.create(COLLECTIONS.JOB_APPLICATIONS, applicationData);
      dbLogger.info('Job application created', { 
        applicationId, 
        jobId: application.jobId, 
        candidateId: application.candidateId 
      });
      return applicationId;
    } catch (error) {
      dbLogger.error('Error creating job application', { 
        error: String(error), 
        jobId: application.jobId,
        candidateId: application.candidateId 
      });
      throw error;
    }
  }

  async getApplicationById(id: string): Promise<JobApplication | null> {
    return this.get<JobApplication>(COLLECTIONS.JOB_APPLICATIONS, id);
  }

  async updateJobApplication(id: string, data: Partial<JobApplication>): Promise<void> {
    // Update lastActivityAt when application is modified
    const updateData = {
      ...data,
      lastActivityAt: new Date()
    };
    return this.update(COLLECTIONS.JOB_APPLICATIONS, id, updateData);
  }

  async getCandidateApplications(candidateId: string): Promise<JobApplication[]> {
    this.ensureDb();
    const snapshot = await this.db!.collection(COLLECTIONS.JOB_APPLICATIONS)
      .where('candidateId', '==', candidateId)
      .where('deletedAt', '==', null)
      .orderBy('appliedAt', 'desc')
      .get();
    
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as JobApplication));
  }

  async getJobApplications(jobId: string, status?: string): Promise<JobApplication[]> {
    this.ensureDb();
    let query: any = this.db!.collection(COLLECTIONS.JOB_APPLICATIONS)
      .where('jobId', '==', jobId)
      .where('deletedAt', '==', null);
    
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('appliedAt', 'desc').get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as JobApplication));
  }

  async checkExistingApplication(jobId: string, candidateId: string): Promise<JobApplication | null> {
    this.ensureDb();
    const snapshot = await this.db!.collection(COLLECTIONS.JOB_APPLICATIONS)
      .where('jobId', '==', jobId)
      .where('candidateId', '==', candidateId)
      .where('deletedAt', '==', null)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as JobApplication;
  }

  async getCompanyApplications(options: { companyId: string; status?: string; limit?: number }): Promise<JobApplication[]> {
    this.ensureDb();
    
    // First get all jobs for the company
    const jobsSnapshot = await this.db!.collection(COLLECTIONS.JOBS)
      .where('companyId', '==', options.companyId)
      .where('deletedAt', '==', null)
      .get();
    
    if (jobsSnapshot.empty) return [];
    
    const jobIds = jobsSnapshot.docs.map(doc => doc.id);
    
    // For simplicity, get all applications and filter client-side
    // In production, you'd want to optimize this with proper indexing
    const applicationsSnapshot = await this.db!.collection(COLLECTIONS.JOB_APPLICATIONS)
      .where('deletedAt', '==', null)
      .limit(options.limit || 1000)
      .get();
    
    let applications = applicationsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as JobApplication));
    
    // Filter by company jobs
    applications = applications.filter(app => jobIds.includes(app.jobId));
    
    // Filter by status if provided
    if (options.status) {
      applications = applications.filter(app => app.status === options.status);
    }
    
    return applications;
  }

  // Utility methods
  async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async generatePasswordHash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Interview management
  async createInterview(interviewData: any): Promise<any> {
    return this.create(COLLECTIONS.INTERVIEWS, interviewData);
  }

  async getInterviewById(id: string): Promise<any> {
    return this.get(COLLECTIONS.INTERVIEWS, id);
  }

  async updateInterview(id: string, data: any): Promise<void> {
    return this.update(COLLECTIONS.INTERVIEWS, id, data);
  }

  async getInterviews(filters: any = {}): Promise<any[]> {
    // Implementation would depend on your specific filtering needs
    this.ensureDb();
    let query = this.db!.collection(COLLECTIONS.INTERVIEWS)
      .where('deletedAt', '==', null);
    
    // Add filters as needed
    if (filters.startDate) {
      query = query.where('scheduledFor', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('scheduledFor', '<=', filters.endDate);
    }
    if (filters.candidateId) {
      query = query.where('candidateId', '==', filters.candidateId);
    }
    if (filters.interviewerId) {
      query = query.where('interviewerId', '==', filters.interviewerId);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.companyId) {
      query = query.where('companyId', '==', filters.companyId);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getInterviewsByInterviewer(interviewerId: string, filters: any = {}): Promise<any[]> {
    return this.getInterviews({ ...filters, interviewerId });
  }

  async getInterviewerSchedule(interviewerId: string, startTime: Date, endTime: Date, excludeInterviewId?: string): Promise<any[]> {
    this.ensureDb();
    let query = this.db!.collection(COLLECTIONS.INTERVIEWS)
      .where('interviewerId', '==', interviewerId)
      .where('scheduledFor', '>=', startTime.toISOString())
      .where('scheduledFor', '<=', endTime.toISOString())
      .where('status', 'in', ['scheduled', 'confirmed', 'rescheduled']);
    
    const snapshot = await query.get();
    let interviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (excludeInterviewId) {
      interviews = interviews.filter(interview => interview.id !== excludeInterviewId);
    }
    
    return interviews;
  }

  async getJobApplicationByCandidate(jobId: string, candidateId: string): Promise<any> {
    this.ensureDb();
    const snapshot = await this.db!.collection(COLLECTIONS.JOB_APPLICATIONS)
      .where('jobId', '==', jobId)
      .where('candidateId', '==', candidateId)
      .where('deletedAt', '==', null)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async getJobApplicationById(id: string): Promise<any> {
    return this.get(COLLECTIONS.JOB_APPLICATIONS, id);
  }

  async getJobApplications(filters: {
    companyId?: string;
    jobId?: string;
    status?: string;
    department?: string;
    minScore?: number;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    this.ensureDb();
    let query = this.db!.collection(COLLECTIONS.JOB_APPLICATIONS)
      .where('deletedAt', '==', null);
    
    if (filters.companyId) {
      query = query.where('companyId', '==', filters.companyId);
    }
    if (filters.jobId) {
      query = query.where('jobId', '==', filters.jobId);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.minScore) {
      query = query.where('aiMatchScore', '>=', filters.minScore);
    }
    
    query = query.orderBy('appliedAt', 'desc');
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async createAuditLog(logData: {
    userId: string;
    action: string;
    resourceType: string;
    resourceIds: string[];
    details: any;
    timestamp: string;
  }): Promise<void> {
    try {
      await this.create('auditLogs', logData);
    } catch (error) {
      dbLogger.error('Failed to create audit log', { error: String(error), userId: logData.userId });
    }
  }

  // Analytics methods
  async getCompanyAnalytics(companyId: string): Promise<any> {
    this.ensureDb();
    
    const [
      jobsSnapshot,
      applicationsSnapshot,
      interviewsSnapshot,
      usersSnapshot
    ] = await Promise.all([
      this.db!.collection(COLLECTIONS.JOBS)
        .where('companyId', '==', companyId)
        .where('deletedAt', '==', null)
        .get(),
      this.db!.collection(COLLECTIONS.JOB_APPLICATIONS)
        .where('companyId', '==', companyId)
        .where('deletedAt', '==', null)
        .get(),
      this.db!.collection(COLLECTIONS.INTERVIEWS)
        .where('companyId', '==', companyId)
        .get(),
      this.db!.collection(COLLECTIONS.USERS)
        .where('companyId', '==', companyId)
        .where('deletedAt', '==', null)
        .get()
    ]);

    const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const applications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const interviews = interviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate metrics
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const totalInterviews = interviews.length;
    const scheduledInterviews = interviews.filter(int => int.status === 'scheduled').length;
    const totalHires = applications.filter(app => app.status === 'hired').length;
    const recruiters = users.filter(user => user.role === 'recruiter').length;

    // Application status breakdown
    const applicationsByStatus = applications.reduce((acc: any, app: any) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    // Applications by month (last 12 months)
    const now = new Date();
    const monthlyApplications = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthApps = applications.filter(app => {
        const appDate = new Date(app.appliedAt);
        return appDate >= monthStart && appDate <= monthEnd;
      });
      monthlyApplications.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: monthApps.length
      });
    }

    // Top jobs by applications
    const jobApplicationCounts = applications.reduce((acc: any, app: any) => {
      acc[app.jobId] = (acc[app.jobId] || 0) + 1;
      return acc;
    }, {});

    const topJobs = Object.entries(jobApplicationCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([jobId, count]) => {
        const job = jobs.find(j => j.id === jobId);
        return {
          jobId,
          title: job?.title || 'Unknown',
          department: job?.department || 'Unknown',
          applications: count
        };
      });

    return {
      overview: {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        totalInterviews,
        scheduledInterviews,
        totalHires,
        recruiters
      },
      applicationsByStatus,
      monthlyApplications,
      topJobs,
      averageMatchScore: applications.length > 0 
        ? Math.round(applications.reduce((sum: number, app: any) => sum + (app.aiMatchScore || 0), 0) / applications.length)
        : 0
    };
  }

  async getSystemAnalytics(): Promise<any> {
    this.ensureDb();
    
    const [
      companiesSnapshot,
      usersSnapshot,
      jobsSnapshot,
      applicationsSnapshot,
      interviewsSnapshot
    ] = await Promise.all([
      this.db!.collection(COLLECTIONS.COMPANIES)
        .where('deletedAt', '==', null)
        .get(),
      this.db!.collection(COLLECTIONS.USERS)
        .where('deletedAt', '==', null)
        .get(),
      this.db!.collection(COLLECTIONS.JOBS)
        .where('deletedAt', '==', null)
        .get(),
      this.db!.collection(COLLECTIONS.JOB_APPLICATIONS)
        .where('deletedAt', '==', null)
        .get(),
      this.db!.collection(COLLECTIONS.INTERVIEWS)
        .get()
    ]);

    const companies = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const applications = applicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const interviews = interviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate system-wide metrics
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.status === 'active').length;
    const totalUsers = users.length;
    const candidateCount = users.filter(u => u.role === 'candidate').length;
    const recruiterCount = users.filter(u => u.role === 'recruiter').length;
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const totalApplications = applications.length;
    const totalInterviews = interviews.length;
    const totalHires = applications.filter(app => app.status === 'hired').length;

    // User registration trends (last 12 months)
    const now = new Date();
    const monthlyRegistrations = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthUsers = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate >= monthStart && userDate <= monthEnd;
      });
      monthlyRegistrations.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: monthUsers.length
      });
    }

    // Top companies by activity
    const companyActivity = companies.map(company => {
      const companyJobs = jobs.filter(j => j.companyId === company.id).length;
      const companyApplications = applications.filter(a => a.companyId === company.id).length;
      return {
        id: company.id,
        name: company.name,
        jobs: companyJobs,
        applications: companyApplications,
        activity: companyJobs + companyApplications
      };
    }).sort((a, b) => b.activity - a.activity).slice(0, 10);

    return {
      overview: {
        totalCompanies,
        activeCompanies,
        totalUsers,
        candidateCount,
        recruiterCount,
        totalJobs,
        activeJobs,
        totalApplications,
        totalInterviews,
        totalHires
      },
      monthlyRegistrations,
      topCompanies: companyActivity,
      platformGrowth: {
        companiesGrowthRate: 12.5, // Placeholder - would calculate from historical data
        usersGrowthRate: 18.3,
        applicationsGrowthRate: 25.7
      }
    };
  }
}

export const databaseService = new DatabaseService();
export default databaseService;

    