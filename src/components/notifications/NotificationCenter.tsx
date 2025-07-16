'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, MessageCircle, Briefcase, Calendar, Alert, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  userId: string;
  type: 'job_update' | 'application_update' | 'interview_scheduled' | 'message' | 'system_alert' | 'payment_reminder';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: string[];
}

const notificationIcons = {
  job_update: Briefcase,
  application_update: Briefcase,
  interview_scheduled: Calendar,
  message: MessageCircle,
  system_alert: Alert,
  payment_reminder: DollarSign,
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export function NotificationCenter() {
  const { user } = useAuth();
  const { subscribe, unsubscribe, isConnected } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to load notifications');
      
      const result = await response.json();
      const notificationData = result.data || [];
      
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' })
      });

      if (!response.ok) throw new Error('Failed to mark notification as read');

      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT'
      });

      if (!response.ok) throw new Error('Failed to mark all notifications as read');

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete notification');

      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Handle notification clicks
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'job_update':
        if (notification.data?.jobId) {
          window.location.href = `/jobs/${notification.data.jobId}`;
        }
        break;
      case 'application_update':
        if (notification.data?.applicationId) {
          window.location.href = `/applications/${notification.data.applicationId}`;
        }
        break;
      case 'interview_scheduled':
        if (notification.data?.interviewId) {
          window.location.href = `/interviews/${notification.data.interviewId}`;
        }
        break;
      case 'message':
        if (notification.data?.conversationId) {
          window.location.href = `/messages/${notification.data.conversationId}`;
        }
        break;
      case 'payment_reminder':
        window.location.href = '/company/billing';
        break;
    }
  };

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected) return;

    const handleNewNotification = (data: any) => {
      const notification: Notification = {
        id: data.id || `notif_${Date.now()}`,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        read: false,
        createdAt: new Date(data.timestamp || Date.now()),
        priority: data.priority || 'medium',
        channels: data.channels || ['websocket']
      };

      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast for high priority notifications
      if (data.priority === 'high' || data.priority === 'urgent') {
        toast({
          title: data.title,
          description: data.message,
          duration: 5000,
        });
      }
    };

    // Subscribe to various notification types
    subscribe('job_update', handleNewNotification);
    subscribe('application_update', handleNewNotification);
    subscribe('interview_scheduled', handleNewNotification);
    subscribe('message', handleNewNotification);
    subscribe('system_alert', handleNewNotification);
    subscribe('payment_reminder', handleNewNotification);

    return () => {
      unsubscribe('job_update', handleNewNotification);
      unsubscribe('application_update', handleNewNotification);
      unsubscribe('interview_scheduled', handleNewNotification);
      unsubscribe('message', handleNewNotification);
      unsubscribe('system_alert', handleNewNotification);
      unsubscribe('payment_reminder', handleNewNotification);
    };
  }, [isConnected, subscribe, unsubscribe]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [user]);

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const Icon = notificationIcons[notification.type] || Bell;
    
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
          !notification.read && "bg-blue-50 border-l-4 border-l-blue-500"
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          priorityColors[notification.priority]
        )}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{notification.title}</h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
            </span>
            
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {notification.priority}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative p-2"
          onClick={() => setIsOpen(true)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Badge variant="outline">{unreadCount} new</Badge>
              </div>
            </div>
          </CardHeader>
          
          <Separator />
          
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}