
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
      useCollectionGroup?: boolean;
    }
  ): Promise<{ items: T[]; total: number; hasMore: boolean }> {
    this.ensureDb();
    let query: any = options?.useCollectionGroup 
      ? this.db!.collectionGroup(collection)
      : this.db!.collection(collection);

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

    // Get total count for pagination before applying order and limit
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;
    
    if (options?.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction);
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    // Apply pagination
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    let items = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as T));

    const hasMore = options?.limit ? items.length === options.limit : false;

    return { items, total, hasMore };
  }

  // User Management
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const plainPassword = userData.passwordHash; // Seeding script passes plain text here
      
      let authUser;
      try {
        authUser = await admin.auth().getUserByEmail(userData.email);
        dbLogger.warn('User already exists in Firebase Auth, updating.', { uid: authUser.uid });
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found') {
          authUser = await admin.auth().createUser({
            email: userData.email,
            password: plainPassword,
            displayName: `${userData.firstName} ${userData.lastName}`,
            emailVerified: userData.emailVerified || true,
          });
          dbLogger.info('User created in Firebase Auth', { uid: authUser.uid, email: userData.email });
        } else {
          throw authError;
        }
      }

      const customClaims: { role: string; companyId?: string } = { role: userData.role };
      if (userData.companyId) {
        customClaims.companyId = userData.companyId;
      }
      await admin.auth().setCustomUserClaims(authUser.uid, customClaims);
      dbLogger.info('Custom claims set for user', { uid: authUser.uid, claims: customClaims });

      const passwordHash = await bcrypt.hash(plainPassword, 12);
      
      const userFirestoreData = {
        ...userData,
        passwordHash,
        emailVerified: authUser.emailVerified,
        status: 'active' as const,
        deletedAt: null
      };
      
      const userId = authUser.uid;
      const userDocRef = this.db.collection(COLLECTIONS.USERS).doc(userId);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        await userDocRef.set({
          ...userFirestoreData,
          id: userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await userDocRef.update({
          ...userFirestoreData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      dbLogger.info('User document created/updated in Firestore', { userId, email: userData.email, role: userData.role });
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
    }
  }

  async listUsers(options?: {
    limit?: number;
    offset?: number;
    role?: string;
    status?: string;
    companyId?: string;
    orderBy?: { field: string; direction: 'asc' | 'desc' };
  }): Promise<{ items: User[]; total: number; hasMore: boolean }> {
    const where: any[] = [];
    
    if (options?.role) {
      where.push({ field: 'role', operator: '==', value: options.role });
    }
    if (options?.status) {
      where.push({ field: 'status', operator: '==', value: options.status });
    }
    if (options?.companyId) {
      where.push({ field: 'companyId', operator: '==', value: options.companyId });
    }

    return this.list<User>(COLLECTIONS.USERS, {
      limit: options?.limit,
      offset: options?.offset,
      where,
      orderBy: options?.orderBy || { field: 'createdAt', direction: 'desc' },
      useCollectionGroup: false
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
  async createCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'stats' | 'createdBy'>): Promise<string> {
    try {
      const companyData = {
        ...company,
        stats: {
          totalEmployees: 0,
          activeJobs: 0,
          totalApplications: 0,
          totalHires: 0
        },
        createdBy: 'system' // or pass in user id
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

  async getCompaniesByIds(ids: string[]): Promise<Company[]> {
    if (ids.length === 0) return [];
    this.ensureDb();
    const snapshot = await this.db!.collection(COLLECTIONS.COMPANIES)
        .where(admin.firestore.FieldPath.documentId(), 'in', ids)
        .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
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
    
    if (options?.status && options.status !== 'all') {
      where.push({ field: 'status', operator: '==', value: options.status });
    }

    return this.list<Company>(COLLECTIONS.COMPANIES, {
      limit: options?.limit,
      offset: options?.offset,
      where,
      orderBy: { field: 'createdAt', direction: 'desc' },
      useCollectionGroup: false
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
    const { items } = await this.list<Job>(COLLECTIONS.JOBS, { 
      limit, 
      orderBy: { field: 'publishedAt', direction: 'desc' },
      useCollectionGroup: false
    });
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
      orderBy: { field: 'createdAt', direction: 'desc' },
      useCollectionGroup: false
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

  async getCompanyApplications(options: { companyId: string; status?: string; limit?: number }): Promise<JobApplication[]> {
    this.ensureDb();
    
    const jobsSnapshot = await this.db!.collection(COLLECTIONS.JOBS)
      .where('companyId', '==', options.companyId)
      .where('deletedAt', '==', null)
      .get();
    
    if (jobsSnapshot.empty) return [];
    
    const jobIds = jobsSnapshot.docs.map(doc => doc.id);
    
    const applicationsSnapshot = await this.db!.collection(COLLECTIONS.JOB_APPLICATIONS)
      .where('deletedAt', '==', null)
      .limit(options.limit || 1000)
      .get();
    
    let applications = applicationsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as JobApplication));
    
    applications = applications.filter(app => jobIds.includes(app.jobId));
    
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
    this.ensureDb();
    let query = this.db!.collection(COLLECTIONS.INTERVIEWS)
      .where('deletedAt', '==', null);
    
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
  
  async getSystemAnalytics(): Promise<any> {
    this.ensureDb();
    
    const [
      companiesSnapshot,
      usersSnapshot,
      jobsSnapshot,
      applicationsSnapshot,
      interviewsSnapshot
    ] = await Promise.all([
      this.db!.collection(COLLECTIONS.COMPANIES).where('deletedAt', '==', null).count().get(),
      this.db!.collection(COLLECTIONS.USERS).where('deletedAt', '==', null).count().get(),
      this.db!.collection(COLLECTIONS.JOBS).where('deletedAt', '==', null).where('status', '==', 'active').count().get(),
      this.db!.collection(COLLECTIONS.JOB_APPLICATIONS).where('deletedAt', '==', null).count().get(),
      this.db!.collection(COLLECTIONS.INTERVIEWS).count().get()
    ]);
    
    return {
      overview: {
        totalCompanies: companiesSnapshot.data().count,
        totalUsers: usersSnapshot.data().count,
        activeJobs: jobsSnapshot.data().count,
        totalApplications: applicationsSnapshot.data().count,
        totalInterviews: interviewsSnapshot.data().count,
      }
    };
  }

  async deleteJob(id: string): Promise<void> {
    return this.delete(COLLECTIONS.JOBS, id);
  }

  async updateApplication(id: string, data: Partial<JobApplication>): Promise<void> {
    return this.update(COLLECTIONS.JOB_APPLICATIONS, id, data);
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
