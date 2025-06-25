'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Bell, 
  Send, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  Briefcase,
  Users,
  Building,
  Mail,
  Phone,
  Video,
  Archive,
  Star,
  Reply,
  Forward,
  MoreHorizontal,
  Pin,
  Trash2
} from 'lucide-react';

interface Message {
  id: string;
  type: 'message' | 'interview_invite' | 'application_update' | 'job_match' | 'system';
  from: {
    name: string;
    email: string;
    company?: string;
    role: 'recruiter' | 'hr' | 'hiring_manager' | 'system';
    avatar?: string;
  };
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  relatedJob?: {
    id: string;
    title: string;
    company: string;
  };
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  actions?: Array<{
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'danger';
    action: string;
  }>;
}

interface Notification {
  id: string;
  type: 'application_status' | 'interview_scheduled' | 'job_recommendation' | 'message_received' | 'deadline_reminder';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
  actionUrl?: string;
  actionLabel?: string;
}

export default function CandidateMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [showReplyDialog, setShowReplyDialog] = useState(false);

  useEffect(() => {
    fetchMessagesAndNotifications();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, searchTerm, filterType, filterRead]);

  const fetchMessagesAndNotifications = async () => {
    try {
      const [messagesResponse, notificationsResponse] = await Promise.all([
        fetch('/api/candidates/messages'),
        fetch('/api/candidates/notifications')
      ]);

      if (messagesResponse.ok) {
        const messagesResult = await messagesResponse.json();
        setMessages(messagesResult.data.messages || []);
      }

      if (notificationsResponse.ok) {
        const notificationsResult = await notificationsResponse.json();
        setNotifications(notificationsResult.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching messages and notifications:', error);
      // Mock data for demonstration
      const mockMessages: Message[] = [
        {
          id: '1',
          type: 'interview_invite',
          from: {
            name: 'Sarah Johnson',
            email: 'sarah@techcorp.com',
            company: 'TechCorp Inc.',
            role: 'recruiter',
            avatar: undefined
          },
          subject: 'Interview Invitation - Senior Frontend Developer',
          content: 'Hi John! We were impressed with your application for the Senior Frontend Developer position. We would like to invite you for a technical interview next week. Please let me know your availability for Tuesday or Wednesday afternoon.',
          timestamp: '2024-06-24T10:30:00Z',
          isRead: false,
          isStarred: false,
          priority: 'high',
          relatedJob: {
            id: 'job_1',
            title: 'Senior Frontend Developer',
            company: 'TechCorp Inc.'
          },
          actions: [
            { id: 'accept', label: 'Accept Interview', type: 'primary', action: 'accept_interview' },
            { id: 'reschedule', label: 'Request Reschedule', type: 'secondary', action: 'reschedule_interview' }
          ]
        },
        {
          id: '2',
          type: 'application_update',
          from: {
            name: 'Mike Chen',
            email: 'mike@startup.com',
            company: 'StartupXYZ',
            role: 'hiring_manager',
            avatar: undefined
          },
          subject: 'Application Status Update - Full Stack Engineer',
          content: 'Thank you for your interest in the Full Stack Engineer position. Your application has been reviewed and we would like to move forward with the next stage of our hiring process.',
          timestamp: '2024-06-23T14:15:00Z',
          isRead: true,
          isStarred: true,
          priority: 'normal',
          relatedJob: {
            id: 'job_2',
            title: 'Full Stack Engineer',
            company: 'StartupXYZ'
          }
        },
        {
          id: '3',
          type: 'job_match',
          from: {
            name: 'AI Talent Matcher',
            email: 'ai@platform.com',
            role: 'system',
            avatar: undefined
          },
          subject: 'New Job Matches Found - 5 opportunities',
          content: 'Based on your profile and preferences, we found 5 new job opportunities that match your skills. These positions have high compatibility scores and are from companies actively hiring.',
          timestamp: '2024-06-22T09:00:00Z',
          isRead: true,
          isStarred: false,
          priority: 'normal',
          actions: [
            { id: 'view_matches', label: 'View Job Matches', type: 'primary', action: 'view_job_matches' }
          ]
        }
      ];

      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'interview_scheduled',
          title: 'Interview Scheduled',
          message: 'Your interview for Senior Frontend Developer at TechCorp Inc. is scheduled for tomorrow at 2:00 PM',
          timestamp: '2024-06-23T16:00:00Z',
          isRead: false,
          priority: 'high',
          actionUrl: '/candidates/my-interviews',
          actionLabel: 'View Interview'
        },
        {
          id: '2',
          type: 'application_status',
          title: 'Application Status Changed',
          message: 'Your application for Product Manager at Enterprise Ltd. has been updated to "Under Review"',
          timestamp: '2024-06-23T11:30:00Z',
          isRead: true,
          priority: 'normal',
          actionUrl: '/candidates/my-applications',
          actionLabel: 'View Application'
        },
        {
          id: '3',
          type: 'job_recommendation',
          title: 'New Job Recommendations',
          message: '3 new jobs matching your profile have been added to your recommendations',
          timestamp: '2024-06-22T08:00:00Z',
          isRead: true,
          priority: 'low',
          actionUrl: '/candidates/job-recommendations',
          actionLabel: 'View Jobs'
        }
      ];

      setMessages(mockMessages);
      setNotifications(mockNotifications);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    if (searchTerm) {
      filtered = filtered.filter(message => 
        message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.from.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.from.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(message => message.type === filterType);
    }

    if (filterRead !== 'all') {
      const isRead = filterRead === 'read';
      filtered = filtered.filter(message => message.isRead === isRead);
    }

    setFilteredMessages(filtered);
  };

  const markAsRead = async (messageId: string) => {
    setMessages(messages => 
      messages.map(message => 
        message.id === messageId ? { ...message, isRead: true } : message
      )
    );
  };

  const toggleStar = async (messageId: string) => {
    setMessages(messages => 
      messages.map(message => 
        message.id === messageId ? { ...message, isStarred: !message.isStarred } : message
      )
    );
  };

  const markNotificationAsRead = async (notificationId: string) => {
    setNotifications(notifications => 
      notifications.map(notification => 
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    );
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    try {
      // In real implementation, would send API request
      console.log('Sending reply:', { messageId: selectedMessage.id, content: replyText });
      setReplyText('');
      setShowReplyDialog(false);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'interview_invite': return <CalendarDays className="h-4 w-4 text-blue-600" />;
      case 'application_update': return <Briefcase className="h-4 w-4 text-green-600" />;
      case 'job_match': return <Star className="h-4 w-4 text-yellow-600" />;
      case 'system': return <Bell className="h-4 w-4 text-gray-600" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'normal': return null;
      case 'low': return <Badge variant="secondary">Low</Badge>;
      default: return null;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview_scheduled': return <CalendarDays className="h-4 w-4 text-blue-600" />;
      case 'application_status': return <Briefcase className="h-4 w-4 text-green-600" />;
      case 'job_recommendation': return <Star className="h-4 w-4 text-yellow-600" />;
      case 'message_received': return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'deadline_reminder': return <Clock className="h-4 w-4 text-red-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const unreadMessagesCount = messages.filter(m => !m.isRead).length;
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <DashboardLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <MessageSquare className="mr-3 h-8 w-8 text-primary" />
            Messages & Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay connected with recruiters and track important updates about your applications
          </p>
        </div>

        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList>
            <TabsTrigger value="messages" className="relative">
              Messages
              {unreadMessagesCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadMessagesCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {unreadNotificationsCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadNotificationsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Message List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Messages ({filteredMessages.length})</CardTitle>
                    </div>
                    
                    {/* Search and Filters */}
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search messages..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="message">Messages</SelectItem>
                            <SelectItem value="interview_invite">Interviews</SelectItem>
                            <SelectItem value="application_update">Applications</SelectItem>
                            <SelectItem value="job_match">Job Matches</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterRead} onValueChange={setFilterRead}>
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="unread">Unread</SelectItem>
                            <SelectItem value="read">Read</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-0">
                      {filteredMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                            selectedMessage?.id === message.id ? 'bg-muted' : ''
                          } ${!message.isRead ? 'border-l-4 border-l-primary' : ''}`}
                          onClick={() => {
                            setSelectedMessage(message);
                            if (!message.isRead) markAsRead(message.id);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {message.from.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  {getMessageIcon(message.type)}
                                  <span className={`text-sm ${!message.isRead ? 'font-semibold' : 'font-medium'}`}>
                                    {message.from.name}
                                  </span>
                                  {message.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                                </div>
                                <p className={`text-sm truncate ${!message.isRead ? 'font-medium' : ''}`}>
                                  {message.subject}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {message.content}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(message.timestamp).toLocaleDateString()}
                                  </span>
                                  {getPriorityBadge(message.priority)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Message Detail */}
              <div className="lg:col-span-2">
                {selectedMessage ? (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getMessageIcon(selectedMessage.type)}
                            <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                            {getPriorityBadge(selectedMessage.priority)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {selectedMessage.from.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{selectedMessage.from.name}</span>
                              {selectedMessage.from.company && (
                                <>
                                  <span>•</span>
                                  <span>{selectedMessage.from.company}</span>
                                </>
                              )}
                            </div>
                            <span>{new Date(selectedMessage.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStar(selectedMessage.id)}
                          >
                            <Star className={`h-4 w-4 ${selectedMessage.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {selectedMessage.relatedJob && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Briefcase className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Related Job:</span>
                            <span className="text-sm">{selectedMessage.relatedJob.title}</span>
                            <span className="text-sm text-muted-foreground">at {selectedMessage.relatedJob.company}</span>
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                      </div>
                      
                      {selectedMessage.actions && selectedMessage.actions.length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {selectedMessage.actions.map((action) => (
                            <Button
                              key={action.id}
                              variant={action.type === 'primary' ? 'default' : action.type === 'danger' ? 'destructive' : 'outline'}
                              size="sm"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardContent className="border-t">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowReplyDialog(true)}
                        >
                          <Reply className="h-4 w-4 mr-2" />
                          Reply
                        </Button>
                        <Button variant="outline" size="sm">
                          <Forward className="h-4 w-4 mr-2" />
                          Forward
                        </Button>
                        <Button variant="outline" size="sm">
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Select a message</h3>
                      <p className="text-muted-foreground">
                        Choose a message from the list to view its details.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>Stay updated on your job search progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${!notification.isRead ? 'border-primary bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <h4 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.timestamp).toLocaleString()}
                              </span>
                              {notification.actionUrl && (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={notification.actionUrl}>
                                    {notification.actionLabel}
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reply Dialog */}
        <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to Message</DialogTitle>
              <DialogDescription>
                Send a reply to {selectedMessage?.from.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={6}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={sendReply} disabled={!replyText.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}