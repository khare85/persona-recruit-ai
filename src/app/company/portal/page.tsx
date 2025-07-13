"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, MapPin, Clock, DollarSign, Building, Filter, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
// Mock data removed - implement real portal service
import { useState } from 'react';

export default function CompanyPortalPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  
  const companyJobs: any[] = []; // TODO: Implement real job fetching
  
  const filteredJobs = companyJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || job.department === selectedDepartment;
    const matchesLocation = selectedLocation === 'all' || job.location === selectedLocation;
    
    return matchesSearch && matchesDepartment && matchesLocation;
  });

  const departments = [...new Set(companyJobs.map(job => job.department))];
  const locations = [...new Set(companyJobs.map(job => job.location))];

  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
            <ExternalLink className="mr-3 h-8 w-8 text-primary" />
            Company Job Board
          </h1>
          <p className="text-muted-foreground mt-1">
            Your public-facing job board where candidates can view and apply to open positions
          </p>
        </div>

        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5 text-primary" />
              TechCorp Inc. Careers Portal
            </CardTitle>
            <CardDescription>
              Share this portal with candidates to showcase all your open positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Public Portal URL</p>
                <p className="font-mono text-sm">https://careers.techcorp.com</p>
              </div>
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview Portal
              </Button>
              <Button>
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Active Positions
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companyJobs.length}</div>
              <p className="text-xs text-muted-foreground">Across all departments</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Applications This Month
                <Filter className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                Portal Views
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3,842</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Active Job Listings ({filteredJobs.length})</CardTitle>
            <CardDescription>
              These positions are currently visible on your public job board
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No jobs match your search criteria
                </p>
              ) : (
                filteredJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link href={`/jobs/${job.id}`} className="text-lg font-semibold hover:text-primary">
                          {job.title}
                        </Link>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {job.type}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {job.salary}
                          </span>
                        </div>
                      </div>
                      <Badge variant={job.status === 'Active' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {job.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Badge variant="outline">{job.department}</Badge>
                        <Badge variant="outline">{job.experience}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/jobs/${job.id}`}>
                          <Button size="sm" variant="outline">View Details</Button>
                        </Link>
                        <Link href={`/jobs/${job.id}/applicants`}>
                          <Button size="sm">
                            View Applicants ({job.applicants || 0})
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle>Portal Customization</CardTitle>
            <CardDescription>
              Customize how your job board appears to candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Company Branding</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload your logo and customize colors to match your brand
                </p>
                <Button variant="outline">Edit Branding</Button>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Welcome Message</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Add a custom message to welcome candidates to your careers page
                </p>
                <Button variant="outline">Edit Message</Button>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Application Settings</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Configure how candidates apply and what information to collect
                </p>
                <Button variant="outline">Manage Settings</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>
    </DashboardLayout>
  );
}