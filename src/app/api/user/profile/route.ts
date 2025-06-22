import { NextRequest, NextResponse } from 'next/server';

// Mock user database
const users = [
  {
    id: '1',
    email: 'admin@techcorp.com',
    fullName: 'Admin User',
    role: 'admin',
    avatar: '/avatars/admin.jpg',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    timezone: 'America/Los_Angeles',
    companyId: '1',
    companyName: 'TechCorp Inc.',
    department: 'Administration',
    title: 'System Administrator',
    bio: 'Experienced system administrator with a focus on recruitment technology.',
    linkedinProfile: 'https://linkedin.com/in/admin-user',
    isEmailVerified: true,
    isPhoneVerified: false,
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      theme: 'system', // light, dark, system
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-20T14:30:00Z',
    lastLoginAt: '2024-06-22T09:15:00Z'
  },
  {
    id: '2',
    email: 'recruiter@techcorp.com',
    fullName: 'Recruiter User',
    role: 'recruiter',
    avatar: '/avatars/recruiter.jpg',
    phone: '+1 (555) 234-5678',
    location: 'Austin, TX',
    timezone: 'America/Chicago',
    companyId: '1',
    companyName: 'TechCorp Inc.',
    department: 'Human Resources',
    title: 'Senior Recruiter',
    bio: 'Passionate about connecting great talent with amazing opportunities.',
    linkedinProfile: 'https://linkedin.com/in/recruiter-user',
    isEmailVerified: true,
    isPhoneVerified: true,
    preferences: {
      emailNotifications: true,
      pushNotifications: true,
      theme: 'light',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    },
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-06-21T16:45:00Z',
    lastLoginAt: '2024-06-22T08:30:00Z'
  },
  {
    id: '3',
    email: 'candidate@example.com',
    fullName: 'Candidate User',
    role: 'candidate',
    avatar: '/avatars/candidate.jpg',
    phone: '+1 (555) 345-6789',
    location: 'Seattle, WA',
    timezone: 'America/Los_Angeles',
    companyId: null,
    companyName: null,
    department: null,
    title: 'Software Engineer',
    bio: 'Full-stack developer with 5+ years of experience in React and Node.js.',
    linkedinProfile: 'https://linkedin.com/in/candidate-user',
    portfolioUrl: 'https://candidate-portfolio.dev',
    githubProfile: 'https://github.com/candidate-user',
    isEmailVerified: true,
    isPhoneVerified: false,
    preferences: {
      emailNotifications: true,
      pushNotifications: false,
      theme: 'dark',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    },
    candidateProfile: {
      currentTitle: 'Senior Frontend Developer',
      experience: '5+ years',
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS'],
      availability: 'Immediately',
      salaryExpectation: '$120,000 - $150,000',
      isOpenToRemote: true,
      resumeUrl: '/api/files/resume_1'
    },
    createdAt: '2024-03-10T12:00:00Z',
    updatedAt: '2024-06-19T10:20:00Z',
    lastLoginAt: '2024-06-22T07:45:00Z'
  }
];

export async function GET(request: NextRequest) {
  try {
    // In production, get user ID from JWT token
    const userId = request.headers.get('x-user-id') || '1'; // Mock for demo
    
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const { ...userProfile } = user;
    
    // Add role-specific data
    let additionalData = {};
    
    if (user.role === 'candidate') {
      additionalData = {
        applications: [
          {
            id: 'APP-001',
            jobTitle: 'Senior Frontend Developer',
            companyName: 'TechCorp Inc.',
            status: 'under_review',
            appliedAt: '2024-06-20T10:00:00Z'
          }
        ],
        interviews: [
          {
            id: 'IV-001',
            jobTitle: 'Senior Frontend Developer',
            scheduledDate: '2024-06-25T14:00:00Z',
            status: 'scheduled'
          }
        ]
      };
    } else if (user.role === 'recruiter' || user.role === 'admin') {
      additionalData = {
        activeJobs: [
          {
            id: '1',
            title: 'Senior Frontend Developer',
            applicationsCount: 23,
            status: 'active'
          }
        ],
        recentApplications: [
          {
            id: 'APP-001',
            candidateName: 'Sarah Johnson',
            jobTitle: 'Senior Frontend Developer',
            status: 'under_review',
            appliedAt: '2024-06-20T10:00:00Z'
          }
        ]
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        ...userProfile,
        ...additionalData
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // In production, get user ID from JWT token
    const userId = request.headers.get('x-user-id') || '1'; // Mock for demo
    const body = await request.json();
    
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const {
      fullName,
      phone,
      location,
      timezone,
      title,
      bio,
      linkedinProfile,
      portfolioUrl,
      githubProfile,
      preferences,
      candidateProfile
    } = body;

    // Update user profile
    const updatedUser = {
      ...users[userIndex],
      updatedAt: new Date().toISOString()
    };

    // Update allowed fields
    if (fullName !== undefined) updatedUser.fullName = fullName;
    if (phone !== undefined) updatedUser.phone = phone;
    if (location !== undefined) updatedUser.location = location;
    if (timezone !== undefined) updatedUser.timezone = timezone;
    if (title !== undefined) updatedUser.title = title;
    if (bio !== undefined) updatedUser.bio = bio;
    if (linkedinProfile !== undefined) updatedUser.linkedinProfile = linkedinProfile;
    if (portfolioUrl !== undefined) updatedUser.portfolioUrl = portfolioUrl;
    if (githubProfile !== undefined) updatedUser.githubProfile = githubProfile;
    
    // Update preferences
    if (preferences !== undefined) {
      updatedUser.preferences = {
        ...updatedUser.preferences,
        ...preferences
      };
    }

    // Update candidate-specific profile
    if (candidateProfile !== undefined && updatedUser.role === 'candidate') {
      updatedUser.candidateProfile = {
        ...updatedUser.candidateProfile,
        ...candidateProfile
      };
    }

    users[userIndex] = updatedUser;

    // In production, save to database
    console.log('Updated user profile:', updatedUser);

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}