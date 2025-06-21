// Mock Data Service for Demo Purposes
// This provides realistic data when Firebase isn't connected

export interface MockCandidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  currentTitle: string;
  experience: number;
  location: string;
  skills: string[];
  education: string;
  previousCompanies: string[];
  resumeUrl?: string;
  profilePictureUrl: string;
  videoIntroductionUrl?: string;
  linkedinProfile?: string;
  portfolioUrl?: string;
  availability: string;
  expectedSalary: string;
  summary: string;
  certifications: string[];
  languages: string[];
  aiMatchScore?: number;
}

export interface MockInterview {
  id: string;
  candidateId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  date: string; // ISO 8601 string
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Pending';
  analysisId?: string; // Link to interview analysis if completed
}

export interface MockDocument {
  id: string;
  candidateId: string;
  name: string;
  uploadDate: string; // ISO 8601 string
  fileType: string;
  url: string;
}

export interface MockJob {
  id: string;
  title: string;
  companyName: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  department: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  salaryRange: string;
  postedDate: string;
  applicationCount: number;
  status: 'active' | 'closed' | 'draft';
}

export interface MockInterviewAnalysis {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  interviewDate: string;
  duration: string;
  overallScore: number;
  recommendation: 'Strongly Recommended' | 'Recommended' | 'Recommended with Reservations' | 'Not Recommended';
  behavioralAnalysis: string;
  audioTranscriptHighlights: string[];
  keyStrengths: string[];
  areasForDevelopment: string[];
  detailedJustification: string;
  competencyScores: {
    name: string;
    score: number;
    maxScore: number;
    justification: string;
  }[];
  videoMetrics: {
    confidenceLevel: number;
    communicationClarity: number;
    engagement: number;
    professionalDemeanor: number;
  };
  interviewQuestions: {
    question: string;
    candidateResponse: string;
    aiEvaluation: string;
    score: number;
  }[];
}

export const mockCandidates: MockCandidate[] = [
  {
    id: '1',
    fullName: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    currentTitle: 'Senior React Developer',
    experience: 5,
    location: 'San Francisco, CA',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'GraphQL', 'MongoDB'],
    education: 'BS Computer Science, Stanford University',
    previousCompanies: ['Google', 'Airbnb', 'Stripe'],
    profilePictureUrl: 'https://placehold.co/150x150.png?text=SJ',
    availability: 'Available in 2 weeks',
    expectedSalary: '$140,000 - $160,000',
    summary: 'Experienced full-stack developer with expertise in modern React ecosystems and scalable backend architectures.',
    certifications: ['AWS Solutions Architect', 'React Developer Certification'],
    languages: ['English (Native)', 'Spanish (Conversational)'],
    linkedinProfile: 'https://linkedin.com/in/sarah-johnson-dev',
    aiMatchScore: 95
  },
  {
    id: '2',
    fullName: 'Marcus Chen',
    email: 'marcus.chen@email.com',
    phone: '+1 (555) 234-5678',
    currentTitle: 'DevOps Engineer',
    experience: 7,
    location: 'Austin, TX',
    skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'CI/CD', 'Python', 'Go'],
    education: 'MS Computer Engineering, UT Austin',
    previousCompanies: ['Netflix', 'Uber', 'HashiCorp'],
    profilePictureUrl: 'https://placehold.co/150x150.png?text=MC',
    availability: 'Available immediately',
    expectedSalary: '$150,000 - $180,000',
    summary: 'Cloud infrastructure specialist with deep expertise in container orchestration and automation.',
    certifications: ['CKA (Certified Kubernetes Administrator)', 'AWS DevOps Professional'],
    languages: ['English (Native)', 'Mandarin (Native)'],
    linkedinProfile: 'https://linkedin.com/in/marcus-chen-devops',
    aiMatchScore: 92
  },
  {
    id: '3',
    fullName: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '+1 (555) 345-6789',
    currentTitle: 'UX/UI Designer',
    experience: 4,
    location: 'New York, NY',
    skills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping', 'Design Systems'],
    education: 'BFA Interaction Design, Parsons School of Design',
    previousCompanies: ['IDEO', 'Spotify', 'Slack'],
    profilePictureUrl: 'https://placehold.co/150x150.png?text=ER',
    availability: 'Available in 1 month',
    expectedSalary: '$90,000 - $110,000',
    summary: 'Creative UX designer focused on human-centered design and accessibility.',
    certifications: ['Google UX Design Certificate', 'Nielsen Norman UX Certification'],
    languages: ['English (Native)', 'Spanish (Native)'],
    portfolioUrl: 'https://emilyrodriguez.design',
    aiMatchScore: 88
  },
  {
    id: '4',
    fullName: 'David Kim',
    email: 'david.kim@email.com',
    phone: '+1 (555) 456-7890',
    currentTitle: 'Data Scientist',
    experience: 6,
    location: 'Seattle, WA',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'R', 'Tableau', 'AWS'],
    education: 'PhD Data Science, University of Washington',
    previousCompanies: ['Microsoft', 'Amazon', 'Meta'],
    profilePictureUrl: 'https://placehold.co/150x150.png?text=DK',
    availability: 'Available in 3 weeks',
    expectedSalary: '$160,000 - $190,000',
    summary: 'Senior data scientist specializing in ML model deployment and real-time analytics.',
    certifications: ['TensorFlow Developer Certificate', 'AWS Machine Learning Specialty'],
    languages: ['English (Native)', 'Korean (Native)'],
    linkedinProfile: 'https://linkedin.com/in/david-kim-ds',
    aiMatchScore: 97
  },
  {
    id: '5',
    fullName: 'Jennifer Walsh',
    email: 'jennifer.walsh@email.com',
    phone: '+1 (555) 567-8901',
    currentTitle: 'Product Manager',
    experience: 8,
    location: 'Boston, MA',
    skills: ['Product Strategy', 'Agile', 'Scrum', 'A/B Testing', 'SQL', 'Roadmapping'],
    education: 'MBA Harvard Business School, BS Engineering MIT',
    previousCompanies: ['Apple', 'Tesla', 'Zoom'],
    profilePictureUrl: 'https://placehold.co/150x150.png?text=JW',
    availability: 'Available immediately',
    expectedSalary: '$170,000 - $200,000',
    summary: 'Strategic product leader with track record of launching successful B2B and consumer products.',
    certifications: ['Certified Scrum Product Owner', 'Google Analytics Certified'],
    languages: ['English (Native)', 'French (Fluent)'],
    linkedinProfile: 'https://linkedin.com/in/jennifer-walsh-pm',
    aiMatchScore: 94
  }
];

export const mockJobs: MockJob[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    companyName: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    experienceLevel: 'Senior (5+ years)',
    department: 'Engineering',
    description: 'Join our dynamic team building next-generation web applications using cutting-edge technologies.',
    requirements: [
      '5+ years React/TypeScript experience',
      'Experience with modern build tools (Vite, Webpack)',
      'Strong understanding of web performance optimization',
      'Experience with testing frameworks (Jest, Cypress)',
      'Knowledge of design systems and component libraries'
    ],
    responsibilities: [
      'Lead frontend architecture decisions',
      'Mentor junior developers',
      'Collaborate with design and product teams',
      'Optimize application performance',
      'Code review and maintain quality standards'
    ],
    benefits: [
      'Competitive salary + equity',
      'Health, dental, vision insurance',
      'Unlimited PTO',
      'Remote work options',
      '$2000 learning budget'
    ],
    salaryRange: '$140,000 - $180,000',
    postedDate: '2024-06-10',
    applicationCount: 23,
    status: 'active'
  },
  {
    id: '2',
    title: 'DevOps Engineer',
    companyName: 'CloudScale Solutions',
    location: 'Austin, TX',
    jobType: 'Full-time',
    experienceLevel: 'Mid-Senior (4+ years)',
    department: 'Infrastructure',
    description: 'Build and maintain scalable cloud infrastructure supporting millions of users.',
    requirements: [
      '4+ years DevOps/Infrastructure experience',
      'Expert knowledge of Kubernetes and Docker',
      'Experience with Infrastructure as Code (Terraform)',
      'Strong scripting skills (Python, Bash)',
      'AWS/GCP/Azure cloud platforms experience'
    ],
    responsibilities: [
      'Design and implement CI/CD pipelines',
      'Manage Kubernetes clusters',
      'Monitor system performance and reliability',
      'Automate deployment processes',
      'Ensure security best practices'
    ],
    benefits: [
      'Stock options program',
      'Flexible work arrangements',
      'Professional development budget',
      'Health and wellness programs',
      'Team building events'
    ],
    salaryRange: '$130,000 - $170,000',
    postedDate: '2024-06-12',
    applicationCount: 18,
    status: 'active'
  },
  {
    id: '3',
    title: 'UX Designer',
    companyName: 'DesignFirst Studio',
    location: 'Remote',
    jobType: 'Full-time',
    experienceLevel: 'Mid-level (3+ years)',
    department: 'Design',
    description: 'Create exceptional user experiences for our suite of B2B productivity tools.',
    requirements: [
      '3+ years UX/UI design experience',
      'Proficiency in Figma and design systems',
      'Strong portfolio demonstrating user-centered design',
      'Experience with user research methodologies',
      'Understanding of frontend development constraints'
    ],
    responsibilities: [
      'Lead user research initiatives',
      'Create wireframes, prototypes, and high-fidelity designs',
      'Collaborate with product and engineering teams',
      'Maintain and evolve design system',
      'Conduct usability testing sessions'
    ],
    benefits: [
      'Fully remote position',
      'Creative freedom and autonomy',
      'Conference and workshop budget',
      'Top-tier equipment provided',
      'Flexible working hours'
    ],
    salaryRange: '$85,000 - $115,000',
    postedDate: '2024-06-08',
    applicationCount: 31,
    status: 'active'
  }
];

export const mockInterviewAnalyses: MockInterviewAnalysis[] = [
  {
    id: '1',
    candidateId: '1',
    candidateName: 'Sarah Johnson',
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    interviewDate: '2024-06-14T10:00:00Z',
    duration: '45 minutes',
    overallScore: 87,
    recommendation: 'Strongly Recommended',
    behavioralAnalysis: 'Sarah demonstrated exceptional technical knowledge and communication skills throughout the interview. She showed strong problem-solving abilities when presented with coding challenges and displayed excellent understanding of React ecosystem best practices. Her responses were well-structured, confident, and demonstrated deep technical expertise. She showed great enthusiasm for the role and asked thoughtful questions about the team structure and technical architecture.',
    audioTranscriptHighlights: [
      '"I\'ve led the migration of our legacy jQuery application to React, which improved performance by 40% and developer productivity significantly."',
      '"When dealing with state management, I prefer using Context API for simple cases and Redux Toolkit for complex scenarios with async operations."',
      '"I always prioritize accessibility in my designs, ensuring WCAG 2.1 AA compliance and testing with screen readers."',
      '"Code review is crucial - I focus on maintainability, performance implications, and knowledge sharing with the team."'
    ],
    keyStrengths: [
      'Deep technical expertise in React and modern frontend technologies',
      'Strong leadership experience with mentoring and team guidance',
      'Excellent communication skills and ability to explain complex concepts clearly',
      'Proactive approach to accessibility and code quality',
      'Experience with performance optimization and scalable architectures'
    ],
    areasForDevelopment: [
      'Could benefit from more exposure to backend technologies for full-stack understanding',
      'Limited experience with mobile-first responsive design patterns',
      'Opportunity to gain more experience with micro-frontend architectures'
    ],
    detailedJustification: 'Sarah is an exceptional candidate who demonstrates both technical excellence and strong soft skills. Her experience at top-tier companies (Google, Airbnb, Stripe) has given her exposure to high-scale systems and best practices. She shows genuine passion for frontend development and a commitment to code quality that aligns perfectly with our team values. Her leadership experience and mentoring abilities make her ideal for our senior role requirements.',
    competencyScores: [
      {
        name: 'Technical Expertise',
        score: 9,
        maxScore: 10,
        justification: 'Demonstrated deep knowledge of React, TypeScript, and modern frontend tooling'
      },
      {
        name: 'Communication',
        score: 9,
        maxScore: 10,
        justification: 'Clear, articulate responses with excellent technical explanation abilities'
      },
      {
        name: 'Problem Solving',
        score: 8,
        maxScore: 10,
        justification: 'Approached coding challenges methodically with good time management'
      },
      {
        name: 'Leadership Potential',
        score: 9,
        maxScore: 10,
        justification: 'Strong mentoring experience and demonstrated team leadership skills'
      },
      {
        name: 'Cultural Fit',
        score: 8,
        maxScore: 10,
        justification: 'Values align well with company culture, shows collaboration mindset'
      }
    ],
    videoMetrics: {
      confidenceLevel: 92,
      communicationClarity: 95,
      engagement: 88,
      professionalDemeanor: 94
    },
    interviewQuestions: [
      {
        question: 'Describe your approach to optimizing React application performance.',
        candidateResponse: 'I start with profiling using React DevTools to identify bottlenecks. Common optimizations include memo for expensive renders, useMemo for complex calculations, code splitting with lazy loading, and optimizing bundle size. I also focus on reducing unnecessary re-renders and implementing virtual scrolling for large lists.',
        aiEvaluation: 'Comprehensive answer demonstrating practical experience with React performance optimization techniques.',
        score: 9
      },
      {
        question: 'How do you handle state management in complex React applications?',
        candidateResponse: 'I use a layered approach - Context API for simple global state, Redux Toolkit for complex async operations and normalized data, and local state for component-specific data. I prefer keeping state as close to where it\'s used as possible and use proper data flow patterns.',
        aiEvaluation: 'Shows excellent understanding of state management patterns and when to apply different solutions.',
        score: 9
      },
      {
        question: 'Tell me about a challenging technical problem you solved recently.',
        candidateResponse: 'We had a memory leak in our dashboard that was causing crashes on long sessions. I used Chrome DevTools to identify the issue was with event listeners not being cleaned up. I implemented a custom hook for managing listeners and created a linting rule to prevent future occurrences.',
        aiEvaluation: 'Demonstrates strong debugging skills and proactive approach to preventing future issues.',
        score: 8
      }
    ]
  },
  {
    id: '2',
    candidateId: '2',
    candidateName: 'Marcus Chen',
    jobId: '2',
    jobTitle: 'DevOps Engineer',
    interviewDate: '2024-06-13T14:00:00Z',
    duration: '50 minutes',
    overallScore: 91,
    recommendation: 'Strongly Recommended',
    behavioralAnalysis: 'Marcus exhibited outstanding technical depth in DevOps and cloud infrastructure. His responses showed extensive hands-on experience with Kubernetes, container orchestration, and modern CI/CD practices. He demonstrated excellent problem-solving skills when discussing infrastructure challenges and showed strong understanding of security best practices. His communication was clear and he provided concrete examples from his work at Netflix and Uber.',
    audioTranscriptHighlights: [
      '"At Netflix, I managed Kubernetes clusters serving 200M+ users with 99.99% uptime through proper monitoring and auto-scaling."',
      '"I implemented GitOps workflows using ArgoCD which reduced deployment times from 2 hours to 15 minutes while improving reliability."',
      '"Security is paramount in our infrastructure - I use tools like Falco for runtime security and OPA for policy enforcement."',
      '"I believe in infrastructure as code - everything should be version controlled, tested, and reproducible."'
    ],
    keyStrengths: [
      'Extensive experience with large-scale Kubernetes deployments',
      'Strong automation and Infrastructure as Code expertise',
      'Excellent understanding of security best practices',
      'Proven track record at high-scale companies (Netflix, Uber)',
      'Strong monitoring and observability knowledge'
    ],
    areasForDevelopment: [
      'Could expand knowledge in multi-cloud strategies beyond AWS',
      'Opportunity to gain more experience with serverless architectures',
      'Room for growth in cost optimization strategies'
    ],
    detailedJustification: 'Marcus is an exceptional DevOps engineer with proven experience managing infrastructure at massive scale. His work at Netflix and Uber demonstrates his ability to handle critical production systems. His technical expertise combined with his focus on automation and security makes him an ideal fit for our infrastructure team. His proactive approach to monitoring and incident response aligns perfectly with our operational excellence goals.',
    competencyScores: [
      {
        name: 'Technical Expertise',
        score: 10,
        maxScore: 10,
        justification: 'Exceptional knowledge of Kubernetes, cloud platforms, and modern DevOps practices'
      },
      {
        name: 'Problem Solving',
        score: 9,
        maxScore: 10,
        justification: 'Excellent analytical approach to infrastructure challenges with practical solutions'
      },
      {
        name: 'Communication',
        score: 8,
        maxScore: 10,
        justification: 'Clear technical communication with good use of concrete examples'
      },
      {
        name: 'Security Awareness',
        score: 9,
        maxScore: 10,
        justification: 'Strong understanding of security best practices and compliance requirements'
      },
      {
        name: 'Innovation',
        score: 9,
        maxScore: 10,
        justification: 'Demonstrated ability to implement cutting-edge DevOps practices and automation'
      }
    ],
    videoMetrics: {
      confidenceLevel: 95,
      communicationClarity: 85,
      engagement: 90,
      professionalDemeanor: 92
    },
    interviewQuestions: [
      {
        question: 'How do you ensure high availability in a Kubernetes cluster?',
        candidateResponse: 'I implement multi-zone deployments with proper resource requests and limits, use horizontal pod autoscaling, set up comprehensive monitoring with Prometheus and Grafana, implement circuit breakers, and ensure proper backup and disaster recovery procedures. Health checks and readiness probes are crucial.',
        aiEvaluation: 'Comprehensive answer covering all key aspects of Kubernetes high availability.',
        score: 10
      },
      {
        question: 'Describe your approach to CI/CD pipeline security.',
        candidateResponse: 'I use signed commits, secure secret management with tools like Vault, implement RBAC, scan for vulnerabilities in both code and containers, use admission controllers for policy enforcement, and maintain audit logs. Everything is automated and version controlled.',
        aiEvaluation: 'Excellent security-first approach to CI/CD with practical implementation details.',
        score: 9
      }
    ]
  }
];

export const mockInterviews: MockInterview[] = [
  {
    id: 'int1',
    candidateId: '1',
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    companyName: 'TechCorp Inc.',
    date: '2024-07-01T10:00:00Z',
    status: 'Completed',
    analysisId: '1'
  },
  {
    id: 'int2',
    candidateId: '1',
    jobId: '3',
    jobTitle: 'UX Designer',
    companyName: 'DesignFirst Studio',
    date: '2024-07-05T14:30:00Z',
    status: 'Scheduled'
  },
  {
    id: 'int3',
    candidateId: '2',
    jobId: '2',
    jobTitle: 'DevOps Engineer',
    companyName: 'CloudScale Solutions',
    date: '2024-06-28T11:00:00Z',
    status: 'Completed',
    analysisId: '2'
  }
];

export const mockDocuments: MockDocument[] = [
  {
    id: 'doc1',
    candidateId: '1',
    name: 'SarahJohnson_Resume.pdf',
    uploadDate: '2024-06-10T09:00:00Z',
    fileType: 'application/pdf',
    url: 'https://example.com/documents/sarahjohnson_resume.pdf' // Placeholder URL
  },
  {
    id: 'doc2',
    candidateId: '1',
    name: 'SarahJohnson_CoverLetter.docx',
    uploadDate: '2024-06-10T09:05:00Z',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    url: 'https://example.com/documents/sarahjohnson_coverletter.docx' // Placeholder URL
  }
];

// Helper functions for getting mock data
export const getMockCandidates = (): MockCandidate[] => mockCandidates;
export const getMockJobs = (): MockJob[] => mockJobs;
export const getMockCandidate = (id: string): MockCandidate | undefined => mockCandidates.find(c => c.id === id);
export const getMockJob = (id: string): MockJob | undefined => mockJobs.find(j => j.id === id);
export const getMockInterviewAnalyses = (): MockInterviewAnalysis[] => mockInterviewAnalyses;
export const getMockInterviewAnalysis = (id: string): MockInterviewAnalysis | undefined => 
  mockInterviewAnalyses.find(a => a.id === id);export const getMockInterviewsForCandidate = (candidateId: string): MockInterview[] =>
  mockInterviews.filter(interview => interview.candidateId === candidateId);

export const getMockDocumentsForCandidate = (candidateId: string): MockDocument[] =>
  mockDocuments.filter(document => document.candidateId === candidateId);

// Simulate job applications - in a real app, this would be stored in the database
export const getMockApplicantsForJob = (jobId: string): MockCandidate[] => {
  // For demo purposes, return a subset of candidates based on job ID
  // In reality, this would be candidates who actually applied to the specific job
  const jobApplicantMap: Record<string, string[]> = {
    '1': ['1', '2', '4'], // Senior Frontend Developer
    '2': ['2', '5'],      // DevOps Engineer  
    '3': ['1', '3', '5']  // UX Designer
  };
  
  const applicantIds = jobApplicantMap[jobId] || [];
  return mockCandidates.filter(candidate => applicantIds.includes(candidate.id));
};


// Dashboard metrics
export const getMockDashboardMetrics = () => ({
  candidate: {
    applicationsApplied: 8,
    upcomingInterviews: 3,
    offersReceived: 1,
    aiRecommendedJobs: 12,
    profileViews: 45,
    responseRate: 78
  },
  recruiter: {
    activeJobs: 12,
    candidatesViewed: 156,
    interviewsScheduled: 28,
    successfulHires: 6,
    responseRate: 82,
    avgTimeToHire: 18
  },
  company: {
    totalEmployees: 247,
    activeJobs: 18,
    candidatesInPipeline: 124,
    monthlyBudget: 75000,
    avgTimeToHire: 16,
    offerAcceptanceRate: 87
  },
  admin: {
    totalUsers: 2847,
    totalCompanies: 142,
    systemHealth: 99.2,
    monthlyRevenue: 124800,
    supportTickets: 18,
    activeJobs: 342
  }
});