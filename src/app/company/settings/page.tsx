"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Building, Users, CreditCard, Bell, Shield, Globe, Mail, Key, AlertCircle, Check, MessageSquare, UserPlus, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useState, useEffect } from 'react';

export default function CompanySettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoScreening, setAutoScreening] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    name: 'TechCorp Inc.',
    industry: 'Technology',
    website: 'https://techcorp.com',
    size: '500-1000 employees',
    description: 'TechCorp Inc. is a leading technology company specializing in innovative software solutions for businesses worldwide.',
    headquarters: 'San Francisco, CA'
  });

  const handleSettingChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveGeneralSettings = async () => {
    setIsLoading(true);
    try {
      // In real implementation, would save to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
            <Settings className="mr-3 h-8 w-8 text-primary" />
            Company Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your company profile, preferences, and account settings
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="interviewers">Interviewers</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5 text-primary" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Update your company details and public profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input 
                      id="company-name" 
                      value={settings.name}
                      onChange={(e) => handleSettingChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input 
                      id="industry" 
                      value={settings.industry}
                      onChange={(e) => handleSettingChange('industry', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      type="url" 
                      value={settings.website}
                      onChange={(e) => handleSettingChange('website', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Company Size</Label>
                    <Input 
                      id="size" 
                      value={settings.size}
                      onChange={(e) => handleSettingChange('size', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea 
                    id="description" 
                    rows={4}
                    value={settings.description}
                    onChange={(e) => handleSettingChange('description', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headquarters">Headquarters</Label>
                  <Input 
                    id="headquarters" 
                    value={settings.headquarters}
                    onChange={(e) => handleSettingChange('headquarters', e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveGeneralSettings} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-primary" />
                  Public Profile Settings
                </CardTitle>
                <CardDescription>
                  Control how your company appears on the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Public Company Profile</h4>
                    <p className="text-sm text-muted-foreground">
                      Make your company profile visible to all candidates
                    </p>
                  </div>
                  <Switch 
                    checked={publicProfile}
                    onCheckedChange={setPublicProfile}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Display Employee Count</h4>
                    <p className="text-sm text-muted-foreground">
                      Show your company size on public profiles
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Show Benefits Package</h4>
                    <p className="text-sm text-muted-foreground">
                      Display company benefits on job postings
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Department Management
                </CardTitle>
                <CardDescription>
                  Organize your company's hiring structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Engineering', 'Marketing', 'Sales', 'Product', 'Operations'].map((dept) => (
                    <div key={dept} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{dept}</h4>
                        <p className="text-sm text-muted-foreground">
                          {dept === 'Engineering' ? '45 employees' : 
                           dept === 'Marketing' ? '12 employees' :
                           dept === 'Sales' ? '23 employees' :
                           dept === 'Product' ? '8 employees' :
                           '15 employees'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => console.log('Edit department:', dept)}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => console.log('Manage hiring managers for:', dept)}>Hiring Managers</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => console.log('Add new department')}>Add Department</Button>
              </CardFooter>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Hiring Team</CardTitle>
                <CardDescription>
                  Manage users who can post jobs and review candidates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Sarah Johnson', role: 'HR Director', email: 'sarah@techcorp.com' },
                    { name: 'Mike Chen', role: 'Engineering Manager', email: 'mike@techcorp.com' },
                    { name: 'Lisa Park', role: 'Recruiter', email: 'lisa@techcorp.com' },
                  ].map((member) => (
                    <div key={member.email} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role} • {member.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge>{member.role === 'HR Director' ? 'Admin' : 'Member'}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => console.log('Remove team member:', member.email)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => console.log('Invite team member')}>Invite Team Member</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="interviewers" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Interviewer Management
                </CardTitle>
                <CardDescription>
                  Manage interviewers who can conduct face-to-face interviews
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      name: 'Alex Rodriguez', 
                      email: 'alex.rodriguez@techcorp.com', 
                      department: 'Engineering',
                      specializations: ['Frontend Development', 'System Design'],
                      totalInterviews: 156,
                      rating: 4.8,
                      status: 'active'
                    },
                    { 
                      name: 'Maria Garcia', 
                      email: 'maria.garcia@techcorp.com', 
                      department: 'Product',
                      specializations: ['Product Strategy', 'User Research'],
                      totalInterviews: 89,
                      rating: 4.6,
                      status: 'active'
                    },
                    { 
                      name: 'David Chen', 
                      email: 'david.chen@techcorp.com', 
                      department: 'Engineering',
                      specializations: ['Backend Development', 'DevOps'],
                      totalInterviews: 203,
                      rating: 4.9,
                      status: 'active'
                    },
                  ].map((interviewer) => (
                    <div key={interviewer.email} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {interviewer.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold">{interviewer.name}</h4>
                            <p className="text-sm text-muted-foreground">{interviewer.email}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {interviewer.department} • {interviewer.totalInterviews} interviews
                              </span>
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-muted-foreground">Rating:</span>
                                <span className="text-xs font-semibold text-yellow-600">{interviewer.rating}/5</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 ml-13">
                          <div className="flex flex-wrap gap-1">
                            {interviewer.specializations.map((spec, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={interviewer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {interviewer.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Interviewer
                </Button>
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Permissions
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Interview Assignment Settings</CardTitle>
                <CardDescription>
                  Configure how interviews are assigned to interviewers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Auto-Assignment</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically assign interviews based on availability and expertise
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Department Matching</h4>
                    <p className="text-sm text-muted-foreground">
                      Prefer interviewers from the same department as the role
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Workload Balancing</h4>
                    <p className="text-sm text-muted-foreground">
                      Distribute interviews evenly among available interviewers
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Maximum Daily Interviews</h4>
                    <p className="text-sm text-muted-foreground">
                      Limit interviews per interviewer per day
                    </p>
                  </div>
                  <Input className="w-20" type="number" defaultValue="4" min="1" max="10" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Interview Performance Tracking</CardTitle>
                <CardDescription>
                  Monitor interviewer performance and feedback quality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">4.7</div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">96%</div>
                    <div className="text-sm text-muted-foreground">On-Time Rate</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">448</div>
                    <div className="text-sm text-muted-foreground">Total Interviews</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Send Performance Reports</h4>
                    <p className="text-sm text-muted-foreground">
                      Monthly performance summaries to interviewers
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Candidate Feedback Sharing</h4>
                    <p className="text-sm text-muted-foreground">
                      Share anonymous candidate feedback with interviewers
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about hiring activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new applications via email
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">New Application Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified when candidates apply to your jobs
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Interview Reminders</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders for scheduled interviews
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Weekly Hiring Report</h4>
                    <p className="text-sm text-muted-foreground">
                      Get a weekly summary of your hiring pipeline
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5 text-primary" />
                  AI Screening Settings
                </CardTitle>
                <CardDescription>
                  Configure automated candidate screening preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Auto-Screen Applications</h4>
                    <p className="text-sm text-muted-foreground">
                      Use AI to automatically screen and rank candidates
                    </p>
                  </div>
                  <Switch 
                    checked={autoScreening}
                    onCheckedChange={setAutoScreening}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Screening Threshold</h4>
                    <p className="text-sm text-muted-foreground">
                      Minimum match score to pass initial screening
                    </p>
                  </div>
                  <Input className="w-20" type="number" defaultValue="70" min="0" max="100" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Auto-Reject Below Threshold</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically reject candidates below minimum score
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-primary" />
                  Subscription & Billing
                </CardTitle>
                <CardDescription>
                  Manage your subscription plan and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-lg">Enterprise Plan</h4>
                      <p className="text-sm text-muted-foreground">Unlimited job postings and AI features</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      <p className="text-2xl font-bold">$999/month</p>
                      <p className="text-sm text-muted-foreground">Billed monthly</p>
                    </div>
                    <Button variant="outline">Change Plan</Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Payment Method</h4>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/24</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Update</Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Billing History</h4>
                  <div className="space-y-2">
                    {[
                      { date: 'Jun 1, 2025', amount: '$999.00', status: 'Paid' },
                      { date: 'May 1, 2025', amount: '$999.00', status: 'Paid' },
                      { date: 'Apr 1, 2025', amount: '$999.00', status: 'Paid' },
                    ].map((invoice, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-semibold">{invoice.date}</p>
                          <p className="text-sm text-muted-foreground">Monthly subscription</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{invoice.amount}</span>
                          <Badge variant="outline" className="text-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            {invoice.status}
                          </Badge>
                          <Button size="sm" variant="ghost">Download</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Protect your account with additional security measures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch 
                    checked={twoFactor}
                    onCheckedChange={setTwoFactor}
                  />
                </div>
                
                <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100">Security Recommendation</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                        Enable two-factor authentication to protect your company's hiring data and prevent unauthorized access.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Password</h4>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">Password</p>
                      <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Active Sessions</h4>
                  <div className="space-y-2">
                    {[
                      { device: 'Chrome on MacOS', location: 'San Francisco, CA', current: true },
                      { device: 'Mobile App (iOS)', location: 'San Francisco, CA', current: false },
                    ].map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-semibold">{session.device}</p>
                          <p className="text-sm text-muted-foreground">{session.location}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.current && <Badge>Current</Badge>}
                          {!session.current && <Button size="sm" variant="ghost">Revoke</Button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that affect your company account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:border-red-300">
                  Export All Data
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:border-red-300">
                  Delete Company Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}