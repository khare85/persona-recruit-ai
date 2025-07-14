
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  MapPin, 
  Phone, 
  Link as LinkIcon, 
  FileText, 
  VideoIcon, 
  Save, 
  Upload, 
  X, 
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Camera,
  RefreshCw
} from 'lucide-react';
import { resumeProcessingService } from '@/services/resumeProcessing.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ResumeUploadWithProcessing } from '@/components/resume/ResumeUploadWithProcessing';

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

export default function CandidateProfileEditPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  
  const router = useRouter();
  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/candidates/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          router.push('/candidates/profile');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('An error occurred while updating your profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && profile && !profile.skills.includes(newSkill.trim())) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (profile) {
      setProfile({
        ...profile,
        skills: profile.skills.filter(skill => skill !== skillToRemove)
      });
    }
  };

  const handleResumeEnrichment = async (result: any) => {
    toast({
      title: 'Resume Processed',
      description: 'Your profile will be updated with the latest information.',
    });
    
    // Refresh profile data after enrichment
    await fetchProfile();
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

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              We couldn't load your profile. Please try again or contact support.
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-gray-600">Update your information and preferences</p>
            </div>
            <Link href="/candidates/profile">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        
        {/* Enrich Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Enrich Profile with Resume</CardTitle>
            <CardDescription>
              Upload a new resume to automatically update your profile with AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResumeUploadWithProcessing onUploadComplete={handleResumeEnrichment} />
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Your basic contact information and current role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contact support to change your email address
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location || ''}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currentTitle">Current Title</Label>
                <Input
                  id="currentTitle"
                  value={profile.currentTitle}
                  onChange={(e) => setProfile({ ...profile, currentTitle: e.target.value })}
                  placeholder="Senior Software Engineer"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Summary</CardTitle>
              <CardDescription>
                Tell us about your experience and what you're looking for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={profile.summary}
                  onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                  placeholder="Describe your experience, skills, and career goals..."
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {profile.summary.length} characters
                </p>
              </div>

              <div className="mt-4">
                <Label htmlFor="availability">Availability</Label>
                <select
                  id="availability"
                  value={profile.availability || ''}
                  onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select availability</option>
                  <option value="immediate">Available immediately</option>
                  <option value="within_2_weeks">Available within 2 weeks</option>
                  <option value="within_month">Available within a month</option>
                  <option value="flexible">Flexible timing</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
              <CardDescription>
                Add skills that showcase your expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddSkill} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {profile.skills.length === 0 && (
                  <p className="text-gray-500 text-sm">No skills added yet. Add some skills to showcase your expertise.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Professional Links
              </CardTitle>
              <CardDescription>
                Add links to your professional profiles and portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={profile.linkedinUrl || ''}
                  onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <Label htmlFor="portfolioUrl">Portfolio/Website</Label>
                <Input
                  id="portfolioUrl"
                  type="url"
                  value={profile.portfolioUrl || ''}
                  onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Actions */}
          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href="/candidates/profile">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
