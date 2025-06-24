
'use client';

import { useState } from 'react';
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
  Calendar
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

// Mock company data
const mockCompanies = [
  {
    id: '1',
    name: 'TechCorp Inc.',
    industry: 'Technology',
    size: '200-500',
    location: 'San Francisco, CA',
    status: 'active',
    plan: 'enterprise',
    joinDate: '2024-01-15',
    employees: 247,
    activeJobs: 12,
    monthlySpend: 15000,
    totalHires: 45,
    contactEmail: 'admin@techcorp.com',
    contactPerson: 'Jennifer Walsh'
  },
  {
    id: '2',
    name: 'CloudScale Solutions',
    industry: 'Cloud Services',
    size: '100-200',
    location: 'Austin, TX',
    status: 'active',
    plan: 'professional',
    joinDate: '2024-02-10',
    employees: 156,
    activeJobs: 8,
    monthlySpend: 8500,
    totalHires: 23,
    contactEmail: 'hr@cloudscale.com',
    contactPerson: 'Mark Thompson'
  },
  {
    id: '3',
    name: 'DesignFirst Studio',
    industry: 'Design',
    size: '50-100',
    location: 'Remote',
    status: 'active',
    plan: 'starter',
    joinDate: '2024-03-05',
    employees: 78,
    activeJobs: 5,
    monthlySpend: 2500,
    totalHires: 12,
    contactEmail: 'info@designfirst.com',
    contactPerson: 'Sarah Chen'
  },
  {
    id: '4',
    name: 'DataDriven Analytics',
    industry: 'Data & Analytics',
    size: '100-200',
    location: 'Seattle, WA',
    status: 'suspended',
    plan: 'professional',
    joinDate: '2024-01-20',
    employees: 134,
    activeJobs: 0,
    monthlySpend: 0,
    totalHires: 18,
    contactEmail: 'contact@datadriven.com',
    contactPerson: 'Alex Rodriguez'
  },
  {
    id: '5',
    name: 'NextGen Robotics',
    industry: 'Robotics',
    size: '500+',
    location: 'Boston, MA',
    status: 'active',
    plan: 'enterprise',
    joinDate: '2024-02-28',
    employees: 623,
    activeJobs: 25,
    monthlySpend: 28000,
    totalHires: 67,
    contactEmail: 'talent@nextgenrobotics.com',
    contactPerson: 'Dr. Emily Foster'
  }
];

const companyStats = {
  total: 142,
  active: 127,
  suspended: 8,
  pending: 7,
  enterprise: 23,
  professional: 67,
  starter: 52,
  totalRevenue: 324500,
  avgSpend: 2287
};

export default function AdminCompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

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

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return <Badge variant="default" className="bg-purple-100 text-purple-800"><Star className="mr-1 h-3 w-3" />Enterprise</Badge>;
      case 'professional':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Professional</Badge>;
      case 'starter':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Starter</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  const filteredCompanies = mockCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || company.industry === industryFilter;
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    const matchesPlan = planFilter === 'all' || company.plan === planFilter;
    
    return matchesSearch && matchesIndustry && matchesStatus && matchesPlan;
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
              <div className="text-2xl font-bold">{companyStats.total}</div>
              <p className="text-xs text-muted-foreground">+3 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyStats.active}</div>
              <p className="text-xs text-muted-foreground">89% of total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${companyStats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Monthly Spend</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${companyStats.avgSpend}</div>
              <p className="text-xs text-muted-foreground">Per company</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all-companies" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="all-companies">All Companies</TabsTrigger>
              <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </div>
          </div>

          <TabsContent value="all-companies" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters & Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search companies by name or industry..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Cloud Services">Cloud Services</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Data & Analytics">Data & Analytics</SelectItem>
                      <SelectItem value="Robotics">Robotics</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                    </SelectContent>
                  </Select>
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
              </CardContent>
            </Card>

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
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Active Jobs</TableHead>
                      <TableHead>Monthly Spend</TableHead>
                      <TableHead>Total Hires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <MapPin className="mr-1 h-3 w-3" />
                              {company.location} • {company.industry}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {company.contactPerson} • {company.contactEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getPlanBadge(company.plan)}</TableCell>
                        <TableCell>{getStatusBadge(company.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="mr-1 h-3 w-3 text-muted-foreground" />
                            {company.employees}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Briefcase className="mr-1 h-3 w-3 text-muted-foreground" />
                            {company.activeJobs}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="mr-1 h-3 w-3 text-muted-foreground" />
                            ${company.monthlySpend.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>{company.totalHires}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Company
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Billing Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {company.status === 'active' ? (
                                <DropdownMenuItem className="text-orange-600">
                                  <Ban className="mr-2 h-4 w-4" />
                                  Suspend Account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-green-600">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate Account
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Company
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enterprise">
            <Card>
              <CardHeader>
                <CardTitle>Enterprise Customers</CardTitle>
                <CardDescription>Special management for enterprise-tier clients</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Enterprise customer management tools coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing Overview</CardTitle>
                <CardDescription>Company billing and subscription management</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Billing management tools coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Company Analytics</CardTitle>
                <CardDescription>Performance metrics and usage analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Company analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Container>
    </AdminLayout>
  );
}
