
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Award, BarChart3, Briefcase, CalendarCheck2, DollarSign, Edit, FileText, FileUp, Gift, LayoutDashboardIcon, Link as LinkIcon, Linkedin, Mail, MapPin, MessageSquare, Phone, Settings, UserCircle2, UserCog, Video, Zap, FolderOpen, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Mock data for the demo candidate dashboard
const mockCandidateDashboardData = {
  candidateId: "CAND-ALICE-001",
  fullName: "Alice Wonderland",
  applicationsApplied: 5,
  upcomingInterviews: 2,
  offersReceived: 1,
  aiRecommendedJobs: 3,
  referredBy: "Bob The Builder (via Referral Program)",
  availability: "Available in 7 days",
};

const mockRecommendedJobs = [
    { id: "jobRec1", title: "Lead Frontend Developer", company: "Innovate Solutions" , jobIdForLink: "1"},
    { id: "jobRec2", title: "UI/UX Specialist (React)", company: "Creative Minds Inc.", jobIdForLink: "3" },
    { id: "jobRec3", title: "Full-Stack Engineer (Remote)", company: "Global Tech Co.", jobIdForLink: "2" },
];

export default function CandidateDashboardPage() {
  return (
    <Container> {/* Ensures consistent padding */}
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
          <LayoutDashboardIcon className="mr-3 h-8 w-8 text-primary" />
          Welcome, {mockCandidateDashboardData.fullName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          This is your personal dashboard. Manage your job search, profile, and interviews.
          <span className="block text-xs mt-1">Candidate ID: <code className="bg-muted px-1 py-0.5 rounded">{mockCandidateDashboardData.candidateId}</code></span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications Sent</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCandidateDashboardData.applicationsApplied}</div>
            <Link href="/jobs" className="text-xs text-primary hover:underline">Browse more jobs</Link>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Interviews</CardTitle>
            <CalendarCheck2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCandidateDashboardData.upcomingInterviews}</div>
            <Link href="/candidates/my-interviews" className="text-xs text-primary hover:underline">View schedule</Link>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offers Received</CardTitle>
            <Award className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCandidateDashboardData.offersReceived}</div>
            {/* <p className="text-xs text-muted-foreground">Congratulations!</p> */}
             <span className="text-xs text-muted-foreground">Details in 'My Interviews'</span>
          </CardContent>
        </Card>
         <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Recommended Jobs</CardTitle>
            <Zap className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockCandidateDashboardData.aiRecommendedJobs}</div>
            <Link href="/candidates/1#job-recommendations" className="text-xs text-primary hover:underline">See recommendations</Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile & Availability */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><UserCog className="mr-2 h-6 w-6 text-primary" /> My Profile & Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {mockCandidateDashboardData.referredBy && (
                    <div className="p-3 bg-accent/10 border border-accent rounded-md">
                        <p className="text-sm font-medium text-accent-foreground flex items-center"><Gift className="mr-2 h-4 w-4"/> Referred By</p>
                        <p className="text-sm text-muted-foreground">{mockCandidateDashboardData.referredBy}</p>
                    </div>
                )}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Link href="/candidates/1/edit" passHref className="flex-grow">
                    <Button variant="outline" className="w-full sm:w-auto">
                        <Edit className="mr-2 h-4 w-4" /> Enrich Your Profile
                    </Button>
                </Link>
                <div className="w-full sm:w-auto sm:min-w-[200px]">
                    <Label htmlFor="availability" className="text-xs text-muted-foreground mb-1 block">Update Availability</Label>
                    <Select defaultValue={mockCandidateDashboardData.availability.toLowerCase().replace(/\s+/g, '-')}>
                        <SelectTrigger id="availability">
                        <SelectValue placeholder="Set your availability" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="available-in-7-days">Available in 7 days</SelectItem>
                        <SelectItem value="available-in-14-days">Available in 14 days</SelectItem>
                        <SelectItem value="available-in-30-days">Available in 30 days</SelectItem>
                        <SelectItem value="open-to-offers">Open to offers</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
               <p className="text-xs text-muted-foreground italic">Keep your profile and availability up-to-date for the best matches.</p>
            </CardContent>
          </Card>

           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><Zap className="mr-2 h-6 w-6 text-primary" /> AI Recommended Jobs For You</CardTitle>
              <CardDescription>Based on your profile and skills, here are some roles you might be interested in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {mockRecommendedJobs.map(job => (
                    <div key={job.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-md">{job.title}</h4>
                            <Link href={`/jobs/${job.jobIdForLink || job.id}`} passHref>
                                <Button variant="link" size="sm" className="p-0 h-auto text-xs">View Job</Button>
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <Link href="/jobs" passHref>
                    <Button variant="outline">Explore All Jobs</Button>
                </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Quick Actions / Links */}
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <Link href="/candidates/my-interviews" passHref><Button variant="ghost" className="w-full justify-start"><CalendarClock className="mr-2 h-4 w-4 text-primary" />My Interviews</Button></Link>
                <Link href="/candidates/my-documents" passHref><Button variant="ghost" className="w-full justify-start"><FolderOpen className="mr-2 h-4 w-4 text-primary" />My Documents</Button></Link>
                <Link href="/referrals" passHref><Button variant="ghost" className="w-full justify-start"><Gift className="mr-2 h-4 w-4 text-primary" />My Referrals</Button></Link>
                <Link href="/candidates/settings" passHref><Button variant="ghost" className="w-full justify-start"><Settings className="mr-2 h-4 w-4 text-primary" />Profile Settings</Button></Link>
                <Link href="/jobs" passHref><Button variant="default" className="w-full mt-2"><Briefcase className="mr-2 h-4 w-4" />Search for Jobs</Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
