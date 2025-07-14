'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Eye, 
  Mail,
  Phone,
  MapPin,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Key,
  Globe,
  Palette,
  Camera,
  Loader2,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useToast } from '@/hooks/use-toast';
import { ResumeUploadWithProcessing } from '@/components/resume/ResumeUploadWithProcessing';

interface CandidateProfile {
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
}

interface NotificationSettings {
  emailJobs: boolean;
  emailInterview: boolean;
  emailMessages: boolean;
  pushNotifications: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  showSalaryExpectation: boolean;
  allowRecruiterContact: boolean;
}

export default function CandidateSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailJobs: true,
    emailInterview: true,
    emailMessages: false,
    pushNotifications: true
  });
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showSalaryExpectation: true,
    allowRecruiterContact: true
  });
  
  const [newSkill, setNewSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      if (authLoading || !user) return;
      try {
        const result = await authenticatedFetch('/api/candidates/profile');
        setProfile(result.profile);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load settings. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, [user, authLoading, authenticatedFetch, toast]);

  const handleProfileChange = (field: keyof CandidateProfile, value: string) => {
    setProfile(prev => (prev ? { ...prev, [field]: value } : null));
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

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await authenticatedFetch('/api/candidates/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      });
      toast({
        title: "Settings Saved!",
        description: "Your settings have been updated.",
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : "Could not save settings.",
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <Container className="py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </Container>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <Container className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load profile data. Please try logging out and in again.
            </AlertDescription>
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container className="max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Settings className="mr-3 h-8 w-8 text-primary" />
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile, preferences, and privacy settings
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ResumeUploadWithProcessing onUploadComplete={fetchProfile} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={profile.firstName} onChange={(e) => handleProfileChange('firstName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={profile.lastName} onChange={(e) => handleProfileChange('lastName', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs would go here */}

        </Tabs>
        
        <div className="flex justify-end pt-6">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </Container>
    </DashboardLayout>
  );
}
