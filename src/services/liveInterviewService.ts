import { conductConversationTurn, LiveInterviewInput, LiveInterviewOutput } from '@/ai/flows/live-interview-flow';
import { webSocketService } from './websocket.service';
import { databaseService } from './database.service';
import { apiLogger } from '@/lib/logger';
import { addSentryBreadcrumb } from '@/lib/sentry';

export interface LiveInterviewSession {
  id: string;
  interviewId: string;
  candidateId: string;
  recruiterId: string;
  jobId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  conversationHistory: ConversationTurn[];
  startedAt: Date;
  completedAt?: Date;
  metadata: {
    jobTitle: string;
    jobDescription: string;
    candidateName: string;
    candidateResumeSummary?: string;
    maxTurns: number;
  };
}

export interface ConversationTurn {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: Date;
  metadata?: any;
}

export interface LiveInterviewUpdate {
  sessionId: string;
  type: 'conversation_turn' | 'status_change' | 'interview_complete';
  data: {
    aiResponse?: string;
    isInterviewOver?: boolean;
    reasonForEnding?: string;
    conversationHistory?: ConversationTurn[];
    status?: string;
    timestamp: number;
  };
}

class LiveInterviewService {
  private static instance: LiveInterviewService;
  private activeSessions: Map<string, LiveInterviewSession> = new Map();
  
  static getInstance(): LiveInterviewService {
    if (!LiveInterviewService.instance) {
      LiveInterviewService.instance = new LiveInterviewService();
    }
    return LiveInterviewService.instance;
  }

  /**
   * Start a new live interview session
   */
  async startInterviewSession(
    interviewId: string,
    candidateId: string,
    recruiterId: string,
    jobId: string,
    metadata: {
      jobTitle: string;
      jobDescription: string;
      candidateName: string;
      candidateResumeSummary?: string;
      maxTurns?: number;
    }
  ): Promise<LiveInterviewSession> {
    const sessionId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: LiveInterviewSession = {
      id: sessionId,
      interviewId,
      candidateId,
      recruiterId,
      jobId,
      status: 'pending',
      conversationHistory: [],
      startedAt: new Date(),
      metadata: {
        ...metadata,
        maxTurns: metadata.maxTurns || 10
      }
    };

    // Store session
    this.activeSessions.set(sessionId, session);
    await databaseService.create('live_interview_sessions', session);

    // Start the interview with AI introduction
    await this.processConversationTurn(sessionId, '', true);

    apiLogger.info('Live interview session started', {
      sessionId,
      interviewId,
      candidateId,
      jobId
    });

    return session;
  }

  /**
   * Process a conversation turn with real-time updates
   */
  async processConversationTurn(
    sessionId: string,
    userInput: string,
    isInitial: boolean = false
  ): Promise<LiveInterviewOutput> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Interview session not found');
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      throw new Error('Interview session is no longer active');
    }

    try {
      // Update session status
      session.status = 'in_progress';
      await this.updateSessionStatus(sessionId, 'in_progress');

      // Add user input to conversation history (unless it's the initial AI introduction)
      if (!isInitial && userInput.trim()) {
        const userTurn: ConversationTurn = {
          speaker: 'user',
          text: userInput.trim(),
          timestamp: new Date()
        };
        session.conversationHistory.push(userTurn);
      }

      // Prepare AI input
      const aiInput: LiveInterviewInput = {
        jobTitle: session.metadata.jobTitle,
        jobDescription: session.metadata.jobDescription,
        candidateName: session.metadata.candidateName,
        candidateResumeSummary: session.metadata.candidateResumeSummary,
        conversationHistory: session.conversationHistory.map(turn => ({
          speaker: turn.speaker,
          text: turn.text
        })),
        maxTurns: session.metadata.maxTurns
      };

      // Get AI response
      const aiOutput = await conductConversationTurn(aiInput);

      // Add AI response to conversation history
      const aiTurn: ConversationTurn = {
        speaker: 'ai',
        text: aiOutput.aiResponse,
        timestamp: new Date(),
        metadata: {
          isInterviewOver: aiOutput.isInterviewOver,
          reasonForEnding: aiOutput.reasonForEnding
        }
      };
      session.conversationHistory.push(aiTurn);

      // Update session in database
      await databaseService.update('live_interview_sessions', sessionId, {
        conversationHistory: session.conversationHistory,
        status: session.status
      });

      // Send real-time update to participants
      await this.sendRealTimeUpdate(session, {
        type: 'conversation_turn',
        data: {
          aiResponse: aiOutput.aiResponse,
          isInterviewOver: aiOutput.isInterviewOver,
          reasonForEnding: aiOutput.reasonForEnding,
          conversationHistory: session.conversationHistory,
          timestamp: Date.now()
        }
      });

      // Handle interview completion
      if (aiOutput.isInterviewOver) {
        await this.completeInterviewSession(sessionId, aiOutput.reasonForEnding);
      }

      addSentryBreadcrumb('Live interview turn processed', 'interview', 'info', {
        sessionId,
        turnCount: session.conversationHistory.length,
        isInterviewOver: aiOutput.isInterviewOver
      });

      return aiOutput;

    } catch (error) {
      apiLogger.error('Failed to process conversation turn', {
        error: String(error),
        sessionId,
        userInput: userInput.substring(0, 100) // Log first 100 chars only
      });

      // Send error update
      await this.sendRealTimeUpdate(session, {
        type: 'conversation_turn',
        data: {
          aiResponse: 'I apologize, but I encountered an error. Could you please try again?',
          isInterviewOver: false,
          timestamp: Date.now()
        }
      });

      throw error;
    }
  }

  /**
   * Complete interview session
   */
  async completeInterviewSession(sessionId: string, reason?: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Interview session not found');
    }

    session.status = 'completed';
    session.completedAt = new Date();

    // Update in database
    await databaseService.update('live_interview_sessions', sessionId, {
      status: 'completed',
      completedAt: session.completedAt
    });

    // Send completion update
    await this.sendRealTimeUpdate(session, {
      type: 'interview_complete',
      data: {
        status: 'completed',
        reasonForEnding: reason,
        conversationHistory: session.conversationHistory,
        timestamp: Date.now()
      }
    });

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    apiLogger.info('Live interview session completed', {
      sessionId,
      reason,
      turnCount: session.conversationHistory.length
    });
  }

  /**
   * Cancel interview session
   */
  async cancelInterviewSession(sessionId: string, reason?: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Interview session not found');
    }

    session.status = 'cancelled';
    session.completedAt = new Date();

    // Update in database
    await databaseService.update('live_interview_sessions', sessionId, {
      status: 'cancelled',
      completedAt: session.completedAt
    });

    // Send cancellation update
    await this.sendRealTimeUpdate(session, {
      type: 'status_change',
      data: {
        status: 'cancelled',
        reasonForEnding: reason || 'Interview cancelled',
        timestamp: Date.now()
      }
    });

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    apiLogger.info('Live interview session cancelled', {
      sessionId,
      reason
    });
  }

  /**
   * Get interview session
   */
  async getInterviewSession(sessionId: string): Promise<LiveInterviewSession | null> {
    // Check active sessions first
    const activeSession = this.activeSessions.get(sessionId);
    if (activeSession) return activeSession;

    // Check database
    return await databaseService.findById('live_interview_sessions', sessionId) as LiveInterviewSession;
  }

  /**
   * Get active sessions for user
   */
  async getUserActiveSessions(userId: string): Promise<LiveInterviewSession[]> {
    const sessions = await databaseService.findMany('live_interview_sessions', {
      where: [
        { field: 'candidateId', operator: '==', value: userId },
        { field: 'status', operator: 'in', value: ['pending', 'in_progress'] }
      ]
    });

    return sessions as LiveInterviewSession[];
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId: string): Promise<ConversationTurn[]> {
    const session = await this.getInterviewSession(sessionId);
    return session?.conversationHistory || [];
  }

  /**
   * Send real-time update to participants
   */
  private async sendRealTimeUpdate(session: LiveInterviewSession, update: LiveInterviewUpdate): Promise<void> {
    // Send to candidate
    webSocketService.sendToUser(session.candidateId, 'live_interview_update', {
      sessionId: session.id,
      ...update
    });

    // Send to recruiter
    webSocketService.sendToUser(session.recruiterId, 'live_interview_update', {
      sessionId: session.id,
      ...update
    });

    // Send to company team if different from recruiter
    if (session.recruiterId) {
      const recruiter = await databaseService.findById('users', session.recruiterId);
      if (recruiter?.companyId) {
        webSocketService.sendToCompany(recruiter.companyId, 'live_interview_update', {
          sessionId: session.id,
          candidateId: session.candidateId,
          ...update
        });
      }
    }
  }

  /**
   * Update session status
   */
  private async updateSessionStatus(sessionId: string, status: LiveInterviewSession['status']): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = status;
      
      await databaseService.update('live_interview_sessions', sessionId, { status });
      
      await this.sendRealTimeUpdate(session, {
        type: 'status_change',
        data: {
          status,
          timestamp: Date.now()
        }
      });
    }
  }

  /**
   * Get interview statistics
   */
  async getInterviewStats(sessionId: string): Promise<{
    totalTurns: number;
    userTurns: number;
    aiTurns: number;
    averageResponseTime: number;
    duration: number;
  }> {
    const session = await this.getInterviewSession(sessionId);
    if (!session) {
      throw new Error('Interview session not found');
    }

    const history = session.conversationHistory;
    const userTurns = history.filter(turn => turn.speaker === 'user').length;
    const aiTurns = history.filter(turn => turn.speaker === 'ai').length;
    
    const duration = session.completedAt 
      ? session.completedAt.getTime() - session.startedAt.getTime()
      : Date.now() - session.startedAt.getTime();

    // Simple average response time calculation
    const averageResponseTime = history.length > 0 ? duration / history.length : 0;

    return {
      totalTurns: history.length,
      userTurns,
      aiTurns,
      averageResponseTime,
      duration
    };
  }
}

export const liveInterviewService = LiveInterviewService.getInstance();
export default liveInterviewService;