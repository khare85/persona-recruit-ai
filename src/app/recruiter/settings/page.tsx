
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
  CheckCircle
} from 'lucide-react';

interface RecruiterProfile {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department: string;
  phone: string;
  bio: string;
  profileImage?: string;
  linkedinUrl?: string;
  specializations: string[];
}

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
  const [profile, setProfile] = useState<RecruiterProfile>({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@techcorp.com',
    title: 'Senior Recruiter',
    department: 'Human Resources',
    phone: '+1 (555) 123-4567',
    bio: 'Experienced technical recruiter with 5+ years in talent acquisition, specializing in engineering and product roles.',
    profileImage: 'https://placehold.co/100x100.png?text=JS',
    specializations: ['Engineering', 'Product Management', 'Data Science']
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
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);

  const handleProfileChange = (field: keyof RecruiterProfile, value: string | string[]) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };
  
  const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Here you would typically upload the file and get a URL
      // For this demo, we'll just show a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
        // In a real app, you'd set the file object to be uploaded, e.g.:
        // setProfile(prev => ({...prev, newProfileImageFile: file}));
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
    try {
      // In real implementation, would save to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Profile saved:', profile);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotifications = async () => {
    setIsLoading(true);
    try {
      // In real implementation, would save to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Notifications saved:', notifications);
    } catch (error) {
      console.error('Error saving notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAISettings = async () => {
    setIsLoading(true);
    try {
      // In real implementation, would save to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('AI settings saved:', aiSettings);
    } catch (error) {
      console.error('Error saving AI settings:', error);
    } finally {
      setIsLoading(false);
    }
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
                      {profile.firstName[0]}{profile.lastName[0]}
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
                      onChange={(e) => handleProfileChange('email', e.target.value)}
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
                  <Label htmlFor="linkedin">LinkedIn Profile (Optional)</Label>
                  <Input
                    id="linkedin"
                    value={profile.linkedinUrl || ''}
                    onChange={(e) => handleProfileChange('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
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
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveProfile} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Profile
                    </>
                  )}
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
                  <div>
                    <h4 className="font-semibold">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">New Applications</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified when candidates apply to your jobs
                    </p>
                  </div>
                  <Switch
                    checked={notifications.newApplications}
                    onCheckedChange={(checked) => handleNotificationChange('newApplications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Interview Reminders</h4>
                    <p className="text-sm text-muted-foreground">
                      Reminders for upcoming interviews you've scheduled
                    </p>
                  </div>
                  <Switch
                    checked={notifications.interviewReminders}
                    onCheckedChange={(checked) => handleNotificationChange('interviewReminders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Candidate Messages</h4>
                    <p className="text-sm text-muted-foreground">
                      Notifications when candidates send messages
                    </p>
                  </div>
                  <Switch
                    checked={notifications.candidateMessages}
                    onCheckedChange={(checked) => handleNotificationChange('candidateMessages', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Weekly Reports</h4>
                    <p className="text-sm text-muted-foreground">
                      Weekly summary of your recruitment metrics
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => handleNotificationChange('weeklyReports', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Job Status Updates</h4>
                    <p className="text-sm text-muted-foreground">
                      Updates when job posting status changes
                    </p>
                  </div>
                  <Switch
                    checked={notifications.jobStatusUpdates}
                    onCheckedChange={(checked) => handleNotificationChange('jobStatusUpdates', checked)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveNotifications} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
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
                  <div>
                    <h4 className="font-semibold">Auto-Screening</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically screen and score applications using AI
                    </p>
                  </div>
                  <Switch
                    checked={aiSettings.autoScreening}
                    onCheckedChange={(checked) => handleAISettingChange('autoScreening', checked)}
                  />
                </div>

                {aiSettings.autoScreening && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="threshold">Screening Threshold (%)</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="threshold"
                        type="number"
                        min="0"
                        max="100"
                        value={aiSettings.screeningThreshold}
                        onChange={(e) => handleAISettingChange('screeningThreshold', parseInt(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        Candidates below this score will be flagged for review
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Smart Matching</h4>
                    <p className="text-sm text-muted-foreground">
                      Get AI-powered candidate recommendations for your jobs
                    </p>
                  </div>
                  <Switch
                    checked={aiSettings.smartMatching}
                    onCheckedChange={(checked) => handleAISettingChange('smartMatching', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Bias Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitor and alert on potential hiring bias
                    </p>
                  </div>
                  <Switch
                    checked={aiSettings.biasDetection}
                    onCheckedChange={(checked) => handleAISettingChange('biasDetection', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Candidate Insights</h4>
                    <p className="text-sm text-muted-foreground">
                      Show AI-generated insights about candidates
                    </p>
                  </div>
                  <Switch
                    checked={aiSettings.candidateInsights}
                    onCheckedChange={(checked) => handleAISettingChange('candidateInsights', checked)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveAISettings} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save AI Settings
                    </>
                  )}
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
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Password</h4>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">Last changed 45 days ago</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">2FA Status</p>
                      <p className="text-sm text-muted-foreground">Not enabled</p>
                    </div>
                    <Button size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Enable 2FA
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Active Sessions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Chrome on MacOS</p>
                        <p className="text-sm text-muted-foreground">San Francisco, CA • Current session</p>
                      </div>
                      <Badge variant="outline">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Current
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}
