'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings,
  User,
  Bell,
  Calendar,
  Clock,
  Shield,
  Eye,
  Volume2,
  Smartphone,
  Mail,
  MessageSquare,
  Star,
  CheckCircle,
  AlertCircle,
  Globe,
  Palette,
  Camera,
  FileText,
  Briefcase,
  Award,
  Users,
  Zap
} from 'lucide-react';

export default function InterviewerSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [calendarSync, setCalendarSync] = useState(true);
  const [autoAcceptInvites, setAutoAcceptInvites] = useState(false);
  const [feedbackReminders, setFeedbackReminders] = useState(true);
  const [performanceReports, setPerformanceReports] = useState(true);
  const [candidateRatingVisibility, setCandidateRatingVisibility] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
            <Settings className="mr-3 h-8 w-8 text-primary" />
            Interview Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize your interview preferences and account settings
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and interviewer profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="Alex" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Rodriguez" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="alex.rodriguez@techcorp.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input id="title" defaultValue="Senior Software Engineer" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select defaultValue="engineering">
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="data">Data Science</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea 
                    id="bio" 
                    rows={4}
                    defaultValue="Senior Software Engineer with 8+ years of experience in frontend development, system design, and team leadership. Passionate about mentoring and helping candidates showcase their best potential during interviews."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5 text-primary" />
                  Interview Specializations
                </CardTitle>
                <CardDescription>
                  Manage your areas of expertise for interview assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Current Specializations</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Frontend Development', 'System Design', 'Team Leadership', 'React/TypeScript', 'Node.js'].map((skill) => (
                        <Badge key={skill} variant="secondary" className="cursor-pointer">
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newSkill">Add New Specialization</Label>
                    <div className="flex space-x-2">
                      <Input id="newSkill" placeholder="e.g., Machine Learning, DevOps" />
                      <Button variant="outline">Add</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Experience Level</Label>
                    <Select defaultValue="senior">
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                        <SelectItem value="mid">Mid-level (3-6 years)</SelectItem>
                        <SelectItem value="senior">Senior (6+ years)</SelectItem>
                        <SelectItem value="lead">Lead/Principal (8+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5 text-primary" />
                  Interview Preferences
                </CardTitle>
                <CardDescription>
                  Configure your interview scheduling and conduct preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Maximum Daily Interviews</h4>
                      <p className="text-sm text-muted-foreground">
                        Limit the number of interviews you can be assigned per day
                      </p>
                    </div>
                    <Select defaultValue="4">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Preferred Interview Duration</h4>
                      <p className="text-sm text-muted-foreground">
                        Your preferred length for most interviews
                      </p>
                    </div>
                    <Select defaultValue="60">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Break Time Between Interviews</h4>
                      <p className="text-sm text-muted-foreground">
                        Minimum gap between consecutive interviews
                      </p>
                    </div>
                    <Select defaultValue="15">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Auto-Accept Interview Invites</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatically accept interview assignments when available
                      </p>
                    </div>
                    <Switch 
                      checked={autoAcceptInvites}
                      onCheckedChange={setAutoAcceptInvites}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Allow Weekend Interviews</h4>
                      <p className="text-sm text-muted-foreground">
                        Make yourself available for weekend interview slots
                      </p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5 text-primary" />
                  Interface Preferences
                </CardTitle>
                <CardDescription>
                  Customize your dashboard appearance and layout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Dark Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme for the interviewer dashboard
                    </p>
                  </div>
                  <Switch 
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Compact View</h4>
                    <p className="text-sm text-muted-foreground">
                      Show more information in less space
                    </p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Show Performance Metrics</h4>
                    <p className="text-sm text-muted-foreground">
                      Display performance stats on dashboard
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
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
                  Control how and when you receive interview-related notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Push Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive browser and mobile push notifications
                    </p>
                  </div>
                  <Switch 
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Interview Assignment Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified when assigned to new interviews
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Interview Reminders</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders before scheduled interviews
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Feedback Reminders</h4>
                    <p className="text-sm text-muted-foreground">
                      Get reminded to submit feedback after interviews
                    </p>
                  </div>
                  <Switch 
                    checked={feedbackReminders}
                    onCheckedChange={setFeedbackReminders}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Performance Reports</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive monthly performance summary reports
                    </p>
                  </div>
                  <Switch 
                    checked={performanceReports}
                    onCheckedChange={setPerformanceReports}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Notification Timing</CardTitle>
                <CardDescription>Configure when to receive different types of notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Interview Reminder Timing</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes before</SelectItem>
                        <SelectItem value="30">30 minutes before</SelectItem>
                        <SelectItem value="60">1 hour before</SelectItem>
                        <SelectItem value="120">2 hours before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Feedback Reminder Timing</Label>
                    <Select defaultValue="120">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">1 hour after interview</SelectItem>
                        <SelectItem value="120">2 hours after interview</SelectItem>
                        <SelectItem value="240">4 hours after interview</SelectItem>
                        <SelectItem value="1440">Next day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  Calendar Integration
                </CardTitle>
                <CardDescription>
                  Sync your interview schedule with external calendar applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Calendar Sync</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync interviews with your calendar
                    </p>
                  </div>
                  <Switch 
                    checked={calendarSync}
                    onCheckedChange={setCalendarSync}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Preferred Calendar</Label>
                  <Select defaultValue="google">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Calendar</SelectItem>
                      <SelectItem value="outlook">Microsoft Outlook</SelectItem>
                      <SelectItem value="apple">Apple Calendar</SelectItem>
                      <SelectItem value="ical">iCal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Block Personal Time</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically block interview scheduling during personal events
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Show Availability</h4>
                    <p className="text-sm text-muted-foreground">
                      Allow recruiters to see your real-time availability
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Connect Calendar</Button>
              </CardFooter>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Working Hours</CardTitle>
                <CardDescription>Set your preferred interview scheduling hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select defaultValue="9">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8:00 AM</SelectItem>
                        <SelectItem value="9">9:00 AM</SelectItem>
                        <SelectItem value="10">10:00 AM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select defaultValue="17">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16">4:00 PM</SelectItem>
                        <SelectItem value="17">5:00 PM</SelectItem>
                        <SelectItem value="18">6:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Available Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox id={day} defaultChecked={!['Saturday', 'Sunday'].includes(day)} />
                        <Label htmlFor={day} className="text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-primary" />
                  Privacy & Visibility
                </CardTitle>
                <CardDescription>
                  Control what information is visible to candidates and other users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Show Rating to Candidates</h4>
                    <p className="text-sm text-muted-foreground">
                      Let candidates see your interviewer rating
                    </p>
                  </div>
                  <Switch 
                    checked={candidateRatingVisibility}
                    onCheckedChange={setCandidateRatingVisibility}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Show Experience Level</h4>
                    <p className="text-sm text-muted-foreground">
                      Display your years of experience to candidates
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Show Specializations</h4>
                    <p className="text-sm text-muted-foreground">
                      Let candidates see your areas of expertise
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Anonymous Feedback Collection</h4>
                    <p className="text-sm text-muted-foreground">
                      Allow candidates to provide anonymous feedback about interviews
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Data & Analytics</CardTitle>
                <CardDescription>Control how your interview data is used for analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Performance Analytics</h4>
                    <p className="text-sm text-muted-foreground">
                      Include your data in company-wide interview analytics
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Benchmarking Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Use your performance for industry benchmarking studies
                    </p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your privacy is important to us. All personal data is encrypted and only used to improve your interview experience.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}