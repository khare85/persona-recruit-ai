
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Mail, 
  Calendar,
  Brain,
  Key,
  Camera,
  Loader2,
  Save,
  CheckCircle,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  emailNotifications: boolean;
  newApplications: boolean;
  interviewReminders: boolean;
  candidateMessages: boolean;
  weeklyReports: boolean;
  jobStatusUpdates: boolean;
}

interface AISettings {
  autoScreening: boolean;
  screeningThreshold: number;
  smartMatching: boolean;
  biasDetection: boolean;
  candidateInsights: boolean;
}

export default function RecruiterSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    title: 'Senior Recruiter',
    department: 'Human Resources',
    phone: '+1 (555) 123-4567',
    bio: 'Experienced technical recruiter with 5+ years in talent acquisition, specializing in engineering and product roles.',
    profileImage: 'https://placehold.co/100x100.png?text=JS',
    specializations: ['Engineering', 'Product Management', 'Data Science'],
    companyId: '',
    companyName: 'Loading...'
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    newApplications: true,
    interviewReminders: true,
    candidateMessages: false,
    weeklyReports: true,
    jobStatusUpdates: true
  });

  const [aiSettings, setAISettings] = useState<AISettings>({
    autoScreening: true,
    screeningThreshold: 75,
    smartMatching: true,
    biasDetection: true,
    candidateInsights: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      const [firstName, ...lastNameParts] = user.displayName?.split(' ') || ['Demo', 'Recruiter'];
      const lastName = lastNameParts.join(' ');
      
      setProfile(prev => ({
        ...prev,
        firstName: firstName || '',
        lastName: lastName || '',
        email: user.email || '',
        companyId: user.companyId || ''
      }));

      if (user.companyId) {
        fetch(`/api/companies/${user.companyId}`)
          .then(res => res.json())
          .then(data => {
            if (data.name) {
              setProfile(prev => ({ ...prev, companyName: data.name }));
            } else {
              setProfile(prev => ({ ...prev, companyName: 'Company Not Found' }));
            }
          })
          .catch(() => {
            setProfile(prev => ({ ...prev, companyName: 'Error fetching company' }));
          });
      } else {
        setProfile(prev => ({...prev, companyName: 'Not Assigned to a Company'}));
      }
    }
  }, [user, authLoading]);

  const handleProfileChange = (field: keyof typeof profile, value: string | string[]) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePicFile(file); // Store file object for upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationChange = (field: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  const handleAISettingChange = (field: keyof AISettings, value: boolean | number) => {
    setAISettings(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    setIsLoading(true);
    const updatedProfileData = { ...profile };

    try {
      // Step 1: Upload profile picture if a new one is selected
      if (profilePicFile && user) {
        const formData = new FormData();
        formData.append('file', profilePicFile);
        formData.append('userId', user.id);

        const uploadResponse = await fetch('/api/upload/profile-picture', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload profile picture.');
        }

        const uploadResult = await uploadResponse.json();
        updatedProfileData.profileImage = uploadResult.imageUrl;
      }

      // Step 2: Save the updated profile data (including the new image URL)
      // This part is still a simulation as there's no specific API endpoint for it.
      // The important part is that we're now handling the image upload.
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Profile saved:', updatedProfileData);
      
      setProfile(updatedProfileData);
      setProfilePicFile(null);

      toast({
        title: "Profile Saved!",
        description: "Your profile settings have been updated.",
        action: <CheckCircle className="text-green-500" />,
      });

    } catch (error) {
      console.error('Error saving profile:', error);
       toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Could not save profile settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveNotifications = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Notifications saved:', notifications);
    setIsLoading(false);
  };

  const saveAISettings = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('AI settings saved:', aiSettings);
    setIsLoading(false);
  };

  const addSpecialization = (specialization: string) => {
    if (specialization && !profile.specializations.includes(specialization)) {
      handleProfileChange('specializations', [...profile.specializations, specialization]);
    }
  };

  const removeSpecialization = (specialization: string) => {
    handleProfileChange('specializations', profile.specializations.filter(s => s !== specialization));
  };

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Settings className="mr-3 h-8 w-8 text-primary" />
            Recruiter Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile, preferences, and AI-powered recruiting tools
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="ai-settings">AI Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and professional information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profilePicPreview || profile.profileImage} alt={profile.firstName} />
                    <AvatarFallback className="text-2xl">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      type="button"
                      onClick={() => profilePicRef.current?.click()}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Change Photo
                    </Button>
                    <input
                      type="file"
                      ref={profilePicRef}
                      onChange={handleProfilePicChange}
                      className="hidden"
                      accept="image/png, image/jpeg, image/gif"
                    />
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                 <div className="space-y-2">
                  <Label htmlFor="companyName">Company</Label>
                  <Select value={profile.companyId} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Loading company..." />
                    </SelectTrigger>
                    <SelectContent>
                    {profile.companyId && (
                        <SelectItem value={profile.companyId}>
                          {profile.companyName}
                        </SelectItem>
                    )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={profile.title}
                      onChange={(e) => handleProfileChange('title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      value={profile.department} 
                      onValueChange={(value) => handleProfileChange('department', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                    placeholder="Tell us about your recruiting experience and expertise..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recruiting Specializations</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profile.specializations.map((spec) => (
                      <Badge key={spec} variant="secondary" className="flex items-center gap-1">
                        {spec}
                        <button onClick={() => removeSpecialization(spec)} className="ml-1 text-xs">×</button>
                      </Badge>
                    ))}
                  </div>
                  <Select onValueChange={addSpecialization}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Product Management">Product Management</SelectItem>
                      <SelectItem value="Data Science">Data Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveProfile} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Profile
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about recruitment activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotifications" className="flex-1">Email Notifications</Label>
                  <Switch
                    id="emailNotifications"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="newApplications" className="flex-1">New Applications</Label>
                  <Switch
                    id="newApplications"
                    checked={notifications.newApplications}
                    onCheckedChange={(checked) => handleNotificationChange('newApplications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="interviewReminders" className="flex-1">Interview Reminders</Label>
                  <Switch
                    id="interviewReminders"
                    checked={notifications.interviewReminders}
                    onCheckedChange={(checked) => handleNotificationChange('interviewReminders', checked)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveNotifications} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Notifications
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="ai-settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-primary" />
                  AI-Powered Features
                </CardTitle>
                <CardDescription>
                  Configure AI assistance for your recruitment workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoScreening" className="flex-1">Auto-Screening</Label>
                  <Switch
                    id="autoScreening"
                    checked={aiSettings.autoScreening}
                    onCheckedChange={(checked) => handleAISettingChange('autoScreening', checked)}
                  />
                </div>
                {aiSettings.autoScreening && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="threshold">Screening Threshold (%)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      min="0"
                      max="100"
                      value={aiSettings.screeningThreshold}
                      onChange={(e) => handleAISettingChange('screeningThreshold', parseInt(e.target.value))}
                      className="w-20"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label htmlFor="smartMatching" className="flex-1">Smart Matching</Label>
                  <Switch
                    id="smartMatching"
                    checked={aiSettings.smartMatching}
                    onCheckedChange={(checked) => handleAISettingChange('smartMatching', checked)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveAISettings} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save AI Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Password</h4>
                    <p className="text-sm text-muted-foreground">Last changed 45 days ago</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Not enabled</p>
                  </div>
                  <Button size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}
