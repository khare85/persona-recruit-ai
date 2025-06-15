
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Building, Briefcase, Settings2, Users, ExternalLink, MessageSquarePlus, SearchCode, PlusCircle, BarChartBig, UsersRound, Clock } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Line, LineChart, Tooltip as RechartsTooltip } from 'recharts';


const mockRecruiters = [
  { id: 'rec1', name: 'TechRecruit Pro', specialty: 'Software Engineering, AI/ML', successRate: 92, avatar: 'https://placehold.co/50x50.png?text=TR' },
  { id: 'rec2', name: 'SalesGurus Inc.', specialty: 'Sales, Business Development', successRate: 88, avatar: 'https://placehold.co/50x50.png?text=SG' },
  { id: 'rec3', name: 'DesignFinders', specialty: 'UX/UI Design, Creative Roles', successRate: 95, avatar: 'https://placehold.co/50x50.png?text=DF' },
];

const mockKpiData = {
    activeJobs: 12,
    totalApplicants: 235,
    avgTimeToHireDays: 28,
    aiSearchesThisMonth: 45,
};

const mockApplicantFunnelData = [
  { stage: 'Applications', count: 235, fill: "hsl(var(--chart-1))" },
  { stage: 'Screened', count: 150, fill: "hsl(var(--chart-2))" },
  { stage: 'Interviewed', count: 65, fill: "hsl(var(--chart-3))" },
  { stage: 'Offers', count: 15, fill: "hsl(var(--chart-4))" },
  { stage: 'Hired', count: 8, fill: "hsl(var(--chart-5))" },
];

const mockJobsPerformanceData = [
  { name: 'Snr. Frontend Eng.', applicants: 45, daysOpen: 20 },
  { name: 'Cloud Architect', applicants: 30, daysOpen: 15 },
  { name: 'AI/ML PM', applicants: 60, daysOpen: 35 },
  { name: 'UX Designer', applicants: 25, daysOpen: 22 },
];

const chartConfig = {
  applicants: { label: "Applicants", color: "hsl(var(--chart-1))" },
  daysOpen: { label: "Days Open", color: "hsl(var(--chart-2))" },
  count: { label: "Count", color: "hsl(var(--primary))"},
};

export default function CompanyDashboardPage() {
  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
          <Building className="mr-3 h-8 w-8 text-primary" />
          Company Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          Oversee your recruitment activities, manage talent pipeline, and leverage AI tools.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    Active Job Postings <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{mockKpiData.activeJobs}</div>
                <Link href="/jobs" className="text-xs text-primary hover:underline">View & Manage Jobs</Link>
            </CardContent>
        </Card>
         <Card className="shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    Total Applicants <UsersRound className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{mockKpiData.totalApplicants}</div>
                 <p className="text-xs text-muted-foreground">Across all active jobs</p>
            </CardContent>
        </Card>
        <Card className="shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    Avg. Time to Hire <Clock className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{mockKpiData.avgTimeToHireDays} <span className="text-sm font-normal">days</span></div>
                <p className="text-xs text-muted-foreground">Mock data - Last 90 days</p>
            </CardContent>
        </Card>
        <Card className="shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    AI Talent Searches <SearchCode className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{mockKpiData.aiSearchesThisMonth}</div>
                <p className="text-xs text-muted-foreground">This month (Premium)</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions Card */}
        <Card className="lg:col-span-1 shadow-md">
            <CardHeader>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <Link href="/jobs/new" passHref className="block">
                    <Button className="w-full justify-start" variant="default"><PlusCircle className="mr-2 h-5 w-5" /> Post a New Job</Button>
                </Link>
                <Link href="/company/ai-talent-search" passHref className="block">
                    <Button className="w-full justify-start" variant="outline"><SearchCode className="mr-2 h-5 w-5" /> AI Talent Search</Button>
                </Link>
                 <Link href="/company/portal" passHref className="block">
                    <Button className="w-full justify-start" variant="outline"><ExternalLink className="mr-2 h-5 w-5" /> View Company Job Board</Button>
                </Link>
                <Link href="/company/settings" passHref className="block">
                    <Button className="w-full justify-start" variant="outline"><Settings2 className="mr-2 h-5 w-5" /> Company Settings</Button>
                </Link>
            </CardContent>
        </Card>

        {/* Applicant Funnel Chart */}
        <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center"><BarChartBig className="mr-2 h-5 w-5 text-primary" /> Applicant Funnel</CardTitle>
                <CardDescription>Overview of candidate progression (mock data).</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pl-0">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    <BarChart data={mockApplicantFunnelData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" dataKey="count" tickLine={false} axisLine={false} style={{fontSize: '0.75rem'}} />
                        <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} width={100} style={{fontSize: '0.75rem'}}/>
                        <RechartsTooltip 
                            content={<ChartTooltipContent indicator="dot" />}
                            formatter={(value, name, props) => [`${value} candidates`, props.payload.stage]}
                        />
                        <Bar dataKey="count" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
      
      {/* Top Performing Jobs / Recruiters Section */}
      <Card className="shadow-lg mb-8">
        <CardHeader>
            <CardTitle className="text-xl">Jobs Performance Overview</CardTitle>
            <CardDescription>Applicant count and days open for key roles (mock data).</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] pr-0">
            <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChart data={mockJobsPerformanceData} margin={{ left: 0, right: 30, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={50} style={{fontSize: '0.75rem'}} />
                    <YAxis yAxisId="left" orientation="left" stroke="var(--color-applicants)" tickLine={false} axisLine={false} style={{fontSize: '0.75rem'}} />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--color-daysOpen)" tickLine={false} axisLine={false} style={{fontSize: '0.75rem'}} />
                    <RechartsTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Legend verticalAlign="top" height={36}/>
                    <Line yAxisId="left" type="monotone" dataKey="applicants" stroke="var(--color-applicants)" strokeWidth={2} name="Applicants" dot={false}/>
                    <Line yAxisId="right" type="monotone" dataKey="daysOpen" stroke="var(--color-daysOpen)" strokeWidth={2} name="Days Open" dot={false}/>
                </LineChart>
            </ChartContainer>
        </CardContent>
      </Card>


      <div className="mt-10">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-headline flex items-center">
                    <Users className="mr-3 h-7 w-7 text-accent" />
                    Connect with Top Independent Recruiters
                </CardTitle>
                <CardDescription>
                    Persona Recruit AI can suggest high-performing independent recruiters who specialize in roles you're hiring for. Invite them to help fill your vacancies and expand your reach.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {mockRecruiters.map(recruiter => (
                        <Card key={recruiter.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 gap-4">
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={recruiter.avatar} alt={recruiter.name} data-ai-hint="recruiter profile" />
                                    <AvatarFallback>{recruiter.name.substring(0,1)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold text-md">{recruiter.name}</h4>
                                    <p className="text-xs text-muted-foreground">Specialty: {recruiter.specialty}</p>
                                     <Badge variant="secondary" className="text-xs mt-1">Success: {recruiter.successRate}%</Badge>
                                </div>
                            </div>
                            <Button variant="default" size="sm" className="w-full sm:w-auto">
                                <MessageSquarePlus className="mr-2 h-4 w-4" />
                                Invite to Job
                            </Button>
                        </Card>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground italic">
                    This feature helps you tap into a wider network of specialized recruiters. AI will help identify the best matches for your specific needs. (Invite functionality is conceptual for demo).
                </p>
            </CardFooter>
        </Card>
      </div>
    </Container>
  );
}
