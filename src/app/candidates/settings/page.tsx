'use client';

import { useState } from 'react';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  Upload,
  Download,
  Trash2,
  Save,
  ArrowLeft,
  AlertCircle,
  Check,
  Key,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function CandidateSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailJobs: true,
    emailInterview: true,
    emailMessages: false,
    pushNotifications: true,
    weeklyDigest: true,
    marketingEmails: false
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showSalaryExpectation: true,
    showContactInfo: false,
    allowRecruiterContact: true,
    showExperience: true,
    showEducation: true
  });

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <Container className="max-w-4xl">
        <div className="mb-8">
          <Link href="/candidates/dashboard" passHref>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Settings className="mr-3 h-8 w-8 text-primary" />
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile, preferences, and privacy settings
          </p>
        </div>

        {saveSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <Check className="h-4 w-4" />
            <AlertDescription>Settings saved successfully!</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="Sarah" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Johnson" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="sarah.johnson@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue="+1 (555) 123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" defaultValue="San Francisco, CA" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" defaultValue="Pacific Time (PT)" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Summary</Label>
                  <Textarea 
                    id="bio" 
                    rows={4}
                    defaultValue="Experienced software engineer with 5+ years developing scalable web applications. Passionate about React, Node.js, and cloud technologies. Strong background in agile development and team leadership."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5 text-primary" />
                  Professional Information
                </CardTitle>
                <CardDescription>
                  Your current role and career preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentTitle">Current Title</Label>
                    <Input id="currentTitle" defaultValue="Senior Software Engineer" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentCompany">Current Company</Label>
                    <Input id="currentCompany" defaultValue="Tech Solutions Inc." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input id="experience" defaultValue="5-7 years" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryExpectation">Salary Expectation</Label>
                    <Input id="salaryExpectation" defaultValue="$120,000 - $150,000" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="skills">Key Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'GraphQL'].map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                  <Input id="skills" placeholder="Add new skills..." />
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LinkIcon className="mr-2 h-5 w-5 text-primary" />
                  Professional Links
                </CardTitle>
                <CardDescription>
                  Add your professional social media and portfolio links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <Input id="linkedin" defaultValue="https://linkedin.com/in/sarah-johnson" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub Profile</Label>
                  <Input id="github" defaultValue="https://github.com/sarah-johnson" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio Website</Label>
                  <Input id="portfolio" defaultValue="https://sarah-johnson.dev" />
                </div>
              </CardContent>
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
                  Choose how you want to be notified about opportunities and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Job Recommendations</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for new job matches
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.emailJobs}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, emailJobs: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Interview Invitations</h4>
                      <p className="text-sm text-muted-foreground">
                        Get notified when employers invite you for interviews
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.emailInterview}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, emailInterview: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Messages from Recruiters</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for direct messages from recruiters
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.emailMessages}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, emailMessages: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Enable browser push notifications for urgent updates
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Weekly Job Digest</h4>
                      <p className="text-sm text-muted-foreground">
                        Weekly summary of new opportunities matching your profile
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.weeklyDigest}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, weeklyDigest: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Marketing Emails</h4>
                      <p className="text-sm text-muted-foreground">
                        Tips, industry insights, and platform updates
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) => 
                        setNotifications(prev => ({ ...prev, marketingEmails: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2 h-5 w-5 text-primary" />
                  Privacy & Visibility
                </CardTitle>
                <CardDescription>
                  Control who can see your profile and contact you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Profile Visibility</h4>
                      <p className="text-sm text-muted-foreground">
                        Make your profile visible to recruiters and employers
                      </p>
                    </div>
                    <Switch 
                      checked={privacy.profileVisibility === 'public'}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ 
                          ...prev, 
                          profileVisibility: checked ? 'public' : 'private' 
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Show Salary Expectation</h4>
                      <p className="text-sm text-muted-foreground">
                        Display your salary expectations on your profile
                      </p>
                    </div>
                    <Switch 
                      checked={privacy.showSalaryExpectation}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, showSalaryExpectation: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Show Contact Information</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow verified recruiters to see your email and phone
                      </p>
                    </div>
                    <Switch 
                      checked={privacy.showContactInfo}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, showContactInfo: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Allow Recruiter Contact</h4>
                      <p className="text-sm text-muted-foreground">
                        Let recruiters send you direct messages about opportunities
                      </p>
                    </div>
                    <Switch 
                      checked={privacy.allowRecruiterContact}
                      onCheckedChange={(checked) => 
                        setPrivacy(prev => ({ ...prev, allowRecruiterContact: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-primary" />
                  Account Security
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Password</h4>
                      <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                    </div>
                    <Button variant="outline">
                      <Key className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline">
                      Enable 2FA
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Active Sessions</h4>
                      <p className="text-sm text-muted-foreground">Manage your logged-in devices</p>
                    </div>
                    <Button variant="outline">
                      <Globe className="mr-2 h-4 w-4" />
                      View Sessions
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Danger Zone:</strong> The actions below are irreversible and will permanently delete your account and all associated data.
                  </AlertDescription>
                </Alert>
                
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h4 className="font-medium text-red-900">Delete Account</h4>
                    <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button onClick={handleSave} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </Container>
    </DashboardLayout>
  );
}