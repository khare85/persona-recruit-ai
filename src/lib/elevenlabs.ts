/**
 * ElevenLabs Conversational AI Integration
 * Handles real-time voice conversation for AI interviews
 */

export interface ElevenLabsConfig {
  apiKey: string;
  agentId: string;
  voiceId?: string;
  model?: string;
}

export interface ConversationSession {
  sessionId: string;
  agentId: string;
  isActive: boolean;
  startTime: Date;
  endTime?: Date;
}

export interface ConversationMessage {
  id: string;
  speaker: 'ai' | 'user';
  text: string;
  timestamp: Date;
  audioUrl?: string;
  confidence?: number;
}

export interface ConversationState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  error?: string;
}

export class ElevenLabsConversationService {
  private config: ElevenLabsConfig;
  private ws: WebSocket | null = null;
  private session: ConversationSession | null = null;
  private messageHandlers: ((message: ConversationMessage) => void)[] = [];
  private stateHandlers: ((state: ConversationState) => void)[] = [];
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(config: ElevenLabsConfig) {
    this.config = config;
  }

  /**
   * Initialize the conversation session
   */
  async initializeSession(interviewContext: {
    candidateName: string;
    position: string;
    company: string;
    jobDescription?: string;
  }): Promise<ConversationSession> {
    try {
      // Create session with ElevenLabs API
      const response = await fetch('https://api.elevenlabs.io/v1/convai/conversation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: this.config.agentId,
          context: {
            candidate_name: interviewContext.candidateName,
            position: interviewContext.position,
            company: interviewContext.company,
            job_description: interviewContext.jobDescription,
            interview_type: 'technical_behavioral',
            instructions: `You are conducting an AI interview for ${interviewContext.candidateName} applying for ${interviewContext.position} at ${interviewContext.company}. Be professional, friendly, and ask relevant questions about their experience, skills, and fit for the role. Keep responses conversational and engaging.`
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.statusText}`);
      }

      const data = await response.json();
      
      this.session = {
        sessionId: data.conversation_id,
        agentId: this.config.agentId,
        isActive: true,
        startTime: new Date()
      };

      return this.session;
    } catch (error) {
      console.error('ElevenLabs session initialization error:', error);
      throw new Error('Failed to initialize AI interview session');
    }
  }

  /**
   * Start real-time conversation with WebSocket
   */
  async startConversation(): Promise<void> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    try {
      // Setup audio context and media recorder
      await this.setupAudioCapture();

      // Connect to ElevenLabs WebSocket
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation/${this.session.sessionId}/ws`;
      this.ws = new WebSocket(wsUrl, [], {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      } as any);

      this.ws.onopen = () => {
        this.updateState({ isConnected: true, isListening: false, isSpeaking: false });
        this.startListening();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      this.ws.onclose = () => {
        this.updateState({ isConnected: false, isListening: false, isSpeaking: false });
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.updateState({ 
          isConnected: false, 
          isListening: false, 
          isSpeaking: false, 
          error: 'Connection error' 
        });
      };

    } catch (error) {
      console.error('Conversation start error:', error);
      throw new Error('Failed to start conversation');
    }
  }

  /**
   * Setup audio capture from microphone
   */
  private async setupAudioCapture(): Promise<void> {
    try {
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
          // Convert to PCM and send to ElevenLabs
          this.sendAudioChunk(event.data);
        }
      };

    } catch (error) {
      console.error('Audio capture setup error:', error);
      throw new Error('Failed to setup audio capture');
    }
  }

  /**
   * Start listening for user speech
   */
  private startListening(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
      this.audioChunks = [];
      this.mediaRecorder.start(100); // Capture in 100ms chunks
      this.updateState({ isListening: true, isSpeaking: false });
    }
  }

  /**
   * Stop listening
   */
  private stopListening(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.updateState({ isListening: false });
    }
  }

  /**
   * Send audio chunk to ElevenLabs
   */
  private async sendAudioChunk(audioBlob: Blob): Promise<void> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);
      
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'audio_chunk',
          data: Array.from(audioData)
        }));
      }
    } catch (error) {
      console.error('Audio send error:', error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'agent_response':
          this.handleAgentResponse(message);
          break;
        case 'transcription':
          this.handleTranscription(message);
          break;
        case 'audio_chunk':
          this.playAudioChunk(message.data);
          break;
        case 'conversation_started':
          this.updateState({ isConnected: true });
          break;
        case 'agent_speaking_started':
          this.updateState({ isSpeaking: true, isListening: false });
          break;
        case 'agent_speaking_ended':
          this.updateState({ isSpeaking: false });
          this.startListening();
          break;
        case 'error':
          this.updateState({ error: message.message });
          break;
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  /**
   * Handle agent text response
   */
  private handleAgentResponse(message: any): void {
    const conversationMessage: ConversationMessage = {
      id: `ai_${Date.now()}`,
      speaker: 'ai',
      text: message.text,
      timestamp: new Date(),
      audioUrl: message.audio_url,
      confidence: 1.0
    };

    this.notifyMessageHandlers(conversationMessage);
  }

  /**
   * Handle user speech transcription
   */
  private handleTranscription(message: any): void {
    const conversationMessage: ConversationMessage = {
      id: `user_${Date.now()}`,
      speaker: 'user',
      text: message.text,
      timestamp: new Date(),
      confidence: message.confidence
    };

    this.notifyMessageHandlers(conversationMessage);
  }

  /**
   * Play audio chunk from AI
   */
  private async playAudioChunk(audioData: number[]): Promise<void> {
    try {
      if (!this.audioContext) return;

      const audioBuffer = this.audioContext.createBuffer(1, audioData.length, 16000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < audioData.length; i++) {
        channelData[i] = audioData[i] / 32768; // Convert to float
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();

    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }

  /**
   * End the conversation
   */
  async endConversation(): Promise<void> {
    try {
      this.stopListening();
      
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      if (this.session) {
        // End session with ElevenLabs
        await fetch(`https://api.elevenlabs.io/v1/convai/conversation/${this.session.sessionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        });

        this.session.endTime = new Date();
        this.session.isActive = false;
      }

      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      this.updateState({ isConnected: false, isListening: false, isSpeaking: false });

    } catch (error) {
      console.error('End conversation error:', error);
    }
  }

  /**
   * Get conversation transcript
   */
  async getConversationTranscript(): Promise<ConversationMessage[]> {
    if (!this.session) {
      throw new Error('No active session');
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/${this.session.sessionId}/transcript`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transcript');
      }

      const data = await response.json();
      return data.messages.map((msg: any) => ({
        id: msg.id,
        speaker: msg.speaker === 'agent' ? 'ai' : 'user',
        text: msg.text,
        timestamp: new Date(msg.timestamp),
        confidence: msg.confidence
      }));

    } catch (error) {
      console.error('Transcript fetch error:', error);
      throw new Error('Failed to get conversation transcript');
    }
  }

  /**
   * Register message handler
   */
  onMessage(handler: (message: ConversationMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Register state change handler
   */
  onStateChange(handler: (state: ConversationState) => void): void {
    this.stateHandlers.push(handler);
  }

  /**
   * Notify message handlers
   */
  private notifyMessageHandlers(message: ConversationMessage): void {
    this.messageHandlers.forEach(handler => handler(message));
  }

  /**
   * Update and notify state handlers
   */
  private updateState(newState: Partial<ConversationState>): void {
    const currentState: ConversationState = {
      isConnected: false,
      isListening: false,
      isSpeaking: false,
      ...newState
    };
    
    this.stateHandlers.forEach(handler => handler(currentState));
  }

  /**
   * Get current session
   */
  getCurrentSession(): ConversationSession | null {
    return this.session;
  }
}

/**
 * Create ElevenLabs service instance
 */
export function createElevenLabsService(config: ElevenLabsConfig): ElevenLabsConversationService {
  return new ElevenLabsConversationService(config);
}

/**
 * Default configuration for demo/development
 */
export const getDefaultElevenLabsConfig = (): ElevenLabsConfig => ({
  apiKey: process.env.ELEVENLABS_API_KEY || 'demo-key',
  agentId: process.env.ELEVENLABS_AGENT_ID || 'demo-agent',
  voiceId: process.env.ELEVENLABS_VOICE_ID || 'default-voice',
  model: 'eleven_turbo_v2'
});