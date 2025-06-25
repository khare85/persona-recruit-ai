
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

async function assignRecruiterToCompany() {
  try {
    // Get the recruiter user
    const recruitersSnapshot = await db.collection('users')
      .where('email', '==', 'recruiter@techcorp.com')
      .limit(1)
      .get();
    
    if (recruitersSnapshot.empty) {
      console.error('Recruiter not found');
      return;
    }
    
    const recruiterDoc = recruitersSnapshot.docs[0];
    const recruiterId = recruiterDoc.id;
    
    // Get the first company
    const companiesSnapshot = await db.collection('companies')
      .where('deletedAt', '==', null)
      .limit(1)
      .get();
    
    if (companiesSnapshot.empty) {
      console.error('No companies found. Please create a company first.');
      return;
    }
    
    const companyDoc = companiesSnapshot.docs[0];
    const companyId = companyDoc.id;
    const companyData = companyDoc.data();
    
    console.log(`Assigning recruiter ${recruiterId} to company ${companyId} (${companyData.name})`);
    
    // Update the recruiter's Firestore document
    await db.collection('users').doc(recruiterId).update({
      companyId: companyId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✓ Recruiter document updated in Firestore.');

    // Update the recruiter's Auth custom claims
    await admin.auth().setCustomUserClaims(recruiterId, {
      role: 'recruiter',
      companyId: companyId
    });
    console.log('✓ Recruiter custom claims updated in Firebase Auth.');
    
    // Also create some sample jobs for testing
    const sampleJobs = [
      {
        title: 'Senior Software Engineer',
        description: 'We are looking for a senior software engineer to join our team...',
        department: 'Engineering',
        location: 'Remote',
        employmentType: 'Full-time',
        salaryRange: '$120,000 - $180,000',
        requirements: ['5+ years experience', 'React', 'Node.js', 'TypeScript'],
        companyId: companyId,
        recruiterId: recruiterId,
        status: 'active',
        stats: {
          views: 0,
          applications: 0,
          interviews: 0
        }
      },
      {
        title: 'Product Designer',
        description: 'Join our design team to create amazing user experiences...',
        department: 'Design',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        salaryRange: '$100,000 - $140,000',
        requirements: ['3+ years experience', 'Figma', 'UI/UX Design', 'Prototyping'],
        companyId: companyId,
        recruiterId: recruiterId,
        status: 'active',
        stats: {
          views: 0,
          applications: 0,
          interviews: 0
        }
      }
    ];
    
    for (const job of sampleJobs) {
      const jobRef = await db.collection('jobs').add({
        ...job,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: null
      });
      console.log(`✅ Created sample job: ${job.title} (${jobRef.id})`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

assignRecruiterToCompany();
