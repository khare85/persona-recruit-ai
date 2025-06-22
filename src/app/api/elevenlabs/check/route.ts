import { NextRequest, NextResponse } from 'next/server';
import { getDefaultElevenLabsConfig } from '@/lib/elevenlabs';

// Check ElevenLabs configuration and connectivity
export async function GET(request: NextRequest) {
  try {
    const config = getDefaultElevenLabsConfig();
    
    // Check if API key is configured
    if (!config.apiKey || config.apiKey === 'demo-key') {
      return NextResponse.json({
        success: false,
        error: 'ElevenLabs API key not configured',
        message: 'Please set ELEVENLABS_API_KEY environment variable',
        config: {
          hasApiKey: false,
          hasAgentId: !!config.agentId && config.agentId !== 'demo-agent',
          hasVoiceId: !!config.voiceId && config.voiceId !== 'default-voice'
        }
      });
    }

    // Test API connectivity
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: 'Invalid ElevenLabs API key',
          message: 'API key authentication failed',
          config: {
            hasApiKey: true,
            hasAgentId: !!config.agentId && config.agentId !== 'demo-agent',
            hasVoiceId: !!config.voiceId && config.voiceId !== 'default-voice'
          }
        });
      }

      const userData = await response.json();

      // Check if agent exists
      let agentStatus = 'not_checked';
      if (config.agentId && config.agentId !== 'demo-agent') {
        try {
          const agentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${config.agentId}`, {
            headers: {
              'Authorization': `Bearer ${config.apiKey}`
            }
          });
          agentStatus = agentResponse.ok ? 'valid' : 'invalid';
        } catch {
          agentStatus = 'error';
        }
      }

      return NextResponse.json({
        success: true,
        message: 'ElevenLabs configuration is valid',
        config: {
          hasApiKey: true,
          hasAgentId: !!config.agentId && config.agentId !== 'demo-agent',
          hasVoiceId: !!config.voiceId && config.voiceId !== 'default-voice',
          agentStatus
        },
        user: {
          email: userData.email,
          subscription: userData.subscription?.tier || 'free',
          characterCount: userData.subscription?.character_count || 0,
          characterLimit: userData.subscription?.character_limit || 10000
        }
      });

    } catch (apiError) {
      console.error('ElevenLabs API test error:', apiError);
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to ElevenLabs API',
        message: 'Network error or API endpoint unavailable',
        config: {
          hasApiKey: true,
          hasAgentId: !!config.agentId && config.agentId !== 'demo-agent',
          hasVoiceId: !!config.voiceId && config.voiceId !== 'default-voice'
        }
      });
    }

  } catch (error) {
    console.error('ElevenLabs configuration check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Configuration check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create or validate ElevenLabs agent configuration
export async function POST(request: NextRequest) {
  try {
    const config = getDefaultElevenLabsConfig();
    const body = await request.json();
    
    if (!config.apiKey || config.apiKey === 'demo-key') {
      return NextResponse.json({
        success: false,
        error: 'API key required'
      }, { status: 400 });
    }

    const { 
      name = 'AI Interview Agent',
      prompt = 'You are a professional AI interviewer conducting technical and behavioral interviews for job candidates.',
      voiceId = config.voiceId,
      model = 'eleven_turbo_v2'
    } = body;

    // Create new agent
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        prompt,
        voice_id: voiceId,
        model,
        conversation_config: {
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({
        success: false,
        error: 'Failed to create agent',
        details: error
      }, { status: response.status });
    }

    const agent = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Agent created successfully',
      agent: {
        id: agent.agent_id,
        name: agent.name,
        voiceId: agent.voice_id,
        model: agent.model
      },
      instructions: {
        envVar: 'ELEVENLABS_AGENT_ID',
        value: agent.agent_id,
        message: 'Add this agent ID to your environment variables'
      }
    });

  } catch (error) {
    console.error('Agent creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create agent',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}