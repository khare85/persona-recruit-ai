import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/database.service';
import { handleApiError } from '@/lib/errors';
import { withAuth } from '@/middleware/auth';
import { apiLogger } from '@/lib/logger';

// Mock applications database - DEPRECATED: Only kept for reference, not used in API
  {
    id: 'APP-001',
    candidateId: '1',
    candidateName: 'Sarah Johnson',
    candidateEmail: 'sarah.johnson@email.com',
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    companyId: '1',
    companyName: 'TechCorp Inc.',
    status: 'under_review',
    appliedAt: '2024-06-20T10:00:00Z',
    lastUpdated: '2024-06-21T14:30:00Z',
    resumeUrl: '/api/files/resume_1',
    coverLetter: 'I am excited to apply for this position...',
    aiScore: 87,
    aiAnalysis: {
      skillsMatch: 92,
      experienceMatch: 85,
      culturalFit: 88,
      overallScore: 87,
      strengths: ['React expertise', 'Strong portfolio', 'Team leadership'],
      concerns: ['Limited backend experience']
    },
    timeline: [
      { date: '2024-06-20T10:00:00Z', event: 'Application submitted', status: 'applied' },
      { date: '2024-06-21T14:30:00Z', event: 'Application under review', status: 'under_review' }
    ],
    interviewScheduled: false,
    feedback: []
  },
  {
    id: 'APP-002',
    candidateId: '2', 
    candidateName: 'Marcus Chen',
    candidateEmail: 'marcus.chen@email.com',
    jobId: '2',
    jobTitle: 'DevOps Engineer',
    companyId: '1',
    companyName: 'TechCorp Inc.',
    status: 'interview_scheduled',
    appliedAt: '2024-06-19T15:00:00Z',
    lastUpdated: '2024-06-22T09:00:00Z',
    resumeUrl: '/api/files/resume_2',
    coverLetter: 'My experience in cloud infrastructure...',
    aiScore: 92,
    aiAnalysis: {
      skillsMatch: 95,
      experienceMatch: 90,
      culturalFit: 91,
      overallScore: 92,
      strengths: ['Kubernetes expertise', 'CI/CD experience', 'Strong problem solving'],
      concerns: ['None significant']
    },
    timeline: [
      { date: '2024-06-19T15:00:00Z', event: 'Application submitted', status: 'applied' },
      { date: '2024-06-20T11:00:00Z', event: 'Application reviewed', status: 'under_review' },
      { date: '2024-06-22T09:00:00Z', event: 'Interview scheduled', status: 'interview_scheduled' }
    ],
    interviewScheduled: true,
    interviewDate: '2024-06-25T14:00:00Z',
    feedback: []
  }
];

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const candidateId = searchParams.get('candidateId');
    const jobId = searchParams.get('jobId');
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    apiLogger.info('Fetching applications', { candidateId, jobId, companyId, status });

    let applications: any[] = [];

    // Fetch based on filters
    if (candidateId) {
      applications = await databaseService.getCandidateApplications(candidateId);
    } else if (jobId) {
      applications = await databaseService.getJobApplications(jobId, status || undefined);
    } else if (companyId) {
      applications = await databaseService.getCompanyApplications({
        companyId,
        status: status || undefined,
        limit: limit * page // Get enough for pagination
      });
    } else {
      // For now, return empty array if no filter provided
      // In production, might want to restrict this or add pagination at DB level
      applications = [];
    }

    // Sort by most recent
    applications.sort((a, b) => {
      const dateA = new Date(a.appliedAt || a.createdAt).getTime();
      const dateB = new Date(b.appliedAt || b.createdAt).getTime();
      return dateB - dateA;
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedApplications = applications.slice(startIndex, endIndex);

    // Enrich application data with job and company info if needed
    const enrichedApplications = await Promise.all(
      paginatedApplications.map(async (app) => {
        const job = await databaseService.getJobById(app.jobId);
        const company = job ? await databaseService.getCompanyById(job.companyId) : null;
        
        return {
          ...app,
          jobTitle: job?.title || 'Unknown Position',
          companyName: company?.name || 'Unknown Company',
          location: job?.location || 'Not specified',
          salary: job?.salaryRange || 'Not disclosed'
        };
      })
    );

    return NextResponse.json({
      data: enrichedApplications,
      pagination: {
        page,
        limit,
        total: applications.length,
        totalPages: Math.ceil(applications.length / limit),
        hasNext: endIndex < applications.length,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { candidateId, jobId, coverLetter, resumeUrl } = body;

    // Validate required fields
    if (!candidateId || !jobId) {
      return NextResponse.json(
        { error: 'Candidate ID and Job ID are required' },
        { status: 400 }
      );
    }

    apiLogger.info('Creating job application', { candidateId, jobId });

    // Check if candidate already applied for this job
    const existingApplication = await databaseService.getJobApplicationByCandidate(jobId, candidateId);
    
    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 409 }
      );
    }

    // Get job details to validate it exists
    const job = await databaseService.getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Create new application
    const applicationData = {
      candidateId,
      jobId,
      status: 'submitted',
      coverLetter: coverLetter || '',
      resumeUrl: resumeUrl || null,
      appliedAt: new Date(),
      timeline: [
        {
          date: new Date().toISOString(),
          event: 'Application submitted',
          status: 'submitted'
        }
      ]
    };

    const applicationId = await databaseService.createJobApplication(applicationData);
    const newApplication = await databaseService.getApplicationById(applicationId);

    apiLogger.info('Job application created successfully', { applicationId });

    // TODO: Trigger AI analysis as a background job
    // This would analyze the candidate's fit for the role

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: newApplication
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});