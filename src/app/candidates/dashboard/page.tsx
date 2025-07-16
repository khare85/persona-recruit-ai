"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { 
  Award, 
  Briefcase, 
  CalendarCheck2, 
  User, 
  FileText, 
  Video, 
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import OnboardingModal from '@/components/onboarding/OnboardingModal';

function CandidateDashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile();
  const { 
    isOnboardingComplete, 
    getOnboardingProgress, 
    showOnboardingModal, 
    setShowOnboardingModal 
  } = useOnboarding();
  
  const router = useRouter();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Show loading state
  if (authLoading || profileLoading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </Container>
    );
  }

  // Show error if user not found
  if (!user) {
    return (
      <Container className="py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load your profile. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  // Show profile error if exists (but still allow dashboard access)
  if (profileError) {
    console.warn('Profile loading error:', profileError);
  }

  const onboardingProgress = getOnboardingProgress();
  const userName = user.fullName || `${user.displayName}` || 'there';
  
  // Use fallback profile if needed
  const safeProfile = profile || {
    profileComplete: false,
    onboardingStep: 'resume' as const,
    resumeUploaded: false,
    videoIntroRecorded: false
  };

  return (
    <Container className="py-8">
      {/* Profile Error Warning */}
      {profileError && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            There was an issue loading your profile data. Some features may not work as expected.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {greeting}, {userName}! 👋
        </h1>
        <p className="text-muted-foreground">
          {isOnboardingComplete 
            ? "Welcome to your candidate dashboard. Find your next opportunity here." 
            : "Welcome! Let's complete your profile to get started."}
        </p>
      </div>

      {/* Onboarding Progress */}
      {!isOnboardingComplete && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              Finish setting up your profile to access all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Profile Progress</span>
                <span className="text-sm text-muted-foreground">{onboardingProgress}%</span>
              </div>
              
              <Progress value={onboardingProgress} className="w-full" />
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {safeProfile.resumeUploaded ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Resume Upload</span>
                  {safeProfile.resumeUploaded && (
                    <Badge variant="secondary" className="text-xs">Complete</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-1">
                  {safeProfile.videoIntroRecorded ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Video className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Video Introduction</span>
                  {safeProfile.videoIntroRecorded && (
                    <Badge variant="secondary" className="text-xs">Complete</Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {!safeProfile.resumeUploaded && (
                  <Button 
                    onClick={() => router.push('/candidates/profile')}
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Complete Profile
                  </Button>
                )}
                
                {safeProfile.resumeUploaded && !safeProfile.videoIntroRecorded && (
                  <Button 
                    onClick={() => router.push('/candidates/profile')}
                    size="sm"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Add Video Introduction
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowOnboardingModal(true)}
                >
                  View Guide
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applications</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interviews</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <CalendarCheck2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profile Views</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Find Jobs
            </CardTitle>
            <CardDescription>
              Discover opportunities that match your skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Browse through thousands of job opportunities and apply with AI-powered matching.
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/jobs">
                    Browse Jobs
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/candidates/job-recommendations">
                    AI Recommendations
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your profile and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Keep your profile updated to attract the right opportunities.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/candidates/profile">
                    Edit Profile
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/candidates/settings">
                    Settings
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest actions and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent activity yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start by completing your profile and applying to jobs.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Onboarding Modal */}
      <OnboardingModal />
    </Container>
  );
}

export default function CandidateDashboard() {
  return (
    <ProtectedRoute allowedRoles={['candidate']}>
      <CandidateDashboardContent />
    </ProtectedRoute>
  );
}