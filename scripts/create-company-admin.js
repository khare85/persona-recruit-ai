const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ai-talent-stream'
});

const db = admin.firestore();

async function createCompanyAdmin() {
  try {
    // First, get an existing company to assign the admin to
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
    
    console.log(`Creating company admin for company: ${companyData.name} (${companyId})`);
    
    // Check if company admin already exists
    const existingAdminSnapshot = await db.collection('users')
      .where('email', '==', 'admin@designfirst.com')
      .limit(1)
      .get();
    
    if (!existingAdminSnapshot.empty) {
      console.log('Company admin already exists');
      const existingAdmin = existingAdminSnapshot.docs[0];
      const adminId = existingAdmin.id;
      
      // Update existing admin to be company admin for this company
      await db.collection('users').doc(adminId).update({
        role: 'company_admin',
        companyId: companyId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Updated existing user to be company admin');
      return;
    }
    
    // Create new company admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const companyAdminUser = {
      email: 'admin@designfirst.com',
      firstName: 'Company',
      lastName: 'Administrator',
      role: 'company_admin',
      status: 'active',
      companyId: companyId,
      passwordHash: hashedPassword,
      emailVerified: true,
      twoFactorEnabled: false,
      permissions: ['manage_team', 'manage_jobs', 'view_analytics', 'manage_applications'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedAt: null
    };
    
    const userRef = await db.collection('users').add(companyAdminUser);
    console.log(`✅ Company admin user created: ${userRef.id}`);
    
    // Create company admin profile
    const companyAdminProfile = {
      userId: userRef.id,
      companyId: companyId,
      permissions: ['manage_team', 'manage_jobs', 'view_analytics', 'manage_applications'],
      department: 'Administration',
      title: 'Head of Talent Acquisition',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedAt: null
    };
    
    await db.collection('companyAdminProfiles').doc(userRef.id).set(companyAdminProfile);
    console.log('✅ Company admin profile created');
    
    // Update company stats to reflect new admin
    await db.collection('companies').doc(companyId).update({
      'stats.totalEmployees': admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Updated company employee count');
    
    // Create some sample invitations to demonstrate team management
    const sampleInvitations = [
      {
        companyId: companyId,
        email: 'recruiter.new@designfirst.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'recruiter',
        department: 'HR',
        status: 'pending',
        invitedAt: admin.firestore.FieldValue.serverTimestamp(),
        invitedBy: userRef.id,
        invitationType: 'company_admin',
        invitationToken: `comp_inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: null
      },
      {
        companyId: companyId,
        email: 'interviewer.new@designfirst.com',
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'interviewer',
        department: 'Engineering',
        status: 'pending',
        invitedAt: admin.firestore.FieldValue.serverTimestamp(),
        invitedBy: userRef.id,
        invitationType: 'company_admin',
        invitationToken: `comp_inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedAt: null
      }
    ];
    
    for (const invitation of sampleInvitations) {
      const inviteRef = await db.collection('companyInvitations').add(invitation);
      console.log(`✅ Created sample invitation: ${invitation.email} (${inviteRef.id})`);
    }
    
    console.log('\n🎉 Company admin setup complete!');
    console.log(`Company: ${companyData.name}`);
    console.log('Company Admin: admin@designfirst.com / admin123');
    console.log(`Company ID: ${companyId}`);
    console.log(`Admin User ID: ${userRef.id}`);
    
  } catch (error) {
    console.error('Error creating company admin:', error);
  }
  
  process.exit(0);
}

createCompanyAdmin();