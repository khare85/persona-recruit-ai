import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase/server';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      const authorization = req.headers.get('authorization');
      
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const token = authorization.split(' ')[1];
      
      try {
        const decodedToken = await auth.verifyIdToken(token);
        
        const authenticatedRequest = req as AuthenticatedRequest;
        authenticatedRequest.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: decodedToken.role || 'candidate'
        };
        
        return await handler(authenticatedRequest);
      } catch (error) {
        console.error('Token verification failed:', error);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
  };
}