
import admin from 'firebase-admin';
import { getFirebaseAdmin } from '@/lib/firebase/server';
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
  INTERVIEWS: 'interviews',
  SUBSCRIPTIONS: 'subscriptions',
  AUDIT_LOGS: 'auditLogs'
} as const;

// Database service class
class DatabaseService {
  private async getDb(): Promise<admin.firestore.Firestore> {
    const app = await getFirebaseAdmin();
    return app.firestore();
  }

  // Generic helpers
  private async create<T>(collection: string, data: T, id?: string): Promise<string> {
    const db = await this.getDb();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    const docRef = id ? db.collection(collection).doc(id) : db.collection(collection).doc();
    
    await docRef.set({
      ...data,
      id: docRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null
    });

    return docRef.id;
  }

  private async update<T>(collection: string, id: string, data: Partial<T>): Promise<void> {
    const db = await this.getDb();
    await db.collection(collection).doc(id).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  private async upsert<T>(collection: string, id: string, data: Partial<T>): Promise<void> {
    const db = await this.getDb();
    const docRef = db.collection(collection).doc(id);
    
    // Check if document exists
    const doc = await docRef.get();
    
    if (!doc.exists) {
      // Document doesn't exist, create it with default values
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      await docRef.set({
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null
      });
    } else {
      // Document exists, update it
      await docRef.set({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }

  private async get<T>(collection: string, id: string): Promise<T | null> {
    const db = await this.getDb();
    const doc = await db.collection(collection).doc(id).get();
    if (!doc.exists || doc.data()?.deletedAt) return null;
    return { id: doc.id, ...doc.data() } as T;
  }
  
  async findById(collection: string, id: string): Promise<any | null> {
    return this.get(collection, id);
  }

  async findMany(collection: string, options: any): Promise<any[]> {
    const { items } = await this.list(collection, options);
    return items;
  }
  
  async count(collection: string, where: any): Promise<number> {
    const db = await this.getDb();
    const snapshot = await db.collection(collection).where(where).count().get();
    return snapshot.data().count;
  }

  private async delete(collection: string, id: string, hard = false): Promise<void> {
    const db = await this.getDb();
    if (hard) {
      await db.collection(collection).doc(id).delete();
    } else {
      await this.update(collection, id, { deletedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  }

  private async list<T>(
    collection: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: { field: string; direction: 'asc' | 'desc' } | null;
      where?: { field: string; operator: any; value: any }[];
      includeDeleted?: boolean;
      useCollectionGroup?: boolean;
    }
  ): Promise<{ items: T[]; total: number; hasMore: boolean }> {
    const db = await this.getDb();
    let query: any = options?.useCollectionGroup 
      ? db.collectionGroup(collection)
      : db.collection(collection);

    if (options?.where) {
      options.where.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
    }

    if (!options?.includeDeleted) {
      query = query.where('deletedAt', '==', null);
    }

    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;
    
    if (options?.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction);
    } else if (options?.orderBy !== null) {
      query = query.orderBy('createdAt', 'desc');
    }

    if (options?.offset) {
      query = query.offset(options.offset);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    const items = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      for (const key in data) {
        if (data[key] instanceof admin.firestore.Timestamp) {
          data[key] = data[key].toDate().toISOString();
        }
      }
      return { id: doc.id, ...data } as T;
    });

    const hasMore = options?.limit ? items.length === options.limit : false;

    return { items, total, hasMore };
  }

  // User Management - Simplified for Firebase Auth integration
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'fullName'>): Promise<string> {
    dbLogger.error('createUser method is deprecated. Use createUserDocument instead.', { email: userData.email });
    throw new Error('createUser method is deprecated. Firebase Auth handles user creation on client side.');
  }

  async getUserById(id: string): Promise<User | null> {
    return this.get<User>(COLLECTIONS.USERS, id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await this.getDb();
    const snapshot = await db.collection(COLLECTIONS.USERS)
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
    const db = await this.getDb();
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('resetToken', '==', resetToken)
      .where('deletedAt', '==', null)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async createUserDocument(userId: string, userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await this.create(COLLECTIONS.USERS, userData, userId);
      dbLogger.info('User document created in Firestore', { userId, email: userData.email });
    } catch (error) {
      dbLogger.error('Error creating user document', { error: String(error), userId });
      throw error;
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    // Remove password hashing since Firebase Auth handles passwords
    const { passwordHash, ...updateData } = data;
    if (passwordHash) {
      dbLogger.warn('Password updates should be handled through Firebase Auth', { userId: id });
    }
    return this.update(COLLECTIONS.USERS, id, updateData);
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
    // Use upsert (set with merge) to create the document if it doesn't exist
    const db = await this.getDb();
    const docRef = db.collection(COLLECTIONS.CANDIDATE_PROFILES).doc(userId);
    
    // Check if document exists
    const doc = await docRef.get();
    
    if (!doc.exists) {
      // Document doesn't exist, create it with default candidate profile values
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const defaultCandidateProfile = {
        userId,
        phone: '',
        location: '',
        currentTitle: '',
        experience: 'Entry Level',
        summary: '',
        skills: [],
        profileComplete: false,
        availableForWork: true,
        availability: 'immediate',
        resumeUploaded: false,
        videoIntroRecorded: false,
        onboardingComplete: false,
        ...data, // Override with provided data
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null
      };
      
      await docRef.set(defaultCandidateProfile);
      dbLogger.info('Candidate profile created via upsert', { userId });
    } else {
      // Document exists, update it
      await docRef.set({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      dbLogger.info('Candidate profile updated', { userId });
    }
  }

  async createInterviewerProfile(profile: Omit<InterviewerProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await this.create(COLLECTIONS.INTERVIEWER_PROFILES, profile, profile.userId);
      dbLogger.info('Interviewer profile created', { userId: profile.userId });
    } catch (error) {
      dbLogger.error('Error creating interviewer profile', { error: String(error), userId: profile.userId });
      throw error;
    }
  }

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
        createdBy: 'system'
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
    const db = await this.getDb();
    const snapshot = await db.collection(COLLECTIONS.USERS)
        .where('companyId', '==', companyId)
        .where('role', '==', 'company_admin')
        .where('deletedAt', '==', null)
        .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  async getCompanyRecruiters(companyId: string): Promise<User[]> {
    const db = await this.getDb();
    const snapshot = await db.collection(COLLECTIONS.USERS)
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
    const db = await this.getDb();
    const snapshot = await db.collection(COLLECTIONS.COMPANIES)
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
    const db = await this.getDb();
    const snapshot = await db.collection(COLLECTIONS.COMPANIES)
      .where('domain', '==', domain)
      .where('deletedAt', '==', null)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Company;
  }

  async getCompanyUserCount(companyId: string): Promise<number> {
    const db = await this.getDb();
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('companyId', '==', companyId)
      .where('deletedAt', '==', null)
      .count()
      .get();
    
    return snapshot.data().count;
  }

  async getCompanyActiveJobsCount(companyId: string): Promise<number> {
    const db = await this.getDb();
    const snapshot = await db.collection(COLLECTIONS.JOBS)
      .where('companyId', '==', companyId)
      .where('status', '==', 'active')
      .where('deletedAt', '==', null)
      .count()
      .get();
    
    return snapshot.data().count;
  }

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
    const db = await this.getDb();
    const snapshot = await db.collection(COLLECTIONS.COMPANY_INVITATIONS)
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
    const db = await this.getDb();
    let query: any = db.collection(COLLECTIONS.COMPANY_INVITATIONS)
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
      where: [{ field: 'status', operator: '==', value: 'active' }],
      orderBy: { field: 'createdAt', direction: 'desc' },
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
    orderBy?: { field: string; direction: 'asc' | 'desc' } | null;
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
      orderBy: options?.orderBy === null ? null : (options?.orderBy || { field: 'createdAt', direction: 'desc' }),
      useCollectionGroup: false
    });
  }

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

  async updateApplication(id: string, data: Partial<JobApplication>): Promise<void> {
    return this.update(COLLECTIONS.JOB_APPLICATIONS, id, data);
  }

  async getCandidateApplications(candidateId: string): Promise<JobApplication[]> {
    const db = await this.getDb();
    const snapshot = await db.collection(COLLECTIONS.JOB_APPLICATIONS)
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
    const db = await this.getDb();
    let query: any = db.collection(COLLECTIONS.JOB_APPLICATIONS)
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

  async getApplicationsForJobs(jobIds: string[]): Promise<JobApplication[]> {
    if (jobIds.length === 0) return [];
    const db = await this.getDb();
    
    const chunks = [];
    for (let i = 0; i < jobIds.length; i += 30) {
      chunks.push(jobIds.slice(i, i + 30));
    }

    const promises = chunks.map(chunk => 
      db.collection(COLLECTIONS.JOB_APPLICATIONS)
        .where('jobId', 'in', chunk)
        .where('deletedAt', '==', null)
        .get()
    );

    const snapshots = await Promise.all(promises);
    const applications: JobApplication[] = [];
    snapshots.forEach(snapshot => {
      snapshot.forEach(doc => {
        applications.push({ id: doc.id, ...doc.data() } as JobApplication);
      });
    });

    return applications;
  }

  async getInterviewsForJobs(jobIds: string[]): Promise<any[]> {
    if (jobIds.length === 0) return [];
    const db = await this.getDb();
    
    const chunks = [];
    for (let i = 0; i < jobIds.length; i += 30) {
      chunks.push(jobIds.slice(i, i + 30));
    }

    const promises = chunks.map(chunk => 
      db.collection(COLLECTIONS.INTERVIEWS)
        .where('jobId', 'in', chunk)
        .where('deletedAt', '==', null)
        .get()
    );

    const snapshots = await Promise.all(promises);
    const interviews: any[] = [];
    snapshots.forEach(snapshot => {
      snapshot.forEach(doc => {
        interviews.push({ id: doc.id, ...doc.data() });
      });
    });

    return interviews;
  }

  async getJobApplicationByCandidate(jobId: string, candidateId: string): Promise<any> {
    const db = await this.getDb();
    const snapshot = await db.collection(COLLECTIONS.JOB_APPLICATIONS)
      .where('jobId', '==', jobId)
      .where('candidateId', '==', candidateId)
      .where('deletedAt', '==', null)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async getCompanyApplications(options: { companyId: string; status?: string; limit?: number; offset?: number }): Promise<JobApplication[]> {
    const db = await this.getDb();
    let query = db.collection(COLLECTIONS.JOB_APPLICATIONS)
      .where('companyId', '==', options.companyId)
      .where('deletedAt', '==', null);
      
    if (options.status && options.status !== 'all') {
      query = query.where('status', '==', options.status);
    }
    
    query = query.orderBy('appliedAt', 'desc');

    if (options.offset) {
      query = query.offset(options.offset);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as JobApplication));
  }

  async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
    dbLogger.warn('Password verification should be handled through Firebase Auth');
    throw new Error('Password verification should be handled through Firebase Auth');
  }

  async generatePasswordHash(password: string): Promise<string> {
    dbLogger.warn('Password hashing should be handled through Firebase Auth');
    throw new Error('Password hashing should be handled through Firebase Auth');
  }

  async createInterview(interviewData: any): Promise<any> {
    const id = await this.create(COLLECTIONS.INTERVIEWS, interviewData);
    return { id, ...interviewData };
  }

  async getInterviewById(id: string): Promise<any> {
    return this.get(COLLECTIONS.INTERVIEWS, id);
  }

  async updateInterview(id: string, data: any): Promise<void> {
    return this.update(COLLECTIONS.INTERVIEWS, id, data);
  }

  async getInterviews(filters: any = {}): Promise<any[]> {
    const db = await this.getDb();
    let query = db.collection(COLLECTIONS.INTERVIEWS)
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
    const db = await this.getDb();
    const query = db.collection(COLLECTIONS.INTERVIEWS)
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
    const db = await this.getDb();
    
    const [
      companiesSnapshot,
      usersSnapshot,
      jobsSnapshot,
      applicationsSnapshot,
      interviewsSnapshot
    ] = await Promise.all([
      db.collection(COLLECTIONS.COMPANIES).where('deletedAt', '==', null).count().get(),
      db.collection(COLLECTIONS.USERS).where('deletedAt', '==', null).count().get(),
      db.collection(COLLECTIONS.JOBS).where('deletedAt', '==', null).where('status', '==', 'active').count().get(),
      db.collection(COLLECTIONS.JOB_APPLICATIONS).where('deletedAt', '==', null).count().get(),
      db.collection(COLLECTIONS.INTERVIEWS).count().get()
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
  
  async getCompanyAnalytics(companyId: string): Promise<any> {
    const db = await this.getDb();
    
    const [
      jobsSnapshot,
      applicationsSnapshot,
      interviewsSnapshot
    ] = await Promise.all([
      db.collection(COLLECTIONS.JOBS).where('companyId', '==', companyId).where('deletedAt', '==', null).get(),
      db.collection(COLLECTIONS.JOB_APPLICATIONS).where('companyId', '==', companyId).where('deletedAt', '==', null).get(),
      db.collection(COLLECTIONS.INTERVIEWS).where('companyId', '==', companyId).where('deletedAt', '==', null).get()
    ]);
    
    const jobs = jobsSnapshot.docs.map(doc => doc.data());
    const applications = applicationsSnapshot.docs.map(doc => doc.data());
    const interviews = interviewsSnapshot.docs.map(doc => doc.data());

    return {
      overview: {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'active').length,
        totalApplications: applications.length,
        pendingApplications: applications.filter(app => app.status === 'pending').length,
        totalInterviews: interviews.length,
        scheduledInterviews: interviews.filter(i => i.status === 'scheduled').length,
        totalHires: applications.filter(app => app.status === 'hired').length,
        recruiters: (await this.getCompanyRecruiters(companyId)).length
      },
      applicationsByStatus: applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      monthlyApplications: this.groupCountByMonth(applications, 'appliedAt'),
      topJobs: jobs.map(job => ({
        jobId: job.id,
        title: job.title,
        department: job.department,
        applications: applications.filter(app => app.jobId === job.id).length
      })).sort((a,b) => b.applications - a.applications).slice(0, 5),
      averageMatchScore: applications.reduce((sum, app) => sum + (app.aiMatchScore?.overall || 70), 0) / (applications.length || 1)
    };
  }

  private groupCountByMonth(items: any[], dateField: string): { month: string, count: number }[] {
    const monthCounts: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    items.forEach(item => {
      const date = new Date(item[dateField]);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    return Object.entries(monthCounts).map(([month, count]) => ({ month, count }));
  }

  async deleteJob(id: string): Promise<void> {
    return this.delete(COLLECTIONS.JOBS, id);
  }

  async updateJobApplication(id: string, data: Partial<JobApplication>): Promise<void> {
    return this.update(COLLECTIONS.JOB_APPLICATIONS, id, data);
  }
  
  async createAuditLog(logData: Omit<any, 'id'>): Promise<string> {
    return this.create(COLLECTIONS.AUDIT_LOGS, logData);
  }

  async deleteNotification(notificationId: string) {
    // Placeholder
  }

  async getNotificationsCount(userId: string, options: any) {
    return 0; // Placeholder
  }

  async getUnreadNotificationsCount(userId: string) {
    return 0; // Placeholder
  }

  async getUserNotifications(userId: string, options: any) {
    return []; // Placeholder
  }

  async updateNotification(notificationId: string, updates: any) {
    // Placeholder
  }
  
  async updateUserNotifications(userId: string, updates: any) {
    // Placeholder
  }

  async getNotificationPreferences(userId: string) {
    return null; // Placeholder
  }

  async updateNotificationPreferences(userId: string, preferences: any) {
    // Placeholder
  }

  async createNotification(notification: any) {
    return 'notif-id'; // Placeholder
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
