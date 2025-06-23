"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Building, 
  Plus, 
  Users, 
  UserPlus, 
  Mail, 
  Edit, 
  Trash2, 
  Settings,
  Crown,
  Shield,
  Eye,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';

const companySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  domain: z.string().min(2, "Domain must be at least 2 characters"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']),
  industry: z.string().min(2, "Industry must be at least 2 characters"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  founded: z.number().min(1800).max(new Date().getFullYear()).optional()
});

const inviteUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(['company_admin', 'recruiter', 'interviewer']),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  department: z.string().optional()
});

type CompanyFormData = z.infer<typeof companySchema>;
type InviteUserData = z.infer<typeof inviteUserSchema>;

interface Company {
  id: string;
  name: string;
  domain: string;
  website?: string;
  size: string;
  industry: string;
  location: string;
  description?: string;
  founded?: number;
  status: 'Active' | 'Inactive' | 'Pending';
  createdAt: string;
  userCount: number;
  activeJobs: number;
}

interface CompanyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  status: 'Active' | 'Pending' | 'Inactive';
  lastLogin?: string;
  invitedAt: string;
}

// Mock data
const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechCorp Inc.',
    domain: 'techcorp.com',
    website: 'https://techcorp.com',
    size: '201-1000',
    industry: 'Technology',
    location: 'San Francisco, CA',
    description: 'Leading technology company specializing in AI and machine learning solutions.',
    founded: 2015,
    status: 'Active',
    createdAt: '2024-01-15T10:00:00Z',
    userCount: 25,
    activeJobs: 8
  },
  {
    id: '2',
    name: 'InnovateLabs',
    domain: 'innovatelabs.io',
    website: 'https://innovatelabs.io',
    size: '51-200',
    industry: 'Software Development',
    location: 'Austin, TX',
    status: 'Active',
    createdAt: '2024-02-20T14:30:00Z',
    userCount: 12,
    activeJobs: 5
  }
];

const mockCompanyUsers: CompanyUser[] = [
  {
    id: '1',
    email: 'admin@techcorp.com',
    firstName: 'John',
    lastName: 'Smith',
    role: 'company_admin',
    department: 'Administration',
    status: 'Active',
    lastLogin: '2024-06-22T09:15:00Z',
    invitedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    email: 'recruiter@techcorp.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'recruiter',
    department: 'HR',
    status: 'Active',
    lastLogin: '2024-06-21T16:45:00Z',
    invitedAt: '2024-02-01T08:00:00Z'
  }
];

export default function CompanyManagementPage() {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>(mockCompanyUsers);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      domain: '',
      website: '',
      size: '1-10',
      industry: '',
      location: '',
      description: '',
      founded: undefined
    }
  });

  const inviteForm = useForm<InviteUserData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      role: 'recruiter',
      firstName: '',
      lastName: '',
      department: ''
    }
  });

  const handleCreateCompany = async (data: CompanyFormData) => {
    try {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create company');
      }

      const result = await response.json();
      const newCompany: Company = result.data.company;

      setCompanies([...companies, newCompany]);
      setIsCreateDialogOpen(false);
      companyForm.reset();

      toast({
        title: "✅ Company Created",
        description: `${data.name} has been created successfully.`
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create company. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInviteUser = async (data: InviteUserData) => {
    if (!selectedCompany) return;

    try {
      const response = await fetch(`/api/admin/companies/${selectedCompany.id}/invite`, {
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
      const newUser: CompanyUser = {
        id: result.data.invitation.id,
        email: result.data.invitation.email,
        firstName: result.data.invitation.firstName,
        lastName: result.data.invitation.lastName,
        role: result.data.invitation.role,
        department: result.data.invitation.department,
        status: result.data.invitation.status,
        invitedAt: result.data.invitation.invitedAt
      };

      setCompanyUsers([...companyUsers, newUser]);
      setIsInviteDialogOpen(false);
      inviteForm.reset();

      toast({
        title: "✅ Invitation Sent",
        description: `Invitation sent to ${data.email} as ${data.role.replace('_', ' ')}.`
      });
    } catch (error) {
      toast({
        title: "Invitation Failed",
        description: error instanceof Error ? error.message : "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    companyForm.reset(company);
    setIsEditingCompany(true);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/admin/companies/${companyId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete company');
        }

        setCompanies(companies.filter(c => c.id !== companyId));
        toast({
          title: "Company Deleted",
          description: "Company has been deleted successfully."
        });
      } catch (error) {
        toast({
          title: "Deletion Failed",
          description: error instanceof Error ? error.message : "Failed to delete company. Please try again.",
          variant: "destructive"
        });
      }
    }
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

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Building className="h-8 w-8 text-primary" />
          Company Management
        </h1>
        <p className="text-muted-foreground">
          Manage companies, their users, and access permissions from the super admin panel.
        </p>
      </div>

      {/* Companies Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Companies ({companies.length})
              </CardTitle>
              <CardDescription>
                Create and manage companies on the platform
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setIsEditingCompany(false);
                  companyForm.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Company
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {isEditingCompany ? 'Edit Company' : 'Create New Company'}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditingCompany ? 'Update company information' : 'Add a new company to the platform'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(handleCreateCompany)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={companyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., TechCorp Inc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="domain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Domain</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., techcorp.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={companyForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://techcorp.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Size</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select company size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1-10">1-10 employees</SelectItem>
                                <SelectItem value="11-50">11-50 employees</SelectItem>
                                <SelectItem value="51-200">51-200 employees</SelectItem>
                                <SelectItem value="201-1000">201-1000 employees</SelectItem>
                                <SelectItem value="1000+">1000+ employees</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={companyForm.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Technology" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., San Francisco, CA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={companyForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of the company..."
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="founded"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Founded Year (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 2015"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {isEditingCompany ? 'Update Company' : 'Create Company'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{company.name}</h3>
                        <Badge variant={
                          company.status === 'Active' ? 'default' : 
                          company.status === 'Pending' ? 'secondary' : 'destructive'
                        }>
                          {company.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <strong>Domain:</strong> {company.domain}
                        </div>
                        <div>
                          <strong>Industry:</strong> {company.industry}
                        </div>
                        <div>
                          <strong>Size:</strong> {company.size} employees
                        </div>
                        <div>
                          <strong>Location:</strong> {company.location}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {company.userCount} users
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {company.activeJobs} active jobs
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCompany(company);
                          setIsInviteDialogOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Invite Users
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCompany(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCompany(company.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Company Users Section */}
      {selectedCompany && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedCompany.name} Users
            </CardTitle>
            <CardDescription>
              Manage users and their roles within {selectedCompany.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                        {getRoleIcon(user.role)}
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        user.status === 'Active' ? 'default' :
                        user.status === 'Pending' ? 'secondary' : 'destructive'
                      }>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
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
      )}

      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User to {selectedCompany?.name}</DialogTitle>
            <DialogDescription>
              Send an invitation to join {selectedCompany?.name} with the specified role.
            </DialogDescription>
          </DialogHeader>
          <Form {...inviteForm}>
            <form onSubmit={inviteForm.handleSubmit(handleInviteUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={inviteForm.control}
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
                  control={inviteForm.control}
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
                control={inviteForm.control}
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
                  control={inviteForm.control}
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
                          <SelectItem value="company_admin">Company Admin</SelectItem>
                          <SelectItem value="recruiter">Recruiter</SelectItem>
                          <SelectItem value="interviewer">Interviewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
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
                <Button type="submit">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}