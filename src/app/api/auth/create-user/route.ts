
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { firebaseConfigService } from '@/services/firebaseConfig.service';

// Create user with role
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    
    // Only admins can create users
    if (!['super_admin', 'company_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role, 
      companyId, 
      department, 
      permissions,
      sendWelcomeEmail = true
    } = body;
    
    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Email, first name, last name, and role are required' },
        { status: 400 }
      );
    }
    
    // Company admins can only create users in their company
    if (user.role === 'company_admin') {
      if (!companyId || companyId !== user.companyId) {
        return NextResponse.json(
          { error: 'Company admins can only create users in their own company' },
          { status: 403 }
        );
      }
    }
    
    // Validate role permissions
    const config = await firebaseConfigService.getFirebaseConfig();
    if (!config.roles[role]) {
      return NextResponse.json(
        { error: `Invalid role: ${role}` },
        { status: 400 }
      );
    }
    
    // Super admins can create any role, company admins cannot create super admins
    if (user.role === 'company_admin' && role === 'super_admin') {
      return NextResponse.json(
        { error: 'Company admins cannot create super admin users' },
        { status: 403 }
      );
    }
    
    const userData = {
      email,
      password,
      firstName,
      lastName,
      role,
      companyId,
      department,
      permissions
    };
    
    const userRecord = await firebaseConfigService.createUserWithRole(userData);
    
    // Log the user creation
    console.log(`User created: ${email} with role ${role} by ${user.email}`);
    
    // Send welcome email if requested
    if (sendWelcomeEmail) {
      // TODO: Implement email service
      console.log(`Welcome email should be sent to ${email}`);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role,
        companyId,
        department
      },
      message: 'User created successfully'
    });
    
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password is too weak' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
});

// Update user role
export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    
    // Only admins can update user roles
    if (!['super_admin', 'company_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { userId, role, permissions } = body;
    
    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }
    
    // Validate role exists
    const config = await firebaseConfigService.getFirebaseConfig();
    if (!config.roles[role]) {
      return NextResponse.json(
        { error: `Invalid role: ${role}` },
        { status: 400 }
      );
    }
    
    // Company admins cannot promote users to super admin
    if (user.role === 'company_admin' && role === 'super_admin') {
      return NextResponse.json(
        { error: 'Company admins cannot assign super admin role' },
        { status: 403 }
      );
    }
    
    await firebaseConfigService.updateUserRole(userId, role, permissions);
    
    // Update user document in Firestore
    const admin = require('firebase-admin');
    await admin.firestore().collection('users').doc(userId).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({
      success: true,
      message: 'User role updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
});

    