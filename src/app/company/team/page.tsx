
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle,
  Copy,
  Send,
  Eye,
  MoreHorizontal,
  Crown,
  Shield
} from 'lucide-react';

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['recruiter', 'interviewer']),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  department: z.string().optional()
});

type InviteTeamMemberData = z.infer<typeof inviteTeamMemberSchema>;

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  status: 'Active' | 'Pending' | 'Inactive';
  lastLogin?: string;
  joinedAt: string;
}

interface Invitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  status: 'Pending' | 'Accepted' | 'Expired';
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  invitationLink?: string;
}

// Mock data
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    email: 'admin@techcorp.com',
    firstName: 'Jane',
    lastName: 'Admin',
    role: 'company_admin',
    department: 'Administration',
    status: 'Active',
    lastLogin: '2024-06-23T10:30:00Z',
    joinedAt: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    email: 'recruiter@techcorp.com',
    firstName: 'John',
    lastName: 'Smith',
    role: 'recruiter',
    department: 'HR',
    status: 'Active',
    lastLogin: '2024-06-22T16:45:00Z',
    joinedAt: '2024-02-01T09:00:00Z'
  },
  {
    id: '3',
    email: 'interviewer@techcorp.com',
    firstName: 'Mike',
    lastName: 'Wilson',
    role: 'interviewer',
    department: 'Engineering',
    status: 'Active',
    lastLogin: '2024-06-21T14:20:00Z',
    joinedAt: '2024-03-10T10:30:00Z'
  }
];

const mockInvitations: Invitation[] = [
  {
    id: 'inv_1',
    email: 'new.recruiter@example.com',
    firstName: 'Emily',
    lastName: 'Jones',
    role: 'recruiter',
    department: 'Sales',
    status: 'Pending',
    invitedAt: '2024-06-20T10:00:00Z',
    expiresAt: '2024-06-27T10:00:00Z',
    invitationLink: '/auth/accept-invitation?token=sample_token_123'
  }
];

export default function CompanyTeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      // Fetch invitations
      const invitationsResponse = await fetch('/api/company/invite');
      if (invitationsResponse.ok) {
        const invitationsResult = await invitationsResponse.json();
        setInvitations(invitationsResult.data.invitations || []);
      }

      // For now, use mock team members since we need a separate API for company team members
      // In a real app, this would fetch from /api/company/team-members
      setTeamMembers(mockTeamMembers);
    } catch (error) {
      console.error('Failed to fetch team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data. Please refresh the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm<InviteTeamMemberData>({
    resolver: zodResolver(inviteTeamMemberSchema),
    defaultValues: {
      email: '',
      role: 'recruiter',
      firstName: '',
      lastName: '',
      department: ''
    }
  });

  const handleInviteTeamMember = async (data: InviteTeamMemberData) => {
    try {
      setIsInviting(true);
      const response = await fetch('/api/company/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      const result = await response.json();
      const newInvitation: Invitation = {
        id: result.data.invitation.id,
        email: result.data.invitation.email,
        firstName: result.data.invitation.firstName,
        lastName: result.data.invitation.lastName,
        role: result.data.invitation.role,
        department: result.data.invitation.department,
        status: result.data.invitation.status,
        invitedAt: result.data.invitation.invitedAt,
        expiresAt: result.data.invitation.expiresAt,
        invitationLink: result.data.invitation.invitationLink
      };

      // Refresh the invitations data instead of manually updating state
      await fetchTeamData();
      setIsInviteDialogOpen(false);
      form.reset();

      toast({
        title: "✅ Invitation Sent",
        description: `Team member invitation sent to ${data.email}`
      });
    } catch (error) {
      toast({
        title: "Invitation Failed",
        description: error instanceof Error ? error.message : "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const copyInvitationLink = (link: string) => {
    navigator.clipboard.writeText(window.location.origin + link);
    toast({
      title: "Link Copied",
      description: "Invitation link copied to clipboard"
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'company_admin': return <Crown className="h-4 w-4" />;
      case 'recruiter': return <Users className="h-4 w-4" />;
      case 'interviewer': return <Eye className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'company_admin': return 'default';
      case 'recruiter': return 'secondary';
      case 'interviewer': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Pending': return 'secondary';
      case 'Expired': return 'destructive';
      case 'Accepted': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Team Management
        </h1>
        <p className="text-muted-foreground">
          Manage your company's team members and send invitations to new recruiters and interviewers.
        </p>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Team Members ({teamMembers.length})</TabsTrigger>
          <TabsTrigger value="invitations">Pending Invitations ({invitations.filter(inv => inv.status === 'Pending').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    Current active team members in your company
                  </CardDescription>
                </div>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Team Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to a new recruiter or interviewer to join your team.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleInviteTeamMember)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Smith" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input placeholder="john.smith@company.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="recruiter">Recruiter</SelectItem>
                                    <SelectItem value="interviewer">Interviewer</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., HR, Engineering" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isInviting}>
                            {isInviting ? (
                              <>
                                <Send className="h-4 w-4 mr-2 animate-pulse" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Invitation
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{member.firstName} {member.lastName}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1 w-fit">
                          {getRoleIcon(member.role)}
                          {member.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.department || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(member.status)}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription>
                Track and manage sent invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invitee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invitation.firstName} {invitation.lastName}</div>
                          <div className="text-sm text-muted-foreground">{invitation.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(invitation.role)} className="flex items-center gap-1 w-fit">
                          {getRoleIcon(invitation.role)}
                          {invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invitation.status)}>
                          {invitation.status === 'Pending' && <Clock className="h-3 w-3 mr-1" />}
                          {invitation.status === 'Accepted' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {invitation.status === 'Expired' && <XCircle className="h-3 w-3 mr-1" />}
                          {invitation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.invitedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {invitation.status === 'Pending' && invitation.invitationLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyInvitationLink(invitation.invitationLink!)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Link
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
