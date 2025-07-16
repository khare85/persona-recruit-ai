'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { Message, Conversation } from '@/services/messagingService';
import { toast } from './use-toast';

export interface MessageWithDelivery extends Message {
  isDelivered?: boolean;
  isPending?: boolean;
  deliveryError?: string;
}

export const useMessaging = () => {
  const { user } = useAuth();
  const { subscribe, unsubscribe, sendMessage: sendSocketMessage, sendTyping, isConnected } = useWebSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Map<string, MessageWithDelivery[]>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Load user conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('Failed to load conversations');
      
      const result = await response.json();
      setConversations(result.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    }
  }, [user]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string, before?: Date) => {
    try {
      const params = new URLSearchParams({
        conversationId,
        limit: '50'
      });
      
      if (before) {
        params.append('before', before.toISOString());
      }

      const response = await fetch(`/api/messages?${params}`);
      if (!response.ok) throw new Error('Failed to load messages');
      
      const result = await response.json();
      const newMessages = result.data || [];

      setMessages(prev => {
        const existing = prev.get(conversationId) || [];
        const combined = before 
          ? [...newMessages, ...existing]
          : newMessages;
        
        return new Map(prev.set(conversationId, combined));
      });

      return newMessages;
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
      return [];
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (
    recipientId: string,
    content: string,
    type: 'text' | 'file' | 'image' = 'text',
    conversationId?: string,
    metadata?: any,
    replyToId?: string
  ) => {
    if (!user) return null;

    // Create temporary message for immediate UI feedback
    const tempMessage: MessageWithDelivery = {
      id: `temp_${Date.now()}`,
      conversationId: conversationId || 'temp',
      senderId: user.id,
      recipientId,
      content,
      type,
      metadata,
      replyToId,
      reactions: [],
      isPending: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to messages immediately
    if (conversationId) {
      setMessages(prev => {
        const existing = prev.get(conversationId) || [];
        return new Map(prev.set(conversationId, [...existing, tempMessage]));
      });
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId,
          content,
          type,
          conversationId,
          metadata,
          replyToId
        })
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const result = await response.json();
      const sentMessage = result.data;

      // Replace temporary message with real message
      if (conversationId) {
        setMessages(prev => {
          const existing = prev.get(conversationId) || [];
          const updated = existing.map(msg => 
            msg.id === tempMessage.id 
              ? { ...sentMessage, isDelivered: true, isPending: false }
              : msg
          );
          return new Map(prev.set(conversationId, updated));
        });
      }

      // Update conversations list
      loadConversations();

      return sentMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark temporary message as failed
      if (conversationId) {
        setMessages(prev => {
          const existing = prev.get(conversationId) || [];
          const updated = existing.map(msg => 
            msg.id === tempMessage.id 
              ? { ...msg, isPending: false, deliveryError: 'Failed to send' }
              : msg
          );
          return new Map(prev.set(conversationId, updated));
        });
      }

      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, loadConversations]);

  // Create conversation
  const createConversation = useCallback(async (
    type: 'direct' | 'job_application',
    participantId: string,
    jobId?: string,
    applicationId?: string
  ) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          participantId,
          jobId,
          applicationId
        })
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      
      const result = await response.json();
      const conversation = result.data;

      // Add to conversations list
      setConversations(prev => [conversation, ...prev]);

      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' })
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  // Add reaction to message
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_reaction', emoji })
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, []);

  // Archive conversation
  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' })
      });

      // Remove from conversations list
      setConversations(prev => prev.filter(c => c.id !== conversationId));
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback((recipientId: string, isTyping: boolean) => {
    if (isConnected) {
      sendTyping(recipientId, isTyping);
    }
  }, [isConnected, sendTyping]);

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected) return;

    const handleNewMessage = (data: any) => {
      const { message, conversation } = data;
      
      // Add message to conversations
      setMessages(prev => {
        const existing = prev.get(message.conversationId) || [];
        const updated = [...existing, message];
        return new Map(prev.set(message.conversationId, updated));
      });

      // Update conversation in list
      setConversations(prev => {
        const existing = prev.find(c => c.id === conversation.id);
        if (existing) {
          return prev.map(c => c.id === conversation.id ? conversation : c);
        } else {
          return [conversation, ...prev];
        }
      });

      // Show notification if not in active conversation
      if (message.conversationId !== activeConversation && message.senderId !== user?.id) {
        toast({
          title: 'New Message',
          description: message.content,
          duration: 3000,
        });
      }
    };

    const handleMessageReaction = (data: any) => {
      const { messageId, userId, emoji } = data;
      
      setMessages(prev => {
        const newMap = new Map(prev);
        for (const [conversationId, msgs] of newMap.entries()) {
          const updated = msgs.map(msg => {
            if (msg.id === messageId) {
              const reactions = msg.reactions || [];
              const existingReaction = reactions.find(r => r.userId === userId);
              
              if (existingReaction) {
                existingReaction.emoji = emoji;
              } else {
                reactions.push({ userId, emoji, timestamp: new Date() });
              }
              
              return { ...msg, reactions };
            }
            return msg;
          });
          newMap.set(conversationId, updated);
        }
        return newMap;
      });
    };

    const handleMessageDeleted = (data: any) => {
      const { messageId, conversationId } = data;
      
      setMessages(prev => {
        const existing = prev.get(conversationId) || [];
        const updated = existing.filter(msg => msg.id !== messageId);
        return new Map(prev.set(conversationId, updated));
      });
    };

    const handleTypingUpdate = (data: any) => {
      const { userId, typing } = data;
      
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        // This would need the conversation ID to work properly
        // For now, we'll handle it globally
        return newMap;
      });
    };

    subscribe('new_message', handleNewMessage);
    subscribe('message_reaction', handleMessageReaction);
    subscribe('message_deleted', handleMessageDeleted);
    subscribe('user_typing', handleTypingUpdate);

    return () => {
      unsubscribe('new_message', handleNewMessage);
      unsubscribe('message_reaction', handleMessageReaction);
      unsubscribe('message_deleted', handleMessageDeleted);
      unsubscribe('user_typing', handleTypingUpdate);
    };
  }, [isConnected, activeConversation, user?.id, subscribe, unsubscribe]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation && !messages.has(activeConversation)) {
      loadMessages(activeConversation);
    }
  }, [activeConversation, messages, loadMessages]);

  return {
    // State
    conversations,
    messages,
    activeConversation,
    typingUsers,
    unreadCounts,
    isLoading,
    isConnected,

    // Actions
    sendMessage,
    createConversation,
    markAsRead,
    addReaction,
    deleteMessage,
    archiveConversation,
    sendTypingIndicator,

    // Conversation management
    setActiveConversation,
    loadMessages,
    loadConversations,

    // Utilities
    getConversationMessages: (conversationId: string) => messages.get(conversationId) || [],
    getUnreadCount: (conversationId: string) => unreadCounts.get(conversationId) || 0,
    getTotalUnreadCount: () => Array.from(unreadCounts.values()).reduce((sum, count) => sum + count, 0),
  };
};