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
      systemHealth: 100,
      monthlyRevenue: 125000,
      supportTickets: 12,
      recentActivity: [
        {
          type: 'user',
          message: 'New user registered: Sarah Chen',
          time: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          type: 'company',
          message: 'TechCorp Inc. upgraded to Premium plan',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'system',
          message: 'Database backup completed successfully',
          time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'job',
          message: 'New job posting: Senior DevOps Engineer at StartupXYZ',
          time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        }
      ]
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

// Additional demo data for endpoints that match with query params
const DEMO_DATA_WITH_PARAMS: Record<string, any> = {
  '/api/ai-analytics/dashboard': {
    success: true,
    data: {
      performance: {
        totalOperations: 15234,
        successRate: 98.5,
        averageLatency: 245,
        errorRate: 1.5,
        trendsData: []
      },
      biasMetrics: {
        genderBias: 0.02,
        ageBias: 0.03,
        ethnicityBias: 0.01,
        overallFairness: 96.5
      },
      fairnessAnalysis: {
        demographicParity: 0.95,
        equalOpportunity: 0.94,
        equalizedOdds: 0.93,
        disparateImpact: 0.96
      },
      activeAlerts: [
        {
          id: 'alert-1',
          type: 'bias_detected',
          severity: 'warning',
          message: 'Slight gender bias detected in resume screening',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  },
  '/api/admin/analytics': {
    success: true,
    data: {
      platformMetrics: {
        totalInterviews: 456,
        averageMatchScore: 87,
        hiringRate: 23,
        candidateSatisfaction: 4.6
      }
    }
  },
  '/api/admin/billing': {
    success: true,
    data: {
      monthlyRevenue: 125000,
      totalCustomers: 56,
      mrr: 85000,
      churnRate: 2.3
    }
  },
  '/api/admin/support': {
    success: true,
    data: {
      openTickets: 12,
      resolvedToday: 8,
      averageResponseTime: '2 hours',
      satisfactionScore: 4.7
    }
  },
  '/api/admin/users': {
    success: true,
    data: {
      users: [
        {
          id: 'user-1',
          email: 'john.doe@example.com',
          displayName: 'John Doe',
          role: 'recruiter',
          companyId: 'comp-1',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'user-2',
          email: 'jane.smith@example.com',
          displayName: 'Jane Smith',
          role: 'candidate',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        }
      ],
      total: 1234
    }
  },
  '/api/admin/company-management': {
    success: true,
    data: {
      companies: [
        {
          id: 'comp-1',
          name: 'TechCorp Inc.',
          plan: 'premium',
          status: 'active',
          employeeCount: 150,
          jobPostings: 12,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'comp-2',
          name: 'StartupXYZ',
          plan: 'standard',
          status: 'active',
          employeeCount: 25,
          jobPostings: 5,
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      total: 56
    }
  },
  '/api/admin/system': {
    success: true,
    data: {
      health: {
        database: 'healthy',
        storage: 'healthy',
        api: 'healthy',
        aiServices: 'healthy'
      },
      metrics: {
        cpuUsage: 45,
        memoryUsage: 68,
        diskUsage: 52,
        activeConnections: 234
      },
      uptime: 2592000 // 30 days in seconds
    }
  }
};

export function useDemoOrAuthFetch() {
  const { getToken } = useAuth();
  const { isDemoMode } = useDemo();

  const demoOrAuthFetch = useCallback(async (url: string, options: FetchOptions = {}) => {
    // Check if we're in a real demo environment (separate Firebase backend)
    const isRealDemoEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT === 'demo';
    
    // If in UI demo mode but NOT in real demo environment, return mock data
    if (isDemoMode && !isRealDemoEnvironment) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // First check exact match
      let demoData = DEMO_DATA[url as keyof typeof DEMO_DATA];
      if (demoData) {
        return demoData;
      }
      
      // Check URL without query params for endpoints with params
      const urlWithoutParams = url.split('?')[0];
      demoData = DEMO_DATA_WITH_PARAMS[urlWithoutParams];
      if (demoData) {
        return demoData;
      }
      
      // Return generic success for other endpoints
      return { success: true, data: {} };
    }

    // For both real demo environment and production, use authenticated fetch
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