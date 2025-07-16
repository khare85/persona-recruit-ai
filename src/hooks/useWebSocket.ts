'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface WebSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

export interface WebSocketStatus {
  connected: boolean;
  authenticated: boolean;
  connecting: boolean;
  error: string | null;
  reconnecting: boolean;
  onlineUsers: number;
}

export const useWebSocket = (options: WebSocketOptions = {}) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    authenticated: false,
    connecting: false,
    error: null,
    reconnecting: false,
    onlineUsers: 0
  });

  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Map<string, any>>(new Map());

  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    timeout = 20000
  } = options;

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setStatus(prev => ({ ...prev, connecting: true, error: null }));

    const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout,
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      autoConnect: false
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setStatus(prev => ({ 
        ...prev, 
        connected: true, 
        connecting: false, 
        reconnecting: false, 
        error: null 
      }));

      // Authenticate if user is available
      if (user) {
        socket.emit('authenticate', { token: user.accessToken });
      }
    });

    socket.on('disconnect', (reason) => {
      setStatus(prev => ({ 
        ...prev, 
        connected: false, 
        authenticated: false 
      }));

      if (reason === 'io server disconnect') {
        // Server disconnected, need to reconnect manually
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      setStatus(prev => ({ 
        ...prev, 
        connecting: false, 
        error: error.message 
      }));
    });

    socket.on('reconnect_attempt', () => {
      setStatus(prev => ({ ...prev, reconnecting: true }));
    });

    socket.on('reconnect', () => {
      setStatus(prev => ({ ...prev, reconnecting: false }));
    });

    socket.on('reconnect_failed', () => {
      setStatus(prev => ({ 
        ...prev, 
        reconnecting: false, 
        error: 'Failed to reconnect' 
      }));
    });

    // Authentication events
    socket.on('authenticated', (data) => {
      setStatus(prev => ({ ...prev, authenticated: true }));
      toast({
        title: "Connected",
        description: "Real-time notifications enabled",
        duration: 3000,
      });
    });

    socket.on('auth_error', (error) => {
      setStatus(prev => ({ 
        ...prev, 
        authenticated: false, 
        error: error.message 
      }));
    });

    // Message events
    socket.on('new_message', (message) => {
      setMessages(prev => [...prev, {
        type: 'message',
        data: message,
        timestamp: Date.now()
      }]);
    });

    // Typing events
    socket.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.typing) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });

    // Presence events
    socket.on('presence_update', (data) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        if (data.status === 'offline') {
          newMap.delete(data.userId);
        } else {
          newMap.set(data.userId, data);
        }
        return newMap;
      });
    });

    // Notification events
    socket.on('job_update', (data) => {
      toast({
        title: "Job Updated",
        description: data.message || "A job has been updated",
        duration: 5000,
      });
    });

    socket.on('application_update', (data) => {
      toast({
        title: "Application Update",
        description: data.message || "Your application status has changed",
        duration: 5000,
      });
    });

    socket.on('interview_update', (data) => {
      toast({
        title: "Interview Update",
        description: data.message || "Interview scheduled",
        duration: 5000,
      });
    });

    socket.on('system_alert', (data) => {
      toast({
        title: "System Alert",
        description: data.message,
        variant: data.level === 'error' ? 'destructive' : 'default',
        duration: 10000,
      });
    });

    // Connect the socket
    socket.connect();
  }, [user, timeout, reconnection, reconnectionAttempts, reconnectionDelay]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setStatus({
      connected: false,
      authenticated: false,
      connecting: false,
      error: null,
      reconnecting: false,
      onlineUsers: 0
    });
  }, []);

  // Send message
  const sendMessage = useCallback((recipientId: string, message: string, type: string = 'text') => {
    if (socketRef.current && status.authenticated) {
      socketRef.current.emit('send_message', {
        recipientId,
        message,
        type
      });
    }
  }, [status.authenticated]);

  // Send typing indicator
  const sendTyping = useCallback((recipientId: string, isTyping: boolean) => {
    if (socketRef.current && status.authenticated) {
      socketRef.current.emit(isTyping ? 'typing_start' : 'typing_stop', {
        recipientId
      });
    }
  }, [status.authenticated]);

  // Update presence
  const updatePresence = useCallback((status: string) => {
    if (socketRef.current && status) {
      socketRef.current.emit('update_presence', { status });
    }
  }, []);

  // Subscribe to specific events
  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Unsubscribe from events
  const unsubscribe = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  // Auto-connect when user is available
  useEffect(() => {
    if (user && autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Handle visibility changes (pause/resume connection)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updatePresence]);

  return {
    // Connection status
    status,
    
    // Connection methods
    connect,
    disconnect,
    
    // Messaging
    sendMessage,
    sendTyping,
    messages,
    typingUsers,
    
    // Presence
    updatePresence,
    onlineUsers,
    
    // Event handling
    subscribe,
    unsubscribe,
    
    // Utility
    isConnected: status.connected,
    isAuthenticated: status.authenticated,
    socket: socketRef.current
  };
};