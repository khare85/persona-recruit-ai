import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { firebaseConfigService } from '@/services/firebaseConfig.service';

// Get Firebase configuration
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    
    // Only super admins can view Firebase configuration
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Super admin access required' },
        { status: 403 }
      );
    }
    
    const config = await firebaseConfigService.getFirebaseConfig();
    
    return NextResponse.json({
      success: true,
      data: { config }
    });
    
  } catch (error) {
    console.error('Error fetching Firebase config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Firebase configuration' },
      { status: 500 }
    );
  }
});

// Update Firebase configuration
export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    
    // Only super admins can modify Firebase configuration
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Super admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { config, section } = body;
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration data is required' },
        { status: 400 }
      );
    }
    
    const updatedBy = `${user.firstName} ${user.lastName} (${user.email})`;
    
    if (section) {
      // Update specific section
      const partialConfig = { [section]: config };
      await firebaseConfigService.updateFirebaseConfig(partialConfig, updatedBy);
    } else {
      // Update entire configuration
      await firebaseConfigService.updateFirebaseConfig(config, updatedBy);
    }
    
    const updatedConfig = await firebaseConfigService.getFirebaseConfig();
    
    return NextResponse.json({
      success: true,
      data: { config: updatedConfig },
      message: 'Firebase configuration updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating Firebase config:', error);
    return NextResponse.json(
      { error: 'Failed to update Firebase configuration' },
      { status: 500 }
    );
  }
});