'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Save,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface NotificationPreferences {
  userId: string;
  emailNotifications: {
    applications: boolean;
    interviews: boolean;
    matches: boolean;
    invitations: boolean;
    security: boolean;
    marketing: boolean;
  };
  inAppNotifications: {
    applications: boolean;
    interviews: boolean;
    matches: boolean;
    invitations: boolean;
    security: boolean;
    system: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  updatedAt: string;
}

export const NotificationPreferences = React.memo(function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      const result = await response.json();

      if (result.success) {
        setPreferences(result.data);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailNotifications: preferences.emailNotifications,
          inAppNotifications: preferences.inAppNotifications,
          frequency: preferences.frequency,
          quietHours: preferences.quietHours
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Preferences updated successfully' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update preferences' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    } finally {
      setSaving(false);
    }
  };

  const updateEmailPreference = (key: keyof NotificationPreferences['emailNotifications'], value: boolean) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      emailNotifications: {
        ...preferences.emailNotifications,
        [key]: value
      }
    });
  };

  const updateInAppPreference = (key: keyof NotificationPreferences['inAppNotifications'], value: boolean) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      inAppNotifications: {
        ...preferences.inAppNotifications,
        [key]: value
      }
    });
  };

  const updateQuietHours = (updates: Partial<NotificationPreferences['quietHours']>) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      quietHours: {
        ...preferences.quietHours,
        ...updates
      }
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading preferences...</span>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load notification preferences. Please refresh the page.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Manage how and when you receive notifications about applications, interviews, and matches.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <h3 className="text-lg font-medium">Email Notifications</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-applications" className="text-sm">
                    Application Updates
                  </Label>
                  <Switch
                    id="email-applications"
                    checked={preferences.emailNotifications.applications}
                    onCheckedChange={(value) => updateEmailPreference('applications', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="email-interviews" className="text-sm">
                    Interview Notifications
                  </Label>
                  <Switch
                    id="email-interviews"
                    checked={preferences.emailNotifications.interviews}
                    onCheckedChange={(value) => updateEmailPreference('interviews', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="email-matches" className="text-sm">
                    Job Matches
                  </Label>
                  <Switch
                    id="email-matches"
                    checked={preferences.emailNotifications.matches}
                    onCheckedChange={(value) => updateEmailPreference('matches', value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-invitations" className="text-sm">
                    Invitations
                  </Label>
                  <Switch
                    id="email-invitations"
                    checked={preferences.emailNotifications.invitations}
                    onCheckedChange={(value) => updateEmailPreference('invitations', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="email-security" className="text-sm">
                    Security Alerts
                  </Label>
                  <Switch
                    id="email-security"
                    checked={preferences.emailNotifications.security}
                    onCheckedChange={(value) => updateEmailPreference('security', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="email-marketing" className="text-sm">
                    Marketing & Updates
                  </Label>
                  <Switch
                    id="email-marketing"
                    checked={preferences.emailNotifications.marketing}
                    onCheckedChange={(value) => updateEmailPreference('marketing', value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* In-App Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-green-600" />
              <h3 className="text-lg font-medium">In-App Notifications</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="app-applications" className="text-sm">
                    Application Updates
                  </Label>
                  <Switch
                    id="app-applications"
                    checked={preferences.inAppNotifications.applications}
                    onCheckedChange={(value) => updateInAppPreference('applications', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="app-interviews" className="text-sm">
                    Interview Notifications
                  </Label>
                  <Switch
                    id="app-interviews"
                    checked={preferences.inAppNotifications.interviews}
                    onCheckedChange={(value) => updateInAppPreference('interviews', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="app-matches" className="text-sm">
                    Job Matches
                  </Label>
                  <Switch
                    id="app-matches"
                    checked={preferences.inAppNotifications.matches}
                    onCheckedChange={(value) => updateInAppPreference('matches', value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="app-invitations" className="text-sm">
                    Invitations
                  </Label>
                  <Switch
                    id="app-invitations"
                    checked={preferences.inAppNotifications.invitations}
                    onCheckedChange={(value) => updateInAppPreference('invitations', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="app-security" className="text-sm">
                    Security Alerts
                  </Label>
                  <Switch
                    id="app-security"
                    checked={preferences.inAppNotifications.security}
                    onCheckedChange={(value) => updateInAppPreference('security', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="app-system" className="text-sm">
                    System Updates
                  </Label>
                  <Switch
                    id="app-system"
                    checked={preferences.inAppNotifications.system}
                    onCheckedChange={(value) => updateInAppPreference('system', value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Frequency & Quiet Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Email Frequency</h3>
              <Select
                value={preferences.frequency}
                onValueChange={(value) => setPreferences({ ...preferences, frequency: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <h3 className="text-lg font-medium">Quiet Hours</h3>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="quiet-hours-enabled" className="text-sm">
                  Enable Quiet Hours
                </Label>
                <Switch
                  id="quiet-hours-enabled"
                  checked={preferences.quietHours.enabled}
                  onCheckedChange={(value) => updateQuietHours({ enabled: value })}
                />
              </div>

              {preferences.quietHours.enabled && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="quiet-start" className="text-xs text-gray-600">
                        Start Time
                      </Label>
                      <input
                        id="quiet-start"
                        type="time"
                        value={preferences.quietHours.start}
                        onChange={(e) => updateQuietHours({ start: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiet-end" className="text-xs text-gray-600">
                        End Time
                      </Label>
                      <input
                        id="quiet-end"
                        type="time"
                        value={preferences.quietHours.end}
                        onChange={(e) => updateQuietHours({ end: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={updatePreferences} 
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});