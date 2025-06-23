'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  Briefcase,
  Settings,
  TestTube,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Database,
  Sync,
  Shield
} from 'lucide-react';

interface HRSystemIntegration {
  systemType: string;
  name: string;
  description: string;
  logoUrl: string;
  authType: 'api_key' | 'oauth2' | 'basic_auth';
  requiredFields: string[];
  optionalFields: string[];
  supportedFeatures: {
    employeeSync: boolean;
    departmentSync: boolean;
    jobSync: boolean;
    applicationSync: boolean;
    interviewSync: boolean;
    realTimeWebhooks: boolean;
    bidirectionalSync: boolean;
  };
  documentationUrl: string;
  setupInstructions: string[];
}

interface HRIntegrationSetupProps {
  integration: HRSystemIntegration;
  onComplete?: (config: any) => void;
  onCancel?: () => void;
}

export function HRIntegrationSetup({ integration, onComplete, onCancel }: HRIntegrationSetupProps) {
  const [activeTab, setActiveTab] = useState('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [config, setConfig] = useState({
    name: `${integration.name} Integration`,
    credentials: {} as Record<string, string>,
    syncSettings: {
      autoSync: false,
      syncInterval: 'daily' as 'hourly' | 'daily' | 'weekly' | 'manual',
      syncDirection: 'import_only' as 'import_only' | 'export_only' | 'bidirectional',
      syncEntities: {
        employees: true,
        departments: true,
        jobPositions: true,
        applications: false,
        interviews: false,
        onboardingTasks: false
      },
      conflictResolution: 'platform_wins' as 'platform_wins' | 'hr_system_wins' | 'manual_review',
      enableRealTimeWebhooks: false
    },
    fieldMappings: [] as any[]
  });

  const handleCredentialChange = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [field]: value
      }
    }));
  };

  const handleSyncSettingChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      syncSettings: {
        ...prev.syncSettings,
        [field]: value
      }
    }));
  };

  const handleEntityToggle = (entity: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      syncSettings: {
        ...prev.syncSettings,
        syncEntities: {
          ...prev.syncSettings.syncEntities,
          [entity]: enabled
        }
      }
    }));
  };

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock test result
      const mockResult = {
        connected: true,
        tests: {
          connection: true,
          dataAccess: {
            employees: true,
            departments: true,
            jobPositions: integration.supportedFeatures.jobSync
          }
        },
        message: 'Connection test successful'
      };

      setTestResult(mockResult);
    } catch (error) {
      setTestResult({
        connected: false,
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Create the integration
      const response = await fetch('/api/integrations/hr-systems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemType: integration.systemType,
          name: config.name,
          credentials: config.credentials,
          syncSettings: config.syncSettings,
          fieldMappings: config.fieldMappings
        })
      });

      if (response.ok) {
        const result = await response.json();
        onComplete?.(result.data);
      } else {
        throw new Error('Failed to create integration');
      }
    } catch (error) {
      console.error('Failed to save integration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldInput = (field: string) => {
    const isPassword = field.toLowerCase().includes('secret') || 
                     field.toLowerCase().includes('password') || 
                     field.toLowerCase().includes('key');

    return (
      <div key={field} className="space-y-2">
        <Label htmlFor={field} className="capitalize">
          {field.replace(/([A-Z])/g, ' $1').toLowerCase()}
          {integration.requiredFields.includes(field) && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </Label>
        <Input
          id={field}
          type={isPassword ? 'password' : 'text'}
          value={config.credentials[field] || ''}
          onChange={(e) => handleCredentialChange(field, e.target.value)}
          required={integration.requiredFields.includes(field)}
          placeholder={field === 'subdomain' ? 'company' : ''}
        />
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-8 h-8 text-gray-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {integration.name} Integration
                <Badge variant="outline">{integration.authType}</Badge>
              </CardTitle>
              <CardDescription className="mt-2">
                {integration.description}
              </CardDescription>
              <div className="flex items-center gap-4 mt-3">
                <a
                  href={integration.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Documentation <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Setup Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="sync">Sync Settings</TabsTrigger>
          <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="test">Test & Review</TabsTrigger>
        </TabsList>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Authentication Credentials
              </CardTitle>
              <CardDescription>
                Enter your {integration.name} API credentials to establish the connection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Integration Name</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter a name for this integration"
                />
              </div>

              {integration.requiredFields.map(field => getFieldInput(field))}
              {integration.optionalFields.map(field => getFieldInput(field))}

              {/* Setup Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  {integration.setupInstructions.map((instruction, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="font-medium">{index + 1}.</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Settings Tab */}
        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sync className="w-5 h-5" />
                Synchronization Settings
              </CardTitle>
              <CardDescription>
                Configure how data should be synchronized between systems.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sync Direction */}
              <div className="space-y-2">
                <Label>Sync Direction</Label>
                <Select 
                  value={config.syncSettings.syncDirection} 
                  onValueChange={(value) => handleSyncSettingChange('syncDirection', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="import_only">Import Only (HR → Platform)</SelectItem>
                    <SelectItem value="export_only">Export Only (Platform → HR)</SelectItem>
                    {integration.supportedFeatures.bidirectionalSync && (
                      <SelectItem value="bidirectional">Bidirectional</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Auto Sync */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Synchronization</Label>
                  <p className="text-sm text-gray-500">
                    Enable automatic data synchronization on a schedule
                  </p>
                </div>
                <Switch
                  checked={config.syncSettings.autoSync}
                  onCheckedChange={(checked) => handleSyncSettingChange('autoSync', checked)}
                />
              </div>

              {/* Sync Interval */}
              {config.syncSettings.autoSync && (
                <div className="space-y-2">
                  <Label>Sync Interval</Label>
                  <Select 
                    value={config.syncSettings.syncInterval} 
                    onValueChange={(value) => handleSyncSettingChange('syncInterval', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Entities to Sync */}
              <div className="space-y-3">
                <Label>Data Types to Sync</Label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(config.syncSettings.syncEntities).map(([entity, enabled]) => {
                    const entityConfig = {
                      employees: { icon: Users, label: 'Employees', supported: integration.supportedFeatures.employeeSync },
                      departments: { icon: Building2, label: 'Departments', supported: integration.supportedFeatures.departmentSync },
                      jobPositions: { icon: Briefcase, label: 'Job Positions', supported: integration.supportedFeatures.jobSync },
                      applications: { icon: Database, label: 'Applications', supported: integration.supportedFeatures.applicationSync },
                      interviews: { icon: Users, label: 'Interviews', supported: integration.supportedFeatures.interviewSync },
                      onboardingTasks: { icon: CheckCircle, label: 'Onboarding', supported: true }
                    };

                    const EntityIcon = entityConfig[entity as keyof typeof entityConfig]?.icon || Database;
                    const isSupported = entityConfig[entity as keyof typeof entityConfig]?.supported;

                    return (
                      <div key={entity} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <EntityIcon className="w-4 h-4" />
                          <span className="text-sm">
                            {entityConfig[entity as keyof typeof entityConfig]?.label}
                          </span>
                          {!isSupported && (
                            <Badge variant="secondary" className="text-xs">
                              Not Supported
                            </Badge>
                          )}
                        </div>
                        <Switch
                          checked={enabled && isSupported}
                          onCheckedChange={(checked) => handleEntityToggle(entity, checked)}
                          disabled={!isSupported}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Webhooks */}
              {integration.supportedFeatures.realTimeWebhooks && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Real-time Webhooks</Label>
                    <p className="text-sm text-gray-500">
                      Receive instant updates when data changes in the HR system
                    </p>
                  </div>
                  <Switch
                    checked={config.syncSettings.enableRealTimeWebhooks}
                    onCheckedChange={(checked) => handleSyncSettingChange('enableRealTimeWebhooks', checked)}
                  />
                </div>
              )}

              {/* Conflict Resolution */}
              <div className="space-y-2">
                <Label>Conflict Resolution</Label>
                <Select 
                  value={config.syncSettings.conflictResolution} 
                  onValueChange={(value) => handleSyncSettingChange('conflictResolution', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform_wins">Platform Data Wins</SelectItem>
                    <SelectItem value="hr_system_wins">HR System Data Wins</SelectItem>
                    <SelectItem value="manual_review">Manual Review Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Mapping Tab */}
        <TabsContent value="mapping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Field Mapping
              </CardTitle>
              <CardDescription>
                Map fields between your HR system and our platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Field mapping configuration will be available after the initial connection is established.
                  Default mappings will be applied for common fields.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test & Review Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Test Connection
              </CardTitle>
              <CardDescription>
                Verify that the integration is configured correctly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testConnection} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>

              {testResult && (
                <Alert variant={testResult.connected ? 'default' : 'destructive'}>
                  {testResult.connected ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>{testResult.message}</p>
                      {testResult.tests && (
                        <div className="space-y-1">
                          <p className="font-medium text-sm">Test Results:</p>
                          <ul className="text-sm space-y-1">
                            <li className="flex items-center gap-2">
                              {testResult.tests.connection ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500" />
                              )}
                              Connection
                            </li>
                            {testResult.tests.dataAccess && Object.entries(testResult.tests.dataAccess).map(([key, success]) => (
                              <li key={key} className="flex items-center gap-2">
                                {success ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-500" />
                                )}
                                {key} Access
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {testResult?.connected && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Integration Summary</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>System:</strong> {integration.name}</p>
                    <p><strong>Sync Direction:</strong> {config.syncSettings.syncDirection}</p>
                    <p><strong>Auto Sync:</strong> {config.syncSettings.autoSync ? 'Enabled' : 'Disabled'}</p>
                    <p><strong>Entities:</strong> {Object.entries(config.syncSettings.syncEntities)
                      .filter(([, enabled]) => enabled)
                      .map(([entity]) => entity)
                      .join(', ')
                    }</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {activeTab !== 'test' && (
            <Button 
              variant="outline" 
              onClick={() => {
                const tabs = ['credentials', 'sync', 'mapping', 'test'];
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1]);
                }
              }}
            >
              Next
            </Button>
          )}
          {activeTab === 'test' && testResult?.connected && (
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}