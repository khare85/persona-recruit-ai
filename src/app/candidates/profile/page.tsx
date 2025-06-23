'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Link as LinkIcon, 
  FileText, 
  VideoIcon, 
  Edit, 
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Clock,
  Briefcase
} from 'lucide-react';

interface CandidateProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentTitle: string;
  summary: string;
  skills: string[];
  linkedinUrl?: string;
  portfolioUrl?: string;
  location?: string;
  availability?: string;
  resumeUrl?: string;
  videoIntroUrl?: string;
  profileComplete: boolean;
}

const availabilityLabels = {
  immediate: 'Available immediately',
  within_2_weeks: 'Available within 2 weeks',
  within_month: 'Available within a month',
  flexible: 'Flexible timing'
};

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/candidates/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      setError('An error occurred while loading your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getProfileCompleteness = () => {
    if (!profile) return 0;
    
    const fields = [
      profile.firstName,
      profile.lastName,
      profile.currentTitle,
      profile.summary,
      profile.skills.length > 0,
      profile.videoIntroUrl,
      profile.resumeUrl,
      profile.phone,
      profile.location
    ];
    
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              {error || "We couldn't load your profile. Please try again or contact support."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/candidates/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completeness = getProfileCompleteness();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your professional information</p>
            </div>
            <Link href="/candidates/profile/edit">
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Completeness */}
        {completeness < 100 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your profile is {completeness}% complete. 
              <Link href="/candidates/profile/edit" className="ml-1 text-blue-600 hover:underline">
                Complete your profile
              </Link> to improve your visibility to employers.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Profile Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="text-gray-600">{profile.currentTitle}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{profile.email}</span>
                  </div>
                  
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  
                  {profile.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}

                  {profile.availability && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{availabilityLabels[profile.availability as keyof typeof availabilityLabels]}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Professional Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{profile.summary}</p>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No skills added yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Professional Links */}
            {(profile.linkedinUrl || profile.portfolioUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    Professional Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  )}
                  
                  {profile.portfolioUrl && (
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Portfolio/Website
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Completeness */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Profile Completeness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{completeness}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                  {completeness === 100 && (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Complete!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Video Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <VideoIcon className="h-4 w-4" />
                  Video Introduction
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.videoIntroUrl ? (
                  <div className="space-y-3">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <video
                        src={profile.videoIntroUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push('/candidates/profile/edit')}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Update Video
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <VideoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">No video introduction</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push('/candidates/profile/edit')}
                    >
                      Add Video
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resume */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.resumeUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <span className="text-xs text-gray-600 flex-1">Resume uploaded</span>
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(profile.resumeUrl, '_blank')}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        View Resume
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push('/candidates/profile/edit')}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Update Resume
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                    </div>
                    <p className="text-xs text-gray-500">No resume uploaded</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push('/candidates/profile/edit')}
                    >
                      Upload Resume
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/candidates/my-applications">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Briefcase className="h-4 w-4 mr-2" />
                    View Applications
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Browse Jobs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}