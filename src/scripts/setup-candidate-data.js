
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

try {
  const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable not set.');
  }
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'ai-talent-stream'
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function setupCandidateData() {
  try {
    // Get the candidate user
    const candidatesSnapshot = await db.collection('users')
      .where('email', '==', 'candidate@example.com')
      .limit(1)
      .get();
    
    if (candidatesSnapshot.empty) {
      console.error('Candidate not found');
      return;
    }
    
    const candidateDoc = candidatesSnapshot.docs[0];
    const candidateId = candidateDoc.id;
    
    console.log(`Setting up data for candidate ${candidateId}`);
    
    // Create or update candidate profile
    const candidateProfile = {
      userId: candidateId,
      phone: '+1 (555) 123-4567',
      currentTitle: 'Full Stack Developer',
      summary: 'Passionate full-stack developer with 5+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud technologies. Seeking opportunities to contribute to innovative projects and grow with a dynamic team.',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL', 'MongoDB', 'GraphQL'],
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      portfolioUrl: 'https://johndoe.dev',
      location: 'San Francisco, CA',
      availability: 'immediate',
      resumeUrl: null,
      videoIntroUrl: null,
      profileComplete: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await db.collection('candidateProfiles').doc(candidateId).set(candidateProfile, { merge: true });
    console.log('✅ Candidate profile created/updated');
    
    // Get a job to apply to
    const jobsSnapshot = await db.collection('jobs')
      .where('status', '==', 'active')
      .where('deletedAt', '==', null)
      .limit(1)
      .get();
    
    if (!jobsSnapshot.empty) {
      const jobDoc = jobsSnapshot.docs[0];
      const jobId = jobDoc.id;
      const jobData = jobDoc.data();
      
      console.log(`Creating application for job: ${jobData.title} (${jobId})`);
      
      // Check if application already exists
      const existingAppSnapshot = await db.collection('jobApplications')
        .where('candidateId', '==', candidateId)
        .where('jobId', '==', jobId)
        .where('deletedAt', '==', null)
        .limit(1)
        .get();
      
      if (existingAppSnapshot.empty) {
        // Create a job application
        const application = {
          candidateId: candidateId,
          jobId: jobId,
          companyId: jobData.companyId,
          status: 'submitted',
          coverLetter: 'I am excited to apply for this position. My experience in full-stack development and passion for creating innovative solutions make me an ideal candidate. I have successfully delivered multiple projects using similar technologies and am eager to contribute to your team.',
          resumeUrl: null,
          appliedAt: admin.firestore.FieldValue.serverTimestamp(),
          timeline: [
            {
              date: new Date().toISOString(),
              event: 'Application submitted',
              status: 'submitted'
            }
          ],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          deletedAt: null
        };
        
        const appRef = await db.collection('jobApplications').add(application);
        console.log(`✅ Job application created: ${appRef.id}`);
        
        // Create a second application for another job if available
        const moreJobsSnapshot = await db.collection('jobs')
          .where('status', '==', 'active')
          .where('deletedAt', '==', null)
          .limit(2)
          .get();
        
        if (moreJobsSnapshot.docs.length > 1) {
          const secondJobDoc = moreJobsSnapshot.docs[1];
          const secondJobId = secondJobDoc.id;
          const secondJobData = secondJobDoc.data();
          
          console.log(`Creating second application for job: ${secondJobData.title} (${secondJobId})`);
          
          const secondApplication = {
            candidateId: candidateId,
            jobId: secondJobId,
            companyId: secondJobData.companyId,
            status: 'under_review',
            coverLetter: 'I believe my skills and experience align perfectly with your requirements. I am particularly interested in this role because it offers the opportunity to work with cutting-edge technologies and contribute to meaningful projects.',
            resumeUrl: null,
            appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            timeline: [
              {
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                event: 'Application submitted',
                status: 'submitted'
              },
              {
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                event: 'Application under review',
                status: 'under_review'
              }
            ],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            deletedAt: null
          };
          
          const secondAppRef = await db.collection('jobApplications').add(secondApplication);
          console.log(`✅ Second job application created: ${secondAppRef.id}`);
        }
      } else {
        console.log('Application already exists for this job');
      }
    } else {
      console.log('No active jobs found to apply to');
    }
    
    // Update user to ensure firstName and lastName are set
    await db.collection('users').doc(candidateId).update({
      firstName: 'John',
      lastName: 'Doe',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Updated user name');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

setupCandidateData();
