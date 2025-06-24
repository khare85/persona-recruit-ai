import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { firebaseConfigService } from '@/services/firebaseConfig.service';

// Get all roles
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    
    // Allow company admins and super admins to view roles
    if (!['super_admin', 'company_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }
    
    const config = await firebaseConfigService.getFirebaseConfig();
    
    return NextResponse.json({
      success: true,
      data: { roles: config.roles }
    });
    
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
});

// Create new role
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    
    // Only super admins can create roles
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Super admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { roleName, roleConfig } = body;
    
    if (!roleName || !roleConfig) {
      return NextResponse.json(
        { error: 'Role name and configuration are required' },
        { status: 400 }
      );
    }
    
    const updatedBy = `${user.firstName} ${user.lastName} (${user.email})`;
    await firebaseConfigService.createRole(roleName, roleConfig, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: 'Role created successfully'
    });
    
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
});

// Delete role
export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    
    // Only super admins can delete roles
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Super admin access required' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const roleName = searchParams.get('role');
    
    if (!roleName) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }
    
    const updatedBy = `${user.firstName} ${user.lastName} (${user.email})`;
    await firebaseConfigService.deleteRole(roleName, updatedBy);
    
    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
});