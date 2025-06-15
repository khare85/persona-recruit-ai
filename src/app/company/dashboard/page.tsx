"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Building, Users, Briefcase, TrendingUp, DollarSign, Calendar, Search, Settings, PlusCircle, ExternalLink, Activity, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getMockDashboardMetrics } from '@/services/mockDataService';

const mockCompanyData = {
  companyName: "TechCorp Inc.",
  ...getMockDashboardMetrics().company,
  departments: [
    { name: "Engineering", openPositions: 12, budget: 45000 },
    { name: "Marketing", openPositions: 3, budget: 15000 },
    { name: "Sales", openPositions: 3, budget: 18000 },
    { name: "Product", openPositions: 2, budget: 12000 }
  ]
};

export default function CompanyDashboardPage() {
  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
            <Building className="mr-3 h-8 w-8 text-primary" />
            {mockCompanyData.companyName} Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your company's recruitment strategy and track hiring performance across all departments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockCompanyData.totalEmployees}</div>
              <span className="text-xs text-muted-foreground">+12 this quarter</span>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockCompanyData.activeJobs}</div>
              <Link href="/jobs" className="text-xs text-primary hover:underline">View all positions</Link>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Candidates in Pipeline</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockCompanyData.candidatesInPipeline}</div>
              <Link href="/candidates" className="text-xs text-primary hover:underline">Review candidates</Link>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${mockCompanyData.monthlyBudget.toLocaleString()}</div>
              <span className="text-xs text-muted-foreground">Recruitment spend</span>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-6 w-6 text-primary" /> Department Overview
                </CardTitle>
                <CardDescription>Track hiring activity across all departments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockCompanyData.departments.map((dept, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <h4 className="font-semibold">{dept.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {dept.openPositions} open positions
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${dept.budget.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Monthly budget</div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Link href="/company/settings">
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" /> Manage Departments
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-6 w-6 text-primary" /> AI-Powered Tools
                </CardTitle>
                <CardDescription>Leverage AI to streamline your hiring process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link href="/company/ai-talent-search">
                    <Button variant="outline" className="w-full justify-start h-auto p-4">
                      <Search className="mr-2 h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">AI Talent Search</div>
                        <div className="text-xs text-muted-foreground">Find perfect candidates</div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/company/advanced-match">
                    <Button variant="outline" className="w-full justify-start h-auto p-4">
                      <Users className="mr-2 h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold">Advanced Matching</div>
                        <div className="text-xs text-muted-foreground">Smart candidate recommendations</div>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/jobs/new">
                  <Button variant="ghost" className="w-full justify-start">
                    <PlusCircle className="mr-2 h-4 w-4 text-primary" />Post New Job
                  </Button>
                </Link>
                <Link href="/company/ai-talent-search">
                  <Button variant="ghost" className="w-full justify-start">
                    <Search className="mr-2 h-4 w-4 text-primary" />AI Talent Search
                  </Button>
                </Link>
                <Link href="/company/portal">
                  <Button variant="ghost" className="w-full justify-start">
                    <ExternalLink className="mr-2 h-4 w-4 text-primary" />Company Job Board
                  </Button>
                </Link>
                <Link href="/jobs/1/applicants">
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4 text-primary" />Review Applicants
                  </Button>
                </Link>
                <Link href="/company/settings">
                  <Button variant="outline" className="w-full mt-2">
                    <Settings className="mr-2 h-4 w-4" />Company Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  Hiring Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg. Time to Hire</span>
                    <span className="text-sm font-semibold">{mockCompanyData.avgTimeToHire} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Offer Acceptance</span>
                    <span className="text-sm font-semibold">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Quality Score</span>
                    <span className="text-sm font-semibold">94/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </DashboardLayout>
  );
}