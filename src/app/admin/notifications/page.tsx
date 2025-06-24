'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Container } from '@/components/shared/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, 
  Send,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  Building,
  Calendar,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  recipients: string;
  status: string;
  createdAt: string;
  sentAt?: string;
}

interface NotificationStats {
  totalSent: number;
  delivered: number;
  pending: number;
  failed: number;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'announcement',
    recipients: 'all_users'
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // Mock data - in real implementation would fetch from database
      setNotifications([
        {
          id: '1',
          title: 'System Maintenance Notice',
          message: 'Scheduled maintenance will occur on Sunday from 2-4 AM.',
          type: 'maintenance',
          recipients: 'all_users',
          status: 'sent',
          createdAt: '2024-06-24T09:00:00Z',
          sentAt: '2024-06-24T09:05:00Z'
        },
        {
          id: '2',
          title: 'New Feature: AI Resume Analysis',
          message: 'We\'ve launched enhanced AI-powered resume analysis features.',
          type: 'feature',
          recipients: 'companies',
          status: 'sent',
          createdAt: '2024-06-23T14:30:00Z',
          sentAt: '2024-06-23T15:00:00Z'
        },
        {
          id: '3',
          title: 'Welcome Message for New Users',
          message: 'Welcome to AI Talent Stream! Get started with our platform.',
          type: 'welcome',
          recipients: 'new_users',
          status: 'draft',
          createdAt: '2024-06-22T10:15:00Z'
        }
      ]);

      setStats({
        totalSent: 2847,
        delivered: 2834,
        pending: 8,
        failed: 5
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNotification = async () => {
    try {
      // Mock creation - in real implementation would save to database
      const notification: Notification = {
        id: Date.now().toString(),
        ...newNotification,
        status: 'draft',
        createdAt: new Date().toISOString()
      };
      
      setNotifications([notification, ...notifications]);
      setNewNotification({
        title: '',
        message: '',
        type: 'announcement',
        recipients: 'all_users'
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const sendNotification = async (id: string) => {
    try {
      // Mock sending - in real implementation would trigger notification service
      setNotifications(notifications.map(notif => 
        notif.id === id 
          ? { ...notif, status: 'sent', sentAt: new Date().toISOString() }
          : notif
      ));
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent': return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'feature': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'welcome': return <Users className="h-4 w-4 text-green-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getRecipientsLabel = (recipients: string) => {
    switch (recipients) {
      case 'all_users': return 'All Users';
      case 'companies': return 'Companies';
      case 'candidates': return 'Candidates';
      case 'new_users': return 'New Users';
      default: return recipients;
    }
  };

  return (
    <AdminLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Bell className="mr-3 h-8 w-8 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Send system-wide notifications and manage user communications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSent.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">All time notifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.delivered.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting delivery</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
              <p className="text-xs text-muted-foreground">Delivery failed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="notifications">All Notifications</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Notification
            </Button>
          </div>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification History</CardTitle>
                <CardDescription>Recent system notifications and announcements</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(notification.type)}
                            <span className="font-medium">{notification.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{notification.type}</TableCell>
                        <TableCell>{getRecipientsLabel(notification.recipients)}</TableCell>
                        <TableCell>{getStatusBadge(notification.status)}</TableCell>
                        <TableCell>{new Date(notification.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {notification.status === 'draft' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => sendNotification(notification.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Notification Templates</CardTitle>
                <CardDescription>Pre-built templates for common notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Notification Templates</h3>
                  <p className="text-muted-foreground">
                    Template management would be implemented here for:
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p>• Welcome messages for new users</p>
                    <p>• System maintenance announcements</p>
                    <p>• Feature launch notifications</p>
                    <p>• Security alerts and updates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure global notification preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Notification Settings</h3>
                  <p className="text-muted-foreground">
                    Global settings would be implemented here for:
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p>• Email notification preferences</p>
                    <p>• In-app notification settings</p>
                    <p>• Rate limiting and throttling</p>
                    <p>• Delivery channels configuration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Notification Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create New Notification</CardTitle>
                <CardDescription>Send a notification to platform users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                    placeholder="Notification title"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                    placeholder="Notification message"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newNotification.type} onValueChange={(value) => setNewNotification({...newNotification, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="recipients">Recipients</Label>
                  <Select value={newNotification.recipients} onValueChange={(value) => setNewNotification({...newNotification, recipients: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="companies">Companies</SelectItem>
                      <SelectItem value="candidates">Candidates</SelectItem>
                      <SelectItem value="new_users">New Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 p-6 pt-0">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={createNotification}>
                  Create
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Container>
    </AdminLayout>
  );
}