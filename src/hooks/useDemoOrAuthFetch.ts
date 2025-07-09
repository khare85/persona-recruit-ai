import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useCallback } from 'react';

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

// Demo data for different dashboards
const DEMO_DATA = {
  '/api/recruiter/dashboard': {
    success: true,
    data: {
      activeJobs: 12,
      newApplications: 34,
      upcomingInterviews: 8,
      hiresThisMonth: 5,
      upcomingInterviewList: [
        {
          id: 'demo-1',
          candidateName: 'John Doe',
          jobTitle: 'Senior Software Engineer',
          scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 60
        },
        {
          id: 'demo-2',
          candidateName: 'Jane Smith',
          jobTitle: 'Product Manager',
          scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 45
        }
      ],
      recentApplicationList: [
        {
          id: 'demo-app-1',
          candidateName: 'Alice Johnson',
          jobTitle: 'Frontend Developer',
          appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'reviewing',
          aiMatchScore: 92
        },
        {
          id: 'demo-app-2',
          candidateName: 'Bob Wilson',
          jobTitle: 'DevOps Engineer',
          appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'shortlisted',
          aiMatchScore: 88
        }
      ]
    }
  },
  '/api/company/dashboard': {
    success: true,
    data: {
      totalEmployees: 156,
      openPositions: 8,
      activeRecruiters: 12,
      pendingInvitations: 3,
      recentActivity: [
        {
          id: 'activity-1',
          type: 'job_posted',
          description: 'New job posted: Senior Backend Engineer',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'activity-2',
          type: 'candidate_hired',
          description: 'John Doe hired for Product Manager position',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        }
      ],
      teamStats: {
        recruiters: 12,
        interviewers: 24,
        hiringManagers: 8
      }
    }
  },
  '/api/admin/dashboard': {
    success: true,
    data: {
      totalUsers: 1234,
      totalCompanies: 56,
      activeJobs: 234,
      systemHealth: 'healthy',
      recentSignups: [
        {
          id: 'signup-1',
          name: 'TechCorp Inc.',
          type: 'company',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'signup-2',
          name: 'Sarah Chen',
          type: 'candidate',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ],
      systemMetrics: {
        apiCalls: 45678,
        storageUsed: '234 GB',
        activeUsers: 892
      }
    }
  },
  '/api/interviewer/dashboard': {
    success: true,
    data: {
      upcomingInterviews: 5,
      completedThisWeek: 12,
      averageRating: 4.6,
      pendingFeedback: 3,
      upcomingInterviewsList: [
        {
          id: 'int-1',
          candidateName: 'Michael Brown',
          position: 'Data Scientist',
          scheduledFor: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          interviewType: 'Technical'
        },
        {
          id: 'int-2',
          candidateName: 'Emily Davis',
          position: 'UX Designer',
          scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          interviewType: 'Portfolio Review'
        }
      ]
    }
  },
  '/api/candidates/dashboard': {
    success: true,
    data: {
      profileCompletion: 85,
      activeApplications: 6,
      interviewsScheduled: 2,
      profileViews: 34,
      recommendedJobs: [
        {
          id: 'job-1',
          title: 'Full Stack Developer',
          company: 'TechStart Inc.',
          location: 'San Francisco, CA',
          matchScore: 94
        },
        {
          id: 'job-2',
          title: 'Senior React Developer',
          company: 'WebSolutions LLC',
          location: 'Remote',
          matchScore: 89
        }
      ],
      applicationStatus: [
        {
          id: 'app-1',
          jobTitle: 'Frontend Engineer',
          company: 'StartupXYZ',
          status: 'interview_scheduled',
          lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'app-2',
          jobTitle: 'React Developer',
          company: 'BigCorp',
          status: 'under_review',
          lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  },
  '/api/candidate/dashboard': {
    success: true,
    data: {
      applicationsApplied: 6,
      upcomingInterviews: 2,
      offersReceived: 1,
      aiRecommendedJobs: 8,
      recentJobs: [
        {
          id: 'job-1',
          title: 'Full Stack Developer',
          company: 'TechStart Inc.',
          jobIdForLink: 'job-1'
        },
        {
          id: 'job-2',
          title: 'Senior React Developer',
          company: 'WebSolutions LLC',
          jobIdForLink: 'job-2'
        }
      ]
    }
  }
};

export function useDemoOrAuthFetch() {
  const { getToken } = useAuth();
  const { isDemoMode } = useDemo();

  const demoOrAuthFetch = useCallback(async (url: string, options: FetchOptions = {}) => {
    // If in demo mode, return mock data
    if (isDemoMode) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const demoData = DEMO_DATA[url as keyof typeof DEMO_DATA];
      if (demoData) {
        return demoData;
      }
      
      // Return generic success for other endpoints
      return { success: true, data: {} };
    }

    // Otherwise, use authenticated fetch
    const token = await getToken();
    if (!token) {
      throw new Error('User not authenticated. Please log in.');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle responses with no content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text().then(text => text ? JSON.parse(text) : {});

  }, [getToken, isDemoMode]);

  return demoOrAuthFetch;
}