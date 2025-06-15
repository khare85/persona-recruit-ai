
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, KeyRound, Bell, UserCog, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function CandidateSettingsPage() {
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Simulate saving settings
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved successfully.",
      action: <Save className="text-primary" />,
    });
  };

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
          <UserCog className="mr-3 h-8 w-8 text-primary" />
          My Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences, password, and notification settings.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Account Settings Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <KeyRound className="mr-3 h-6 w-6 text-primary" />
                Account Security
              </CardTitle>
              <CardDescription>Update your password and manage account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" placeholder="Enter your current password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="Enter a new password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input id="confirmNewPassword" type="password" placeholder="Confirm your new password" />
              </div>
               <Button variant="outline">Change Password</Button>
            </CardContent>
          </Card>

          {/* Notification Settings Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Bell className="mr-3 h-6 w-6 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to be notified by Persona Recruit AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="jobAlerts" className="font-medium">
                  New Job Recommendations
                  <p className="text-xs text-muted-foreground">Receive emails for jobs matching your profile.</p>
                </Label>
                <Switch id="jobAlerts" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="interviewUpdates" className="font-medium">
                  Interview Updates
                  <p className="text-xs text-muted-foreground">Get notified about interview requests and changes.</p>
                </Label>
                <Switch id="interviewUpdates" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                <Label htmlFor="applicationStatus" className="font-medium">
                  Application Status Changes
                  <p className="text-xs text-muted-foreground">Updates when your application status changes.</p>
                </Label>
                <Switch id="applicationStatus" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/candidates/dashboard" passHref>
            <Button variant="outline">&larr; Back to Dashboard</Button>
          </Link>
          <Button type="submit" size="lg">
            <Save className="mr-2 h-5 w-5" />
            Save All Settings
          </Button>
        </div>
      </form>
    </Container>
  );
}
