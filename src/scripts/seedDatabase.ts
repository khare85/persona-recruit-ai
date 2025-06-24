
/**
 * Database seeding script for development and initial production setup
 */

import { databaseService } from '../src/services/database.service';
import { dbLogger } from '../src/lib/logger';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create admin user
    const adminUserId = await databaseService.createUser({
      email: 'admin@talentai.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'super_admin',
      status: 'active',
      emailVerified: true,
      passwordHash: 'admin123' // Will be hashed by the service
    });

    console.log('✅ Created super admin user:', adminUserId);

    // Create a sample company
    const companyId = await databaseService.createCompany({
      name: 'TechCorp Inc.',
      domain: 'techcorp.com',
      industry: 'Technology',
      size: '100-500',
      description: 'A leading technology company specializing in AI solutions.',
      website: 'https://techcorp.com',
      logo: 'https://placehold.co/100x100.png',
      location: {
        country: 'United States',
        city: 'San Francisco',
        state: 'California'
      },
      settings: {
        autoApproveApplications: false,
        requireVideoIntroductions: true,
        allowCandidateMessaging: true
      },
      plan: 'professional',
      isActive: true
    });

    console.log('✅ Created company:', companyId);

    // Create company admin user
    const companyAdminUserId = await databaseService.createUser({
      email: 'admin@techcorp.com',
      firstName: 'Jane',
      lastName: 'Admin',
      role: 'company_admin',
      status: 'active',
      emailVerified: true,
      passwordHash: 'admin123'
    });

    console.log('✅ Created company admin user:', companyAdminUserId);

    // Create interviewer user
    const interviewerUserId = await databaseService.createUser({
      email: 'interviewer@techcorp.com',
      firstName: 'Alex',
      lastName: 'Interviewer',
      role: 'interviewer',
      status: 'active',
      emailVerified: true,
      passwordHash: 'interviewer123'
    });
    
    // Create interviewer profile
    await databaseService.createInterviewerProfile({
        userId: interviewerUserId,
        companyId: companyId,
        department: 'Engineering',
        title: 'Senior Software Engineer',
        expertise: ['Frontend Development', 'System Design', 'React'],
        interviewTypes: ['technical', 'behavioral'],
        totalInterviews: 42,
        averageRating: 4.8
    });

    console.log('✅ Created interviewer user and profile:', interviewerUserId);

    // Create candidate user
    const candidateUserId = await databaseService.createUser({
      email: 'candidate@example.com',
      firstName: 'John',
      lastName: 'Candidate',
      role: 'candidate',
      status: 'active',
      emailVerified: true,
      passwordHash: 'candidate123'
    });

    console.log('✅ Created candidate user:', candidateUserId);

    // Create candidate profile
    await databaseService.createCandidateProfile({
      userId: candidateUserId,
      currentTitle: 'Senior Software Engineer',
      experience: '5-10 years',
      location: 'San Francisco, CA',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
      summary: 'Experienced software engineer with a passion for building scalable web applications. Strong background in full-stack development with modern technologies.',
      phone: '+1-555-0123',
      linkedinUrl: 'https://linkedin.com/in/johncandidate',
      portfolioUrl: 'https://johncandidate.dev',
      profileComplete: true,
      availableForWork: true,
      expectedSalary: {
        min: 120000,
        max: 150000,
        currency: 'USD'
      },
      willingToRelocate: true,
      preferredLocations: ['San Francisco', 'New York', 'Seattle'],
      preferredJobTypes: ['Full-time', 'Remote']
    });

    console.log('✅ Created candidate profile');

    // Create a sample job
    const jobId = await databaseService.createJob({
      title: 'Senior Full Stack Developer',
      description: 'We are looking for a senior full stack developer to join our team and help build the next generation of AI-powered applications.',
      requirements: [
        '5+ years of full stack development experience',
        'Strong knowledge of React, Node.js, and databases',
        'Experience with cloud platforms (AWS/GCP/Azure)',
        'Knowledge of AI/ML concepts is a plus'
      ],
      responsibilities: [
        'Design and develop scalable web applications',
        'Collaborate with cross-functional teams',
        'Mentor junior developers',
        'Participate in code reviews and technical discussions'
      ],
      benefits: [
        'Competitive salary and equity',
        'Health, dental, and vision insurance',
        'Flexible work arrangements',
        'Professional development budget'
      ],
      companyId: companyId,
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'Full-time',
      remote: true,
      salaryRange: {
        min: 120000,
        max: 180000,
        currency: 'USD'
      },
      experienceLevel: 'Senior',
      postedBy: companyAdminUserId,
      status: 'active',
      featured: true,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    console.log('✅ Created job posting:', jobId);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Test credentials:');
    console.log('Super Admin: admin@talentai.com / admin123');
    console.log('Company Admin: admin@techcorp.com / admin123');
    console.log('Interviewer: interviewer@techcorp.com / interviewer123');
    console.log('Candidate: candidate@example.com / candidate123');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedDatabase };
