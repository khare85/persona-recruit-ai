
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/config/firebase';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Ban, 
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Download,
  Upload,
  Star,
  MapPin,
  CalendarDays,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  status: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  activeJobs: number;
}

interface CompanyStats {
  total: number;
  active: number;
  suspended: number;
  pending: number;
}

export default function AdminCompaniesPage() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    domain: '',
    website: '',
    size: '1-10' as Company['size'],
    industry: '',
    location: '',
    description: '',
    founded: new Date().getFullYear()
  });


  useEffect(() => {
    if (!loading && (!user || user.role !== 'super_admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch('/api/admin/companies', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }

      const data = await response.json();
      setCompanies(data.data.companies);
      setCompanyStats({
        total: data.data.pagination.total,
        active: data.data.companies.filter((c: Company) => c.status === 'active').length,
        suspended: data.data.companies.filter((c: Company) => c.status === 'suspended').length,
        pending: data.data.companies.filter((c: Company) => c.status === 'pending').length,
      });
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchCompanies();
    }
  }, [user]);

  const handleAddCompany = () => {
    setShowAddModal(true);
  };

  const handleCreateCompany = async () => {
    try {
      setIsAddingCompany(true);
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCompany),
      });

      if (!response.ok) {
        throw new Error((await response.json()).error || 'Failed to create company');
      }
      
      setShowAddModal(false);
      fetchCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
    } finally {
      setIsAddingCompany(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><Ban className="mr-1 h-3 w-3" />Suspended</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Building className="mr-3 h-8 w-8 text-primary" />
            Company Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage company accounts, subscriptions, and monitor business metrics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyStats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyStats?.active || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <Ban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyStats?.suspended || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyStats?.pending || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleAddCompany}>
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Companies ({filteredCompanies.length})</CardTitle>
            <CardDescription>Manage company accounts and subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Active Jobs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                        </TableCell>
                    </TableRow>
                ) : (
                    filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {company.location} • {company.industry}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(company.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="mr-1 h-3 w-3 text-muted-foreground" />
                            {company.userCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Briefcase className="mr-1 h-3 w-3 text-muted-foreground" />
                            {company.activeJobs}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <Link href={`/admin/company-management/${company.id}`} passHref>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/admin/company-management/${company.id}/edit`} passHref>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Company
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Company
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Company Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
              <DialogDescription>
                Create a new company account in the system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                    placeholder="Tech Corp Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain *</Label>
                  <Input
                    id="domain"
                    value={newCompany.domain}
                    onChange={(e) => setNewCompany({...newCompany, domain: e.target.value})}
                    placeholder="techcorp.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={newCompany.website}
                    onChange={(e) => setNewCompany({...newCompany, website: e.target.value})}
                    placeholder="https://techcorp.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Company Size *</Label>
                  <Select value={newCompany.size} onValueChange={(value) => setNewCompany({...newCompany, size: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-1000">201-1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Input
                    id="industry"
                    value={newCompany.industry}
                    onChange={(e) => setNewCompany({...newCompany, industry: e.target.value})}
                    placeholder="Technology"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={newCompany.location}
                    onChange={(e) => setNewCompany({...newCompany, location: e.target.value})}
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCompany.description}
                  onChange={(e) => setNewCompany({...newCompany, description: e.target.value})}
                  placeholder="Brief description of the company..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="founded">Founded Year</Label>
                <Input
                  id="founded"
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={newCompany.founded}
                  onChange={(e) => setNewCompany({...newCompany, founded: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
                disabled={isAddingCompany}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCompany}
                disabled={isAddingCompany || !newCompany.name || !newCompany.domain || !newCompany.industry || !newCompany.location}
              >
                {isAddingCompany ? 'Creating...' : 'Create Company'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Container>
    </AdminLayout>
  );
}
