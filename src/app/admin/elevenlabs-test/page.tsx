'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Settings, 
  Volume2, 
  Mic,
  AlertTriangle,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';

interface ConfigStatus {
  success: boolean;
  error?: string;
  message?: string;
  config?: {
    hasApiKey: boolean;
    hasAgentId: boolean;
    hasVoiceId: boolean;
    agentStatus?: string;
  };
  user?: {
    email: string;
    subscription: string;
    characterCount: number;
    characterLimit: number;
  };
}

interface AgentCreationResult {
  success: boolean;
  error?: string;
  agent?: {
    id: string;
    name: string;
    voiceId: string;
    model: string;
  };
  instructions?: {
    envVar: string;
    value: string;
    message: string;
  };
}

export default function ElevenLabsTestPage() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [agentResult, setAgentResult] = useState<AgentCreationResult | null>(null);
  
  // Agent creation form
  const [agentConfig, setAgentConfig] = useState({
    name: 'AI Interview Agent',
    prompt: 'You are a professional AI interviewer conducting technical and behavioral interviews for job candidates. Ask relevant questions about their experience, skills, and fit for the role. Be conversational, friendly, and professional.',
    apiKey: '',
    voiceId: ''
  });

  const checkConfiguration = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/elevenlabs/check');
      const result = await response.json();
      setConfigStatus(result);
    } catch (error) {
      setConfigStatus({
        success: false,
        error: 'Failed to check configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const createAgent = async () => {
    if (!agentConfig.apiKey) {
      alert('Please enter your ElevenLabs API key');
      return;
    }

    setIsCreatingAgent(true);
    try {
      const response = await fetch('/api/elevenlabs/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentConfig)
      });
      
      const result = await response.json();
      setAgentResult(result);
    } catch (error) {
      setAgentResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error);
    }
  };

  useEffect(() => {
    checkConfiguration();
  }, []);

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getConfigItemStatus = (hasItem: boolean, label: string) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {getStatusIcon(hasItem)}
        <Badge variant={hasItem ? "default" : "destructive"}>
          {hasItem ? "Configured" : "Missing"}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">ElevenLabs Integration Test</h1>
        <p className="text-gray-600">Check and configure ElevenLabs Conversational AI for interviews</p>
      </div>

      <div className="grid gap-6">
        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Status
            </CardTitle>
            <CardDescription>
              Current ElevenLabs configuration and connectivity status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Button 
                onClick={checkConfiguration} 
                disabled={isChecking}
                variant="outline"
                size="sm"
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Check Configuration
              </Button>
            </div>

            {configStatus && (
              <div className="space-y-4">
                <Alert variant={configStatus.success ? "default" : "destructive"}>
                  <AlertDescription className="flex items-center gap-2">
                    {getStatusIcon(configStatus.success)}
                    <span>{configStatus.message}</span>
                  </AlertDescription>
                </Alert>

                {configStatus.config && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Configuration Items</h4>
                    <div className="space-y-1">
                      {getConfigItemStatus(configStatus.config.hasApiKey, "API Key")}
                      {getConfigItemStatus(configStatus.config.hasAgentId, "Agent ID")}
                      {getConfigItemStatus(configStatus.config.hasVoiceId, "Voice ID")}
                      
                      {configStatus.config.agentStatus && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm">Agent Status</span>
                          <Badge variant={
                            configStatus.config.agentStatus === 'valid' ? "default" : 
                            configStatus.config.agentStatus === 'invalid' ? "destructive" : 
                            "secondary"
                          }>
                            {configStatus.config.agentStatus}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {configStatus.user && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Account Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium">{configStatus.user.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Subscription:</span>
                        <p className="font-medium capitalize">{configStatus.user.subscription}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Characters Used:</span>
                        <p className="font-medium">
                          {configStatus.user.characterCount.toLocaleString()} / {configStatus.user.characterLimit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Variables Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>
              Required environment variables for ElevenLabs integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Add these environment variables to your <code>.env.local</code> file:
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>ELEVENLABS_API_KEY=your_api_key_here</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard('ELEVENLABS_API_KEY=your_api_key_here')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ELEVENLABS_AGENT_ID=your_agent_id_here</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard('ELEVENLABS_AGENT_ID=your_agent_id_here')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ELEVENLABS_VOICE_ID=your_voice_id_here</span>
                    <Button 
                      variant="ghost" 
                      size="sm"                      onClick={() => copyToClipboard('ELEVENLABS_VOICE_ID=your_voice_id_here')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Create Interview Agent
            </CardTitle>
            <CardDescription>
              Create a new ElevenLabs Conversational AI agent for interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agentName">Agent Name</Label>
                  <Input
                    id="agentName"
                    value={agentConfig.name}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="AI Interview Agent"
                  />
                </div>
                <div>
                  <Label htmlFor="apiKey">ElevenLabs API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={agentConfig.apiKey}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Your ElevenLabs API key"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="voiceId">Voice ID (optional)</Label>
                <Input
                  id="voiceId"
                  value={agentConfig.voiceId}
                  onChange={(e) => setAgentConfig(prev => ({ ...prev, voiceId: e.target.value }))}
                  placeholder="Leave empty for default voice"
                />
              </div>

              <div>
                <Label htmlFor="prompt">Agent Prompt</Label>
                <Textarea
                  id="prompt"
                  value={agentConfig.prompt}
                  onChange={(e) => setAgentConfig(prev => ({ ...prev, prompt: e.target.value }))}
                  rows={4}
                  placeholder="Define how the AI should conduct interviews..."
                />
              </div>

              <Button 
                onClick={createAgent} 
                disabled={isCreatingAgent || !agentConfig.apiKey}
                className="w-full"
              >
                {isCreatingAgent ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Volume2 className="h-4 w-4 mr-2" />
                )}
                Create Agent
              </Button>

              {agentResult && (
                <Alert variant={agentResult.success ? "default" : "destructive"}>
                  <AlertDescription>
                    {agentResult.success ? (
                      <div className="space-y-2">
                        <p>{agentResult.instructions?.message}</p>
                        {agentResult.agent && (
                          <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 font-mono text-sm">
                            <div className="flex items-center justify-between">
                              <span>{agentResult.instructions?.envVar}={agentResult.agent.id}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(`${agentResult.instructions?.envVar}=${agentResult.agent?.id}`)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span>{agentResult.error}</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documentation Links */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation & Resources</CardTitle>
            <CardDescription>
              Helpful links for setting up ElevenLabs integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a 
                href="https://elevenlabs.io/docs/conversational-ai/overview" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                ElevenLabs Conversational AI Documentation
              </a>
              <a 
                href="https://elevenlabs.io/app/conversational-ai" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                ElevenLabs Conversational AI Dashboard
              </a>
              <a 
                href="https://elevenlabs.io/app/settings/api-keys" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                Get Your API Key
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}