
"use client"; 

import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Users, Briefcase, DollarSign, Brain, Activity, TrendingUp, FileText, Download, ShieldCheck, Layers, UsersRound, BarChartBig, LineChartIcon, Coins } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const mockUserGrowthData = [
  { month: 'Jan', users: 120, companies: 10, recruiters: 5 },
  { month: 'Feb', users: 180, companies: 15, recruiters: 8 },
  { month: 'Mar', users: 250, companies: 22, recruiters: 12 },
  { month: 'Apr', users: 310, companies: 28, recruiters: 15 },
  { month: 'May', users: 400, companies: 35, recruiters: 20 },
  { month: 'Jun', users: 480, companies: 42, recruiters: 25 },
];

const mockAiUsageData = [
  { feature: 'Job Desc Gen', tokens: 1500000 },
  { feature: 'Resume Parsing', tokens: 2200000 },
  { feature: 'Candidate Match', tokens: 3500000 },
  { feature: 'Interview Analysis', tokens: 1800000 },
  { feature: 'Talent Search', tokens: 4500000 },
];

const mockRevenueData = [
  { month: 'Jan', revenue: 5000, expenses: 1200 },
  { month: 'Feb', revenue: 7500, expenses: 1500 },
  { month: 'Mar', revenue: 11000, expenses: 1800 },
  { month: 'Apr', revenue: 15000, expenses: 2000 },
  { month: 'May', revenue: 18500, expenses: 2200 },
  { month: 'Jun', revenue: 22000, expenses: 2500 },
];

const chartConfig = {
  users: { label: "Total Users", color: "hsl(var(--chart-1))" },
  companies: { label: "Companies", color: "hsl(var(--chart-2))" },
  recruiters: { label: "Recruiters", color: "hsl(var(--chart-3))" },
  tokens: { label: "Tokens Used", color: "hsl(var(--primary))" },
  revenue: { label: "Revenue ($)", color: "hsl(var(--chart-1))" },
  expenses: { label: "Expenses ($)", color: "hsl(var(--chart-5))" },
};

export default function AdminDashboardPage() {
  return (
    <Container className="max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
          <ShieldCheck className="mr-3 h-8 w-8 text-primary" />
          Super Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Oversee platform performance, user activity, AI usage, and financial health.
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,250</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
            <Layers className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">+5 since last week</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recruiters</CardTitle>
            <UsersRound className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">+2 new this month</p>
          </CardContent>
        </Card>
         <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">185</div>
            <p className="text-xs text-muted-foreground">+20 in last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><LineChartIcon className="mr-2 h-5 w-5 text-primary" /> User Growth Trends</CardTitle>
            <CardDescription>Monthly new users, companies, and recruiters.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <LineChart data={mockUserGrowthData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="month" tickLine={false} axisLine={false} style={{fontSize: '0.75rem'}} />
                <YAxis tickLine={false} axisLine={false} style={{fontSize: '0.75rem'}} />
                <RechartsTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="companies" stroke="var(--color-companies)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="recruiters" stroke="var(--color-recruiters)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* AI Token Consumption */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Brain className="mr-2 h-5 w-5 text-primary" /> AI Token Consumption</CardTitle>
            <CardDescription>Tokens utilized by core AI features this month.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ChartContainer config={chartConfig} className="w-full h-full">
              <BarChart data={mockAiUsageData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" dataKey="tokens" tickFormatter={(value) => `${value/1000000}M`} tickLine={false} axisLine={false} style={{fontSize: '0.75rem'}}/>
                <YAxis dataKey="feature" type="category" tickLine={false} axisLine={false} style={{fontSize: '0.75rem'}} width={100}/>
                <RechartsTooltip 
                    content={<ChartTooltipContent indicator="dot" />} 
                    formatter={(value) => `${(Number(value)/1000000).toFixed(1)}M tokens`}
                />
                <Bar dataKey="tokens" fill="var(--color-tokens)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
           <CardFooter className="text-xs text-muted-foreground">
            Monitor AI costs. Detailed per-company breakdown available in advanced reports.
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Financial Overview */}
        <Card className="shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary" /> Financial Overview</CardTitle>
            <CardDescription>Monthly revenue and expenses. (Connect Stripe/Billing for real data)</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChart data={mockRevenueData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} style={{fontSize: '0.75rem'}} />
                    <YAxis tickFormatter={(value) => `$${value/1000}k`} tickLine={false} axisLine={false} style={{fontSize: '0.75rem'}} />
                    <RechartsTooltip 
                        content={<ChartTooltipContent indicator="dot" />}
                        formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Expenses']}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} name="Revenue" />
                    <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot={false} name="Expenses"/>
                </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payouts & Commissions Management */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Coins className="mr-2 h-5 w-5 text-primary" /> Payouts</CardTitle>
            <CardDescription>Manage referral bonuses and recruiter commissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                <div>
                    <p className="text-sm font-medium">Pending Referrals</p>
                    <p className="text-xs text-muted-foreground">Awaiting verification</p>
                </div>
                <Badge variant="outline" className="text-lg">15</Badge>
            </div>
             <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                <div>
                    <p className="text-sm font-medium">Recruiter Commissions</p>
                    <p className="text-xs text-muted-foreground">Due this cycle</p>
                </div>
                <Badge variant="default" className="text-lg">$5,500</Badge>
            </div>
             <Button className="w-full mt-2" variant="outline">View Payout Ledgers</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reporting & Analytics */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Reporting</CardTitle>
            <CardDescription>Generate and download detailed platform reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="link" className="p-0 h-auto text-primary"><Download className="mr-2 h-4 w-4" /> User Activity Report</Button>
            <Button variant="link" className="p-0 h-auto text-primary"><Download className="mr-2 h-4 w-4" /> Company Engagement Report</Button>
            <Button variant="link" className="p-0 h-auto text-primary"><Download className="mr-2 h-4 w-4" /> Financial Summary Report</Button>
          </CardContent>
        </Card>
        
        {/* Platform Health & Forecasting */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" /> Platform Status & Forecast</CardTitle>
            <CardDescription>System health and AI-driven growth predictions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
             <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium">All Systems Operational</span>
             </div>
             <div className="mt-2 p-3 border rounded-md bg-accent/10">
                <p className="text-sm font-semibold text-accent-foreground flex items-center"><TrendingUp className="mr-2 h-4 w-4"/> Q3 Revenue Forecast</p>
                <p className="text-2xl font-bold text-accent-foreground/90 mt-1">$75,000 - $82,000</p>
                <p className="text-xs text-muted-foreground italic">Based on current growth and AI model predictions.</p>
             </div>
          </CardContent>
        </Card>
      </div>
      
       <CardFooter className="mt-8 text-center text-xs text-muted-foreground">
        This Super Admin dashboard provides a conceptual overview. Real-time data would be sourced from backend services, databases, and integrated analytics platforms.
      </CardFooter>
    </Container>
  );
}

