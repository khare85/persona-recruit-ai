'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Cpu,
  Settings,
  Zap,
  Brain,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

interface AIConfig {
  models: {
    matching: { enabled: boolean; model: string; threshold: number };
    resume: { enabled: boolean; model: string; batchSize: number };
    interview: { enabled: boolean; model: string; maxTokens: number };
  };
  features: {
    autoMatching: boolean;
    biasDetection: boolean;
    sentimentAnalysis: boolean;
    skillExtraction: boolean;
  };
  performance: {
    requestsPerMinute: number;
    avgResponseTime: number;
    successRate: number;
  };
}

export default function AdminAIConfigPage() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAIConfig();
  }, []);

  const fetchAIConfig = async () => {
    try {
      // Mock data - in real implementation would fetch from AI service configuration
      setConfig({
        models: {
          matching: { enabled: true, model: 'textembedding-gecko-multilingual', threshold: 0.7 },
          resume: { enabled: true, model: 'gemini-1.5-flash', batchSize: 10 },
          interview: { enabled: true, model: 'gemini-1.5-pro', maxTokens: 2048 }
        },
        features: {
          autoMatching: true,
          biasDetection: true,
          sentimentAnalysis: false,
          skillExtraction: true
        },
        performance: {
          requestsPerMinute: 1247,
          avgResponseTime: 340,
          successRate: 99.2
        }
      });
    } catch (error) {
      console.error('Error fetching AI config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    
    setIsSaving(true);
    try {
      // Mock save - in real implementation would update AI service configuration
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('AI configuration saved:', config);
    } catch (error) {
      console.error('Error saving AI config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateFeature = (feature: keyof AIConfig['features'], value: boolean) => {
    if (!config) return;
    setConfig({
      ...config,
      features: {
        ...config.features,
        [feature]: value
      }
    });
  };

  const updateModel = (model: keyof AIConfig['models'], field: string, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      models: {
        ...config.models,
        [model]: {
          ...config.models[model],
          [field]: value
        }
      }
    });
  };

  return (
    <AdminLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Brain className="mr-3 h-8 w-8 text-primary" />
            AI Configuration
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure AI models, features, and performance settings
          </p>
        </div>

        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests/Minute</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{config?.performance.requestsPerMinute || 0}</div>
              <p className="text-xs text-muted-foreground">AI API calls</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{config?.performance.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">Model inference time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{config?.performance.successRate}%</div>
              <p className="text-xs text-muted-foreground">
                <CheckCircle className="inline h-3 w-3 text-green-600 mr-1" />
                Excellent performance
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="models" className="space-y-6">
          <TabsList>
            <TabsTrigger value="models">AI Models</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="models">
            <div className="space-y-6">
              {/* Model Configuration Cards */}
              <Card>
                <CardHeader>
                  <CardTitle>Candidate Matching Model</CardTitle>
                  <CardDescription>Configure the AI model for job-candidate matching</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={config?.models.matching.enabled || false}
                      onCheckedChange={(checked) => updateModel('matching', 'enabled', checked)}
                    />
                    <Label>Enable candidate matching AI</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Model</Label>
                      <Input 
                        value={config?.models.matching.model || ''} 
                        onChange={(e) => updateModel('matching', 'model', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Similarity Threshold</Label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="1"
                        value={config?.models.matching.threshold || 0.7}
                        onChange={(e) => updateModel('matching', 'threshold', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resume Analysis Model</CardTitle>
                  <CardDescription>Configure AI for resume parsing and skill extraction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={config?.models.resume.enabled || false}
                      onCheckedChange={(checked) => updateModel('resume', 'enabled', checked)}
                    />
                    <Label>Enable resume analysis AI</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Model</Label>
                      <Input 
                        value={config?.models.resume.model || ''} 
                        onChange={(e) => updateModel('resume', 'model', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Batch Size</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        max="50"
                        value={config?.models.resume.batchSize || 10}
                        onChange={(e) => updateModel('resume', 'batchSize', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interview Analysis Model</CardTitle>
                  <CardDescription>Configure AI for interview transcript analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={config?.models.interview.enabled || false}
                      onCheckedChange={(checked) => updateModel('interview', 'enabled', checked)}
                    />
                    <Label>Enable interview analysis AI</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Model</Label>
                      <Input 
                        value={config?.models.interview.model || ''} 
                        onChange={(e) => updateModel('interview', 'model', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Max Tokens</Label>
                      <Input 
                        type="number" 
                        min="512" 
                        max="8192"
                        value={config?.models.interview.maxTokens || 2048}
                        onChange={(e) => updateModel('interview', 'maxTokens', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>AI Features</CardTitle>
                <CardDescription>Enable or disable specific AI-powered features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Automatic Job Matching</h4>
                    <p className="text-sm text-muted-foreground">Automatically match candidates to relevant jobs</p>
                  </div>
                  <Switch 
                    checked={config?.features.autoMatching || false}
                    onCheckedChange={(checked) => updateFeature('autoMatching', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Bias Detection</h4>
                    <p className="text-sm text-muted-foreground">Monitor and detect potential hiring bias</p>
                  </div>
                  <Switch 
                    checked={config?.features.biasDetection || false}
                    onCheckedChange={(checked) => updateFeature('biasDetection', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Sentiment Analysis</h4>
                    <p className="text-sm text-muted-foreground">Analyze sentiment in interview responses</p>
                  </div>
                  <Switch 
                    checked={config?.features.sentimentAnalysis || false}
                    onCheckedChange={(checked) => updateFeature('sentimentAnalysis', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Skill Extraction</h4>
                    <p className="text-sm text-muted-foreground">Extract skills from resumes and job descriptions</p>
                  </div>
                  <Switch 
                    checked={config?.features.skillExtraction || false}
                    onCheckedChange={(checked) => updateFeature('skillExtraction', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring">
            <Card>
              <CardHeader>
                <CardTitle>AI Performance Monitoring</CardTitle>
                <CardDescription>Real-time AI model performance and health metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">AI Monitoring Dashboard</h3>
                  <p className="text-muted-foreground">
                    Advanced monitoring features would be implemented here, including:
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p>• Real-time model performance metrics</p>
                    <p>• API usage and rate limiting status</p>
                    <p>• Error rates and failure analysis</p>
                    <p>• Cost tracking and optimization</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Configuration */}
        <div className="flex justify-end pt-6">
          <Button onClick={saveConfig} disabled={isSaving}>
            {isSaving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </Container>
    </AdminLayout>
  );
}