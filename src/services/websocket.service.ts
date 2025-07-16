import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { auth as adminAuth } from '@/lib/firebase/server';
import { databaseService } from './database.service';
import { apiLogger } from '@/lib/logger';
import { addSentryBreadcrumb } from '@/lib/sentry';

export interface NotificationEvent {
  type: 'job_update' | 'application_update' | 'interview_scheduled' | 'message' | 'system_alert';
  data: any;
  userId?: string;
  companyId?: string;
  timestamp: number;
}

export interface ConnectedUser {
  userId: string;
  socketId: string;
  role: string;
  companyId?: string;
  connectedAt: number;
}

export class WebSocketService {
  private io: Server | null = null;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor() {
    this.connectedUsers = new Map();
    this.userSockets = new Map();
  }

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    apiLogger.info('WebSocket service initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      apiLogger.info('New WebSocket connection', { socketId: socket.id });
      addSentryBreadcrumb('WebSocket connection established', 'websocket', 'info', {
        socketId: socket.id
      });

      // Handle user authentication
      socket.on('authenticate', async (data) => {
        try {
          const { token } = data;
          
          if (!token) {
            socket.emit('auth_error', { message: 'No authentication token provided' });
            return;
          }

          // Verify Firebase token
          const decodedToken = await adminAuth.verifyIdToken(token);
          const user = await databaseService.getUser(decodedToken.uid);

          if (!user) {
            socket.emit('auth_error', { message: 'User not found' });
            return;
          }

          // Store user connection
          const connectedUser: ConnectedUser = {
            userId: user.id,
            socketId: socket.id,
            role: user.role,
            companyId: user.companyId || undefined,
            connectedAt: Date.now()
          };

          this.connectedUsers.set(socket.id, connectedUser);
          
          // Track user's multiple connections
          if (!this.userSockets.has(user.id)) {
            this.userSockets.set(user.id, new Set());
          }
          this.userSockets.get(user.id)!.add(socket.id);

          // Join user to their rooms
          socket.join(`user:${user.id}`);
          if (user.companyId) {
            socket.join(`company:${user.companyId}`);
          }
          socket.join(`role:${user.role}`);

          socket.emit('authenticated', {
            userId: user.id,
            role: user.role,
            companyId: user.companyId
          });

          apiLogger.info('User authenticated via WebSocket', {
            userId: user.id,
            socketId: socket.id,
            role: user.role
          });

        } catch (error) {
          apiLogger.error('WebSocket authentication failed', {
            error: String(error),
            socketId: socket.id
          });
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Handle real-time messaging
      socket.on('send_message', async (data) => {
        try {
          const connectedUser = this.connectedUsers.get(socket.id);
          if (!connectedUser) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const { recipientId, message, type = 'text' } = data;

          // Store message in database
          const messageData = {
            senderId: connectedUser.userId,
            recipientId,
            message,
            type,
            timestamp: Date.now(),
            read: false
          };

          // Send to recipient if they're online
          this.sendToUser(recipientId, 'new_message', messageData);

          // Confirm to sender
          socket.emit('message_sent', { messageId: Date.now(), timestamp: messageData.timestamp });

          apiLogger.info('Message sent via WebSocket', {
            senderId: connectedUser.userId,
            recipientId,
            type
          });

        } catch (error) {
          apiLogger.error('Error sending message', {
            error: String(error),
            socketId: socket.id
          });
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const connectedUser = this.connectedUsers.get(socket.id);
        if (!connectedUser) return;

        const { recipientId } = data;
        this.sendToUser(recipientId, 'user_typing', {
          userId: connectedUser.userId,
          typing: true
        });
      });

      socket.on('typing_stop', (data) => {
        const connectedUser = this.connectedUsers.get(socket.id);
        if (!connectedUser) return;

        const { recipientId } = data;
        this.sendToUser(recipientId, 'user_typing', {
          userId: connectedUser.userId,
          typing: false
        });
      });

      // Handle presence updates
      socket.on('update_presence', (data) => {
        const connectedUser = this.connectedUsers.get(socket.id);
        if (!connectedUser) return;

        const { status } = data; // 'online', 'away', 'busy', 'offline'
        
        // Broadcast to company members
        if (connectedUser.companyId) {
          socket.to(`company:${connectedUser.companyId}`).emit('presence_update', {
            userId: connectedUser.userId,
            status,
            timestamp: Date.now()
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        const connectedUser = this.connectedUsers.get(socket.id);
        
        if (connectedUser) {
          // Remove from user's socket set
          const userSockets = this.userSockets.get(connectedUser.userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              this.userSockets.delete(connectedUser.userId);
              
              // User is completely offline, broadcast to company
              if (connectedUser.companyId) {
                socket.to(`company:${connectedUser.companyId}`).emit('presence_update', {
                  userId: connectedUser.userId,
                  status: 'offline',
                  timestamp: Date.now()
                });
              }
            }
          }

          this.connectedUsers.delete(socket.id);
          
          apiLogger.info('User disconnected from WebSocket', {
            userId: connectedUser.userId,
            socketId: socket.id,
            reason
          });
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        apiLogger.error('WebSocket error', {
          error: String(error),
          socketId: socket.id
        });
      });
    });
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, event: string, data: any): boolean {
    if (!this.io) return false;

    const userSockets = this.userSockets.get(userId);
    if (!userSockets || userSockets.size === 0) {
      return false; // User not connected
    }

    this.io.to(`user:${userId}`).emit(event, data);
    
    addSentryBreadcrumb('WebSocket notification sent', 'websocket', 'info', {
      userId,
      event,
      socketCount: userSockets.size
    });

    return true;
  }

  /**
   * Send notification to all users in a company
   */
  sendToCompany(companyId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`company:${companyId}`).emit(event, data);
    
    addSentryBreadcrumb('WebSocket company notification sent', 'websocket', 'info', {
      companyId,
      event
    });
  }

  /**
   * Send notification to all users with a specific role
   */
  sendToRole(role: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`role:${role}`).emit(event, data);
    
    addSentryBreadcrumb('WebSocket role notification sent', 'websocket', 'info', {
      role,
      event
    });
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event: string, data: any): void {
    if (!this.io) return;

    this.io.emit(event, data);
    
    addSentryBreadcrumb('WebSocket broadcast sent', 'websocket', 'info', {
      event,
      connectedUsers: this.connectedUsers.size
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users for a company
   */
  getCompanyConnectedUsers(companyId: string): ConnectedUser[] {
    return Array.from(this.connectedUsers.values()).filter(
      user => user.companyId === companyId
    );
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Get user's connection info
   */
  getUserConnectionInfo(userId: string): ConnectedUser | null {
    for (const user of this.connectedUsers.values()) {
      if (user.userId === userId) {
        return user;
      }
    }
    return null;
  }

  /**
   * Send notification about job application updates
   */
  sendJobApplicationUpdate(applicationId: string, candidateId: string, companyId: string, data: any): void {
    // Notify the candidate
    this.sendToUser(candidateId, 'application_update', {
      applicationId,
      ...data,
      timestamp: Date.now()
    });

    // Notify company recruiters
    this.sendToCompany(companyId, 'application_update', {
      applicationId,
      candidateId,
      ...data,
      timestamp: Date.now()
    });
  }

  /**
   * Send real-time job status updates
   */
  sendJobStatusUpdate(jobId: string, companyId: string, data: {
    previousStatus: string;
    newStatus: string;
    title: string;
    message: string;
    stats?: any;
    updatedBy?: string;
  }): void {
    const updateData = {
      type: 'job_status_update',
      jobId,
      ...data,
      timestamp: Date.now()
    };

    // Notify company team
    this.sendToCompany(companyId, 'job_update', updateData);

    // Also send to all users who have applied to this job
    // (This will be handled by the notification service)
  }

  /**
   * Send real-time application status updates
   */
  sendApplicationStatusUpdate(
    applicationId: string,
    candidateId: string,
    companyId: string,
    data: {
      previousStatus: string;
      newStatus: string;
      title: string;
      message: string;
      reason?: string;
      updatedBy?: string;
    }
  ): void {
    const updateData = {
      type: 'application_status_update',
      applicationId,
      candidateId,
      ...data,
      timestamp: Date.now()
    };

    // Notify the candidate
    this.sendToUser(candidateId, 'application_update', updateData);

    // Notify company recruiters
    this.sendToCompany(companyId, 'application_update', updateData);
  }

  /**
   * Send notification about interview scheduling
   */
  sendInterviewUpdate(interviewId: string, candidateId: string, interviewerId: string, companyId: string, data: any): void {
    // Notify the candidate
    this.sendToUser(candidateId, 'interview_update', {
      interviewId,
      ...data,
      timestamp: Date.now()
    });

    // Notify the interviewer
    this.sendToUser(interviewerId, 'interview_update', {
      interviewId,
      candidateId,
      ...data,
      timestamp: Date.now()
    });

    // Notify company recruiters
    this.sendToCompany(companyId, 'interview_update', {
      interviewId,
      candidateId,
      interviewerId,
      ...data,
      timestamp: Date.now()
    });
  }

  /**
   * Send system alert
   */
  sendSystemAlert(level: 'info' | 'warning' | 'error', message: string, targetUsers?: string[]): void {
    const alertData = {
      level,
      message,
      timestamp: Date.now()
    };

    if (targetUsers) {
      targetUsers.forEach(userId => {
        this.sendToUser(userId, 'system_alert', alertData);
      });
    } else {
      this.broadcast('system_alert', alertData);
    }
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;