'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Globe, 
  Mail, 
  Shield, 
  Zap, 
  Database,
  MessageSquare,
  Bell,
  CreditCard,
  Users,
  Building,
  AlertTriangle,
  CheckCircle,
  Key,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Download,
  Trash2
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Platform settings state
  const [platformSettings, setPlatformSettings] = useState({
    siteName: 'AI Recruitment Platform',
    siteDescription: 'Advanced AI-powered recruitment and talent acquisition platform',
    primaryColor: '#3B82F6',
    logoUrl: '/logo.png',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    aiSearchEnabled: true,
    aiInterviewsEnabled: true,
    maxJobsPerCompany: 50,
    maxUsersPerCompany: 100,
    sessionTimeout: 24,
    apiRateLimit: 1000
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.platform.com',
    smtpPort: 587,
    smtpUsername: 'noreply@platform.com',
    smtpPassword: '••••••••',
    fromEmail: 'noreply@platform.com',
    fromName: 'AI Recruitment Platform',
    welcomeEmailEnabled: true,
    notificationEmailsEnabled: true,
    marketingEmailsEnabled: false
  });

  // AI Configuration
  const [aiSettings, setAiSettings] = useState({
    googleAiApiKey: '••••••••••••••••',
    elevenLabsApiKey: '••••••••••••••••',
    searchModelVersion: 'v2.1.0',
    interviewModelVersion: 'v1.8.0',
    maxTokensPerRequest: 4000,
    searchResultLimit: 50,
    confidenceThreshold: 0.75,
    autoRetryEnabled: true
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorRequired: false,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    maxLoginAttempts: 5,
    accountLockoutDuration: 30,
    sessionSecurityEnabled: true,
    ipWhitelistEnabled: false,
    auditLoggingEnabled: true
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

  const handlePlatformSettingChange = (key: string, value: any) => {
    setPlatformSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleEmailSettingChange = (key: string, value: any) => {
    setEmailSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleAiSettingChange = (key: string, value: any) => {
    setAiSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSecuritySettingChange = (key: string, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <Container className="py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <Settings className="mr-3 h-8 w-8 text-primary" />
                Platform Settings
              </h1>
              <p className="text-muted-foreground mt-1">
                Configure global platform settings, integrations, and system preferences
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
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
          </div>
        </div>

        {saveSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Settings saved successfully!</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="ai-config">AI Configuration</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Platform Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-primary" />
                  Platform Configuration
                </CardTitle>
                <CardDescription>Basic platform settings and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={platformSettings.siteName}
                      onChange={(e) => handlePlatformSettingChange('siteName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={platformSettings.primaryColor}
                      onChange={(e) => handlePlatformSettingChange('primaryColor', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={platformSettings.siteDescription}
                    onChange={(e) => handlePlatformSettingChange('siteDescription', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={platformSettings.logoUrl}
                    onChange={(e) => handlePlatformSettingChange('logoUrl', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Platform Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-primary" />
                  Platform Features
                </CardTitle>
                <CardDescription>Enable or disable platform features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Maintenance Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Put the platform in maintenance mode for updates
                    </p>
                  </div>
                  <Switch
                    checked={platformSettings.maintenanceMode}
                    onCheckedChange={(checked) => handlePlatformSettingChange('maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">User Registration</h4>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register for accounts
                    </p>
                  </div>
                  <Switch
                    checked={platformSettings.registrationEnabled}
                    onCheckedChange={(checked) => handlePlatformSettingChange('registrationEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Verification Required</h4>
                    <p className="text-sm text-muted-foreground">
                      Require email verification for new accounts
                    </p>
                  </div>
                  <Switch
                    checked={platformSettings.emailVerificationRequired}
                    onCheckedChange={(checked) => handlePlatformSettingChange('emailVerificationRequired', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">AI Search</h4>
                    <p className="text-sm text-muted-foreground">
                      Enable AI-powered talent search functionality
                    </p>
                  </div>
                  <Switch
                    checked={platformSettings.aiSearchEnabled}
                    onCheckedChange={(checked) => handlePlatformSettingChange('aiSearchEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">AI Interviews</h4>
                    <p className="text-sm text-muted-foreground">
                      Enable AI-powered interview functionality
                    </p>
                  </div>
                  <Switch
                    checked={platformSettings.aiInterviewsEnabled}
                    onCheckedChange={(checked) => handlePlatformSettingChange('aiInterviewsEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* System Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-primary" />
                  System Limits
                </CardTitle>
                <CardDescription>Configure system limits and quotas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxJobsPerCompany">Max Jobs per Company</Label>
                    <Input
                      id="maxJobsPerCompany"
                      type="number"
                      value={platformSettings.maxJobsPerCompany}
                      onChange={(e) => handlePlatformSettingChange('maxJobsPerCompany', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUsersPerCompany">Max Users per Company</Label>
                    <Input
                      id="maxUsersPerCompany"
                      type="number"
                      value={platformSettings.maxUsersPerCompany}
                      onChange={(e) => handlePlatformSettingChange('maxUsersPerCompany', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={platformSettings.sessionTimeout}
                      onChange={(e) => handlePlatformSettingChange('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiRateLimit">API Rate Limit (requests/hour)</Label>
                    <Input
                      id="apiRateLimit"
                      type="number"
                      value={platformSettings.apiRateLimit}
                      onChange={(e) => handlePlatformSettingChange('apiRateLimit', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5 text-primary" />
                  SMTP Configuration
                </CardTitle>
                <CardDescription>Configure email server settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) => handleEmailSettingChange('smtpHost', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={emailSettings.smtpPort}
                      onChange={(e) => handleEmailSettingChange('smtpPort', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">SMTP Username</Label>
                    <Input
                      id="smtpUsername"
                      value={emailSettings.smtpUsername}
                      onChange={(e) => handleEmailSettingChange('smtpUsername', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => handleEmailSettingChange('smtpPassword', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => handleEmailSettingChange('fromEmail', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) => handleEmailSettingChange('fromName', e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Email Features</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Welcome Emails</h4>
                      <p className="text-sm text-muted-foreground">Send welcome emails to new users</p>
                    </div>
                    <Switch
                      checked={emailSettings.welcomeEmailEnabled}
                      onCheckedChange={(checked) => handleEmailSettingChange('welcomeEmailEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Notification Emails</h4>
                      <p className="text-sm text-muted-foreground">Send system notifications via email</p>
                    </div>
                    <Switch
                      checked={emailSettings.notificationEmailsEnabled}
                      onCheckedChange={(checked) => handleEmailSettingChange('notificationEmailsEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Marketing Emails</h4>
                      <p className="text-sm text-muted-foreground">Enable marketing and promotional emails</p>
                    </div>
                    <Switch
                      checked={emailSettings.marketingEmailsEnabled}
                      onCheckedChange={(checked) => handleEmailSettingChange('marketingEmailsEnabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-primary" />
                  AI Service Configuration
                </CardTitle>
                <CardDescription>Configure AI services and API keys</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="googleAiApiKey">Google AI API Key</Label>
                    <Input
                      id="googleAiApiKey"
                      type="password"
                      value={aiSettings.googleAiApiKey}
                      onChange={(e) => handleAiSettingChange('googleAiApiKey', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="elevenLabsApiKey">ElevenLabs API Key</Label>
                    <Input
                      id="elevenLabsApiKey"
                      type="password"
                      value={aiSettings.elevenLabsApiKey}
                      onChange={(e) => handleAiSettingChange('elevenLabsApiKey', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="searchModelVersion">Search Model Version</Label>
                    <Select value={aiSettings.searchModelVersion} onValueChange={(value) => handleAiSettingChange('searchModelVersion', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v2.1.0">v2.1.0 (Latest)</SelectItem>
                        <SelectItem value="v2.0.0">v2.0.0</SelectItem>
                        <SelectItem value="v1.9.0">v1.9.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interviewModelVersion">Interview Model Version</Label>
                    <Select value={aiSettings.interviewModelVersion} onValueChange={(value) => handleAiSettingChange('interviewModelVersion', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v1.8.0">v1.8.0 (Latest)</SelectItem>
                        <SelectItem value="v1.7.0">v1.7.0</SelectItem>
                        <SelectItem value="v1.6.0">v1.6.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTokensPerRequest">Max Tokens per Request</Label>
                    <Input
                      id="maxTokensPerRequest"
                      type="number"
                      value={aiSettings.maxTokensPerRequest}
                      onChange={(e) => handleAiSettingChange('maxTokensPerRequest', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="searchResultLimit">Search Result Limit</Label>
                    <Input
                      id="searchResultLimit"
                      type="number"
                      value={aiSettings.searchResultLimit}
                      onChange={(e) => handleAiSettingChange('searchResultLimit', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confidenceThreshold">Confidence Threshold</Label>
                    <Input
                      id="confidenceThreshold"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={aiSettings.confidenceThreshold}
                      onChange={(e) => handleAiSettingChange('confidenceThreshold', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoRetryEnabled"
                      checked={aiSettings.autoRetryEnabled}
                      onCheckedChange={(checked) => handleAiSettingChange('autoRetryEnabled', checked)}
                    />
                    <Label htmlFor="autoRetryEnabled">Enable Auto Retry</Label>
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
                  Security Configuration
                </CardTitle>
                <CardDescription>Configure security policies and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => handleSecuritySettingChange('passwordMinLength', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => handleSecuritySettingChange('maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountLockoutDuration">Account Lockout Duration (minutes)</Label>
                    <Input
                      id="accountLockoutDuration"
                      type="number"
                      value={securitySettings.accountLockoutDuration}
                      onChange={(e) => handleSecuritySettingChange('accountLockoutDuration', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Security Features</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication Required</h4>
                      <p className="text-sm text-muted-foreground">Require 2FA for all user accounts</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorRequired}
                      onCheckedChange={(checked) => handleSecuritySettingChange('twoFactorRequired', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Password Special Characters</h4>
                      <p className="text-sm text-muted-foreground">Require special characters in passwords</p>
                    </div>
                    <Switch
                      checked={securitySettings.passwordRequireSpecialChars}
                      onCheckedChange={(checked) => handleSecuritySettingChange('passwordRequireSpecialChars', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Enhanced Session Security</h4>
                      <p className="text-sm text-muted-foreground">Enable additional session security measures</p>
                    </div>
                    <Switch
                      checked={securitySettings.sessionSecurityEnabled}
                      onCheckedChange={(checked) => handleSecuritySettingChange('sessionSecurityEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">IP Whitelist</h4>
                      <p className="text-sm text-muted-foreground">Enable IP address whitelisting</p>
                    </div>
                    <Switch
                      checked={securitySettings.ipWhitelistEnabled}
                      onCheckedChange={(checked) => handleSecuritySettingChange('ipWhitelistEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Audit Logging</h4>
                      <p className="text-sm text-muted-foreground">Log all user actions for security audits</p>
                    </div>
                    <Switch
                      checked={securitySettings.auditLoggingEnabled}
                      onCheckedChange={(checked) => handleSecuritySettingChange('auditLoggingEnabled', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Third-Party Integrations</CardTitle>
                <CardDescription>Configure external service integrations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Integration settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </AdminLayout>
  );
}