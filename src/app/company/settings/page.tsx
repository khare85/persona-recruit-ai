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
import { Settings, Building, Users, CreditCard, Bell, Shield, Globe, Mail, Key, AlertCircle, Check } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useState } from 'react';

export default function CompanySettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoScreening, setAutoScreening] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

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
                    <Input id="company-name" defaultValue="TechCorp Inc." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input id="industry" defaultValue="Technology" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" type="url" defaultValue="https://techcorp.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Company Size</Label>
                    <Input id="size" defaultValue="500-1000 employees" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea 
                    id="description" 
                    rows={4}
                    defaultValue="TechCorp Inc. is a leading technology company specializing in innovative software solutions for businesses worldwide."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headquarters">Headquarters</Label>
                  <Input id="headquarters" defaultValue="San Francisco, CA" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
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
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Hiring Managers</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline">Add Department</Button>
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
                        <Button size="sm" variant="ghost">Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline">Invite Team Member</Button>
              </CardFooter>
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