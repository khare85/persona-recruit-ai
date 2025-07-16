import { databaseService } from './database.service';
import { webSocketService } from './websocket.service';
import { notificationService } from './notification.service';
import { apiLogger } from '@/lib/logger';
import { addSentryBreadcrumb } from '@/lib/sentry';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    fileUrl?: string;
    imageUrl?: string;
    systemMessageType?: string;
  };
  readAt?: Date;
  deliveredAt?: Date;
  editedAt?: Date;
  replyToId?: string;
  reactions?: {
    userId: string;
    emoji: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'job_application' | 'interview';
  participants: string[];
  metadata?: {
    jobId?: string;
    applicationId?: string;
    interviewId?: string;
    companyId?: string;
    jobTitle?: string;
    candidateName?: string;
    recruiterName?: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
  };
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageDeliveryStatus {
  messageId: string;
  userId: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
}

class MessagingService {
  private static instance: MessagingService;
  
  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  /**
   * Send a message
   */
  async sendMessage(
    senderId: string,
    recipientId: string,
    content: string,
    type: Message['type'] = 'text',
    conversationId?: string,
    metadata?: Message['metadata'],
    replyToId?: string
  ): Promise<Message> {
    try {
      // Find or create conversation
      const conversation = conversationId 
        ? await this.getConversation(conversationId)
        : await this.createDirectConversation(senderId, recipientId);

      if (!conversation) {
        throw new Error('Failed to create or find conversation');
      }

      // Create message
      const message: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId: conversation.id,
        senderId,
        recipientId,
        content,
        type,
        metadata,
        replyToId,
        reactions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store message in database
      await databaseService.create('messages', message);

      // Update conversation with last message
      await this.updateConversationLastMessage(conversation.id, message);

      // Send via WebSocket if recipient is online
      const sent = webSocketService.sendToUser(recipientId, 'new_message', {
        message,
        conversation,
        timestamp: Date.now()
      });

      // Mark as delivered if sent via WebSocket
      if (sent) {
        await this.markAsDelivered(message.id, recipientId);
      }

      // Send push notification if recipient is offline or doesn't have WebSocket
      if (!sent) {
        await notificationService.sendNotification({
          userId: recipientId,
          type: 'message',
          title: 'New Message',
          message: this.truncateMessage(content),
          data: {
            messageId: message.id,
            conversationId: conversation.id,
            senderId,
            senderName: await this.getUserName(senderId)
          },
          priority: 'medium',
          channels: ['email', 'push']
        });
      }

      // Log the message
      apiLogger.info('Message sent', {
        messageId: message.id,
        senderId,
        recipientId,
        conversationId: conversation.id,
        type
      });

      addSentryBreadcrumb('Message sent', 'messaging', 'info', {
        messageId: message.id,
        type,
        conversationId: conversation.id
      });

      return message;

    } catch (error) {
      apiLogger.error('Failed to send message', {
        error: String(error),
        senderId,
        recipientId,
        type
      });
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    limit: number = 50,
    before?: Date,
    userId?: string
  ): Promise<Message[]> {
    const whereClause = [
      { field: 'conversationId', operator: '==', value: conversationId }
    ];

    if (before) {
      whereClause.push({ field: 'createdAt', operator: '<', value: before });
    }

    const messages = await databaseService.findMany('messages', {
      where: whereClause,
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit
    }) as Message[];

    // Mark messages as read if userId is provided
    if (userId) {
      await this.markMessagesAsRead(messages, userId);
    }

    return messages.reverse(); // Return in chronological order
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId: string, limit: number = 20): Promise<Conversation[]> {
    const conversations = await databaseService.findMany('conversations', {
      where: [
        { field: 'participants', operator: 'array-contains', value: userId },
        { field: 'isArchived', operator: '==', value: false }
      ],
      orderBy: { field: 'updatedAt', direction: 'desc' },
      limit
    }) as Conversation[];

    return conversations;
  }

  /**
   * Create a direct conversation
   */
  async createDirectConversation(user1Id: string, user2Id: string): Promise<Conversation> {
    // Check if conversation already exists
    const existingConversation = await databaseService.findMany('conversations', {
      where: [
        { field: 'type', operator: '==', value: 'direct' },
        { field: 'participants', operator: 'array-contains', value: user1Id }
      ]
    }) as Conversation[];

    const existing = existingConversation.find(conv => 
      conv.participants.includes(user2Id) && conv.participants.length === 2
    );

    if (existing) {
      return existing;
    }

    // Create new conversation
    const conversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'direct',
      participants: [user1Id, user2Id],
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await databaseService.create('conversations', conversation);

    return conversation;
  }

  /**
   * Create a job application conversation
   */
  async createJobApplicationConversation(
    candidateId: string,
    recruiterId: string,
    jobId: string,
    applicationId: string
  ): Promise<Conversation> {
    const job = await databaseService.findById('jobs', jobId);
    const candidate = await databaseService.findById('users', candidateId);
    const recruiter = await databaseService.findById('users', recruiterId);

    const conversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'job_application',
      participants: [candidateId, recruiterId],
      metadata: {
        jobId,
        applicationId,
        companyId: job?.companyId,
        jobTitle: job?.title,
        candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown',
        recruiterName: recruiter ? `${recruiter.firstName} ${recruiter.lastName}` : 'Unknown'
      },
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await databaseService.create('conversations', conversation);

    // Send initial system message
    await this.sendSystemMessage(
      conversation.id,
      `Conversation started for job application: ${job?.title || 'Unknown Job'}`
    );

    return conversation;
  }

  /**
   * Send system message
   */
  async sendSystemMessage(conversationId: string, content: string): Promise<Message> {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId: 'system',
      recipientId: 'system',
      content,
      type: 'system',
      metadata: {
        systemMessageType: 'info'
      },
      reactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await databaseService.create('messages', message);
    await this.updateConversationLastMessage(conversationId, message);

    return message;
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string, userId: string): Promise<void> {
    await databaseService.update('messages', messageId, {
      readAt: new Date(),
      updatedAt: new Date()
    });

    // Store read receipt
    await this.storeDeliveryStatus(messageId, userId, 'read');
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered(messageId: string, userId: string): Promise<void> {
    await databaseService.update('messages', messageId, {
      deliveredAt: new Date(),
      updatedAt: new Date()
    });

    // Store delivery receipt
    await this.storeDeliveryStatus(messageId, userId, 'delivered');
  }

  /**
   * Mark multiple messages as read
   */
  async markMessagesAsRead(messages: Message[], userId: string): Promise<void> {
    const unreadMessages = messages.filter(msg => 
      msg.recipientId === userId && !msg.readAt
    );

    for (const message of unreadMessages) {
      await this.markAsRead(message.id, userId);
    }
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    const message = await databaseService.findById('messages', messageId) as Message;
    if (!message) throw new Error('Message not found');

    const reactions = message.reactions || [];
    const existingReaction = reactions.find(r => r.userId === userId);

    if (existingReaction) {
      existingReaction.emoji = emoji;
      existingReaction.timestamp = new Date();
    } else {
      reactions.push({
        userId,
        emoji,
        timestamp: new Date()
      });
    }

    await databaseService.update('messages', messageId, {
      reactions,
      updatedAt: new Date()
    });

    // Notify other participants
    const conversation = await this.getConversation(message.conversationId);
    if (conversation) {
      const otherParticipants = conversation.participants.filter(p => p !== userId);
      for (const participantId of otherParticipants) {
        webSocketService.sendToUser(participantId, 'message_reaction', {
          messageId,
          userId,
          emoji,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Get conversation
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    return await databaseService.findById('conversations', conversationId) as Conversation;
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error('Conversation not found or access denied');
    }

    await databaseService.update('conversations', conversationId, {
      isArchived: true,
      updatedAt: new Date()
    });
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await databaseService.findById('messages', messageId) as Message;
    if (!message) throw new Error('Message not found');

    if (message.senderId !== userId) {
      throw new Error('Only the sender can delete messages');
    }

    await databaseService.delete('messages', messageId);

    // Notify other participants
    const conversation = await this.getConversation(message.conversationId);
    if (conversation) {
      const otherParticipants = conversation.participants.filter(p => p !== userId);
      for (const participantId of otherParticipants) {
        webSocketService.sendToUser(participantId, 'message_deleted', {
          messageId,
          conversationId: message.conversationId,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const messages = await databaseService.findMany('messages', {
      where: [
        { field: 'recipientId', operator: '==', value: userId },
        { field: 'readAt', operator: '==', value: null }
      ]
    });

    return messages.length;
  }

  /**
   * Search messages
   */
  async searchMessages(
    userId: string,
    query: string,
    conversationId?: string,
    limit: number = 20
  ): Promise<Message[]> {
    const whereClause = [
      { field: 'content', operator: 'contains', value: query }
    ];

    if (conversationId) {
      whereClause.push({ field: 'conversationId', operator: '==', value: conversationId });
    }

    const messages = await databaseService.findMany('messages', {
      where: whereClause,
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit
    }) as Message[];

    // Filter messages from conversations user is part of
    const userConversations = await this.getUserConversations(userId, 100);
    const conversationIds = new Set(userConversations.map(c => c.id));

    return messages.filter(msg => conversationIds.has(msg.conversationId));
  }

  /**
   * Helper methods
   */
  private async updateConversationLastMessage(conversationId: string, message: Message): Promise<void> {
    await databaseService.update('conversations', conversationId, {
      lastMessage: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        timestamp: message.createdAt
      },
      updatedAt: new Date()
    });
  }

  private async storeDeliveryStatus(messageId: string, userId: string, status: 'sent' | 'delivered' | 'read'): Promise<void> {
    const deliveryStatus: MessageDeliveryStatus = {
      messageId,
      userId,
      status,
      timestamp: new Date()
    };

    await databaseService.create('message_delivery_status', deliveryStatus);
  }

  private async getUserName(userId: string): Promise<string> {
    if (userId === 'system') return 'System';
    
    try {
      const user = await databaseService.findById('users', userId);
      return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
    } catch (error) {
      return 'Unknown User';
    }
  }

  private truncateMessage(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
}

export const messagingService = MessagingService.getInstance();
export default messagingService;