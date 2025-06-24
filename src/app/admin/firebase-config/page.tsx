'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Shield,
  Users,
  Database,
  Key,
  Flag,
  Code,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FirebaseConfig {
  auth: {
    signInMethods: string[];
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    sessionTimeout: number;
    multiFactorAuth: boolean;
    emailVerification: boolean;
  };
  firestoreRules: {
    rules: string;
    version: string;
    lastUpdated: string;
    updatedBy: string;
  };
  storageRules: {
    rules: string;
    version: string;
    lastUpdated: string;
    updatedBy: string;
  };
  api: {
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
      requestsPerHour: number;
    };
    cors: {
      allowedOrigins: string[];
      allowedMethods: string[];
      allowedHeaders: string[];
    };
    apiKeys: Record<string, any>;
  };
  roles: Record<string, {
    displayName: string;
    permissions: string[];
    inheritFrom?: string[];
    isDefault?: boolean;
  }>;
  features: Record<string, {
    enabled: boolean;
    rolloutPercentage: number;
    allowedRoles: string[];
  }>;
}

export default function FirebaseConfigPage() {
  const [config, setConfig] = useState<FirebaseConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('auth');
  const [showRulesPreview, setShowRulesPreview] = useState(false);

  // Role management state
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleConfig, setNewRoleConfig] = useState({
    displayName: '',
    permissions: [] as string[],
    isDefault: false
  });
  const [editingRole, setEditingRole] = useState<string | null>(null);

  // Feature flag management state
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureConfig, setNewFeatureConfig] = useState({
    enabled: true,
    rolloutPercentage: 100,
    allowedRoles: [] as string[]
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/firebase-config');
      
      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }
      
      const data = await response.json();
      setConfig(data.data.config);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (section?: string, sectionData?: any) => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/admin/firebase-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: section ? sectionData : config,
          section
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      
      const data = await response.json();
      setConfig(data.data.config);
      
      // Show success message
      console.log('Configuration saved successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateRules = async (type: 'firestore' | 'storage', rules: string) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/firebase-config/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, rules }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update ${type} rules`);
      }
      
      await fetchConfig(); // Refresh config
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to update ${type} rules`);
    } finally {
      setSaving(false);
    }
  };

  const createRole = async () => {
    if (!newRoleName || !newRoleConfig.displayName) return;
    
    try {
      const response = await fetch('/api/admin/firebase-config/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleName: newRoleName,
          roleConfig: newRoleConfig
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create role');
      }
      
      setNewRoleName('');
      setNewRoleConfig({ displayName: '', permissions: [], isDefault: false });
      await fetchConfig();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create role');
    }
  };

  const deleteRole = async (roleName: string) => {
    try {
      const response = await fetch(`/api/admin/firebase-config/roles?role=${roleName}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete role');
      }
      
      await fetchConfig();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete role');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container className="py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  if (!config) {
    return (
      <DashboardLayout>
        <Container className="py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Configuration Error</h3>
            <p className="text-gray-600">{error || 'Failed to load Firebase configuration'}</p>
            <Button onClick={fetchConfig} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <Settings className="mr-3 h-8 w-8 text-primary" />
                Firebase Configuration
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage Firebase authentication, security rules, and application settings
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchConfig} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => saveConfig()} disabled={saving} size="sm">
                {saving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save All
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 max-w-4xl">
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="rules">Security Rules</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="api">API Config</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* Authentication Tab */}
          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Authentication Settings
                </CardTitle>
                <CardDescription>
                  Configure sign-in methods, password policies, and session management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Sign-in Methods</Label>
                  <div className="mt-2 space-y-2">
                    {['email', 'google', 'github', 'microsoft'].map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <Switch
                          checked={config.auth.signInMethods.includes(method)}
                          onCheckedChange={(checked) => {
                            const newMethods = checked
                              ? [...config.auth.signInMethods, method]
                              : config.auth.signInMethods.filter(m => m !== method);
                            
                            setConfig({
                              ...config,
                              auth: {
                                ...config.auth,
                                signInMethods: newMethods
                              }
                            });
                          }}
                        />
                        <Label className="capitalize">{method}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium">Password Policy</Label>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minLength">Minimum Length</Label>
                      <Input
                        id="minLength"
                        type="number"
                        value={config.auth.passwordPolicy.minLength}
                        onChange={(e) => setConfig({
                          ...config,
                          auth: {
                            ...config.auth,
                            passwordPolicy: {
                              ...config.auth.passwordPolicy,
                              minLength: parseInt(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={config.auth.sessionTimeout}
                        onChange={(e) => setConfig({
                          ...config,
                          auth: {
                            ...config.auth,
                            sessionTimeout: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    {[
                      { key: 'requireUppercase', label: 'Require Uppercase' },
                      { key: 'requireLowercase', label: 'Require Lowercase' },
                      { key: 'requireNumbers', label: 'Require Numbers' },
                      { key: 'requireSymbols', label: 'Require Symbols' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          checked={config.auth.passwordPolicy[key as keyof typeof config.auth.passwordPolicy]}
                          onCheckedChange={(checked) => setConfig({
                            ...config,
                            auth: {
                              ...config.auth,
                              passwordPolicy: {
                                ...config.auth.passwordPolicy,
                                [key]: checked
                              }
                            }
                          })}
                        />
                        <Label>{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.auth.multiFactorAuth}
                      onCheckedChange={(checked) => setConfig({
                        ...config,
                        auth: {
                          ...config.auth,
                          multiFactorAuth: checked
                        }
                      })}
                    />
                    <Label>Enable Multi-Factor Authentication</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.auth.emailVerification}
                      onCheckedChange={(checked) => setConfig({
                        ...config,
                        auth: {
                          ...config.auth,
                          emailVerification: checked
                        }
                      })}
                    />
                    <Label>Require Email Verification</Label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => saveConfig('auth', config.auth)} disabled={saving}>
                    Save Authentication Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Database className="mr-2 h-5 w-5" />
                      Firestore Rules
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRulesPreview(!showRulesPreview)}
                    >
                      {showRulesPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Security rules for Firestore database access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Current Version: {config.firestoreRules.version}</Label>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(config.firestoreRules.lastUpdated).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Updated by: {config.firestoreRules.updatedBy}
                      </p>
                    </div>
                    
                    <Textarea
                      value={config.firestoreRules.rules}
                      onChange={(e) => setConfig({
                        ...config,
                        firestoreRules: {
                          ...config.firestoreRules,
                          rules: e.target.value
                        }
                      })}
                      rows={15}
                      className="font-mono text-sm"
                      placeholder="Enter Firestore security rules..."
                    />
                    
                    <Button 
                      onClick={() => updateRules('firestore', config.firestoreRules.rules)}
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? 'Updating...' : 'Update Firestore Rules'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    Storage Rules
                  </CardTitle>
                  <CardDescription>
                    Security rules for Firebase Storage access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Current Version: {config.storageRules.version}</Label>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(config.storageRules.lastUpdated).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Updated by: {config.storageRules.updatedBy}
                      </p>
                    </div>
                    
                    <Textarea
                      value={config.storageRules.rules}
                      onChange={(e) => setConfig({
                        ...config,
                        storageRules: {
                          ...config.storageRules,
                          rules: e.target.value
                        }
                      })}
                      rows={15}
                      className="font-mono text-sm"
                      placeholder="Enter Storage security rules..."
                    />
                    
                    <Button 
                      onClick={() => updateRules('storage', config.storageRules.rules)}
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? 'Updating...' : 'Update Storage Rules'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  User Roles & Permissions
                </CardTitle>
                <CardDescription>
                  Manage user roles and their associated permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Create New Role */}
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-medium mb-3">Create New Role</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="roleName">Role Name</Label>
                        <Input
                          id="roleName"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="e.g., hr_manager"
                        />
                      </div>
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={newRoleConfig.displayName}
                          onChange={(e) => setNewRoleConfig({
                            ...newRoleConfig,
                            displayName: e.target.value
                          })}
                          placeholder="e.g., HR Manager"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button onClick={createRole} disabled={!newRoleName || !newRoleConfig.displayName}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Role
                      </Button>
                    </div>
                  </div>

                  {/* Existing Roles */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Existing Roles</h4>
                    {Object.entries(config.roles).map(([roleName, roleConfig]) => (
                      <Card key={roleName} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium">{roleConfig.displayName}</h5>
                              <Badge variant="outline">{roleName}</Badge>
                              {roleConfig.isDefault && <Badge variant="secondary">Default</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              Permissions: {roleConfig.permissions.join(', ')}
                            </div>
                            {roleConfig.inheritFrom && (
                              <div className="text-sm text-muted-foreground">
                                Inherits from: {roleConfig.inheritFrom.join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteRole(roleName)}
                              disabled={roleName === 'super_admin'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Flag className="mr-2 h-5 w-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription>
                  Control feature rollouts and access by user roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(config.features).map(([featureName, featureConfig]) => (
                    <Card key={featureName} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium capitalize">{featureName.replace(/([A-Z])/g, ' $1')}</h5>
                            <Badge variant={featureConfig.enabled ? "default" : "secondary"}>
                              {featureConfig.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Rollout: {featureConfig.rolloutPercentage}% | 
                            Roles: {featureConfig.allowedRoles.join(', ') || 'All roles'}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Switch
                            checked={featureConfig.enabled}
                            onCheckedChange={(enabled) => {
                              setConfig({
                                ...config,
                                features: {
                                  ...config.features,
                                  [featureName]: {
                                    ...featureConfig,
                                    enabled
                                  }
                                }
                              });
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Config Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="mr-2 h-5 w-5" />
                  API Configuration
                </CardTitle>
                <CardDescription>
                  Configure rate limiting, CORS, and API access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Rate Limiting</h4>
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      checked={config.api.rateLimiting.enabled}
                      onCheckedChange={(enabled) => setConfig({
                        ...config,
                        api: {
                          ...config.api,
                          rateLimiting: {
                            ...config.api.rateLimiting,
                            enabled
                          }
                        }
                      })}
                    />
                    <Label>Enable Rate Limiting</Label>
                  </div>
                  
                  {config.api.rateLimiting.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="requestsPerMinute">Requests per Minute</Label>
                        <Input
                          id="requestsPerMinute"
                          type="number"
                          value={config.api.rateLimiting.requestsPerMinute}
                          onChange={(e) => setConfig({
                            ...config,
                            api: {
                              ...config.api,
                              rateLimiting: {
                                ...config.api.rateLimiting,
                                requestsPerMinute: parseInt(e.target.value)
                              }
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="requestsPerHour">Requests per Hour</Label>
                        <Input
                          id="requestsPerHour"
                          type="number"
                          value={config.api.rateLimiting.requestsPerHour}
                          onChange={(e) => setConfig({
                            ...config,
                            api: {
                              ...config.api,
                              rateLimiting: {
                                ...config.api.rateLimiting,
                                requestsPerHour: parseInt(e.target.value)
                              }
                            }
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">CORS Configuration</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="allowedOrigins">Allowed Origins (one per line)</Label>
                      <Textarea
                        id="allowedOrigins"
                        value={config.api.cors.allowedOrigins.join('\n')}
                        onChange={(e) => setConfig({
                          ...config,
                          api: {
                            ...config.api,
                            cors: {
                              ...config.api.cors,
                              allowedOrigins: e.target.value.split('\n').filter(Boolean)
                            }
                          }
                        })}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => saveConfig('api', config.api)} disabled={saving}>
                    Save API Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Shield className="mr-2 h-5 w-5" />
                    Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Sign-in Methods:</span>
                      <span>{config.auth.signInMethods.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MFA Enabled:</span>
                      <Badge variant={config.auth.multiFactorAuth ? "default" : "secondary"}>
                        {config.auth.multiFactorAuth ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Email Verification:</span>
                      <Badge variant={config.auth.emailVerification ? "default" : "secondary"}>
                        {config.auth.emailVerification ? "Required" : "Optional"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Users className="mr-2 h-5 w-5" />
                    Roles & Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Roles:</span>
                      <span>{Object.keys(config.roles).length}</span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(config.roles).map(([roleName, roleConfig]) => (
                        <div key={roleName} className="flex justify-between text-sm">
                          <span>{roleConfig.displayName}:</span>
                          <span>{roleConfig.permissions.length} permissions</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Flag className="mr-2 h-5 w-5" />
                    Feature Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Features:</span>
                      <span>{Object.keys(config.features).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enabled:</span>
                      <span>{Object.values(config.features).filter(f => f.enabled).length}</span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(config.features).map(([featureName, featureConfig]) => (
                        <div key={featureName} className="flex justify-between text-sm">
                          <span className="capitalize">{featureName.replace(/([A-Z])/g, ' $1')}:</span>
                          <Badge variant={featureConfig.enabled ? "default" : "secondary"} className="text-xs">
                            {featureConfig.enabled ? `${featureConfig.rolloutPercentage}%` : "Off"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Configuration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Firestore Rules: {config.firestoreRules.version}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Storage Rules: {config.storageRules.version}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Rate Limiting: {config.api.rateLimiting.enabled ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>CORS: {config.api.cors.allowedOrigins.length} origins</span>
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