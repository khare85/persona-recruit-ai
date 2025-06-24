import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { firebaseConfigService } from '@/services/firebaseConfig.service';

// Update Firestore rules
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    
    // Only super admins can update rules
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Super admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { rules, type } = body;
    
    if (!rules || !type) {
      return NextResponse.json(
        { error: 'Rules and type are required' },
        { status: 400 }
      );
    }
    
    if (!['firestore', 'storage'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "firestore" or "storage"' },
        { status: 400 }
      );
    }
    
    const updatedBy = `${user.firstName} ${user.lastName} (${user.email})`;
    
    if (type === 'firestore') {
      await firebaseConfigService.updateFirestoreRules(rules, updatedBy);
    } else {
      await firebaseConfigService.updateStorageRules(rules, updatedBy);
    }
    
    return NextResponse.json({
      success: true,
      message: `${type} rules updated successfully`
    });
    
  } catch (error) {
    console.error('Error updating rules:', error);
    return NextResponse.json(
      { error: 'Failed to update rules' },
      { status: 500 }
    );
  }
});