"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { auth } from '@/config/firebase';
import { Loader2 } from 'lucide-react';

export default function DebugAuthPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [tokenClaims, setTokenClaims] = useState<any>(null);
  const [refreshingToken, setRefreshingToken] = useState(false);

  useEffect(() => {
    async function fetchClaims() {
      if (auth.currentUser) {
        const tokenResult = await auth.currentUser.getIdTokenResult();
        setTokenClaims(tokenResult.claims);
      }
    }
    fetchClaims();
  }, [user]);

  const refreshToken = async () => {
    setRefreshingToken(true);
    try {
      if (auth.currentUser) {
        const tokenResult = await auth.currentUser.getIdTokenResult(true);
        setTokenClaims(tokenResult.claims);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    } finally {
      setRefreshingToken(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Auth Debug Information</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Current User Info</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>UID:</strong> {user.uid}</p>
                <p><strong>Display Name:</strong> {user.displayName || 'Not set'}</p>
                <p><strong>Full Name:</strong> {user.fullName || 'Not set'}</p>
                <p><strong>Role from Context:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{user.role}</code></p>
                <p><strong>Company ID:</strong> {user.companyId || 'Not set'}</p>
                <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
              </div>
            ) : (
              <p>No user logged in</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Firebase Token Claims</CardTitle>
          </CardHeader>
          <CardContent>
            {tokenClaims ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(tokenClaims, null, 2)}
              </pre>
            ) : (
              <p>No token claims available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
                Go to Admin Dashboard
              </Button>
              <Button onClick={() => router.push('/candidates/dashboard')} variant="outline">
                Go to Candidate Dashboard
              </Button>
              <Button onClick={() => router.push('/company/dashboard')} variant="outline">
                Go to Company Dashboard
              </Button>
            </div>
            <div className="flex gap-4">
              <Button onClick={refreshToken} disabled={refreshingToken}>
                {refreshingToken ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  'Force Refresh Token'
                )}
              </Button>
              <Button onClick={signOut} variant="destructive">
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Troubleshooting Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-orange-700">
            <p>1. If role shows as 'candidate' but should be 'super_admin', the custom claims may not be set properly in Firebase.</p>
            <p>2. Check Firebase Console → Authentication → Users → Click on user → Custom Claims</p>
            <p>3. You may need to set custom claims via Firebase Admin SDK or Cloud Functions</p>
            <p>4. After setting claims, force refresh the token using the button above</p>
            <p>5. Check Firestore → users collection → your user document for the role field</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}