
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, MapPin, Search, PlusCircle } from 'lucide-react';
import { Container } from '@/components/shared/Container';
import { Badge } from '@/components/ui/badge';
import { getMockJobs } from '@/services/mockDataService';

// Get mock jobs data
const jobListings = getMockJobs().map(job => ({
  id: job.id,
  title: job.title,
  company: job.companyName,
  location: job.location,
  type: job.jobType,
  postedDate: job.postedDate,
  description: job.description,
  skills: job.requirements.slice(0, 4),
  salary: job.salaryRange,
  applicants: job.applicationCount
}));

export default function JobsPage() {
  return (
    <Container>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-headline font-semibold text-foreground">
          Find Your Next Opportunity
        </h1>
        <Link href="/jobs/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            Post a New Job
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">
                Search by keyword
              </label>
              <div className="relative">
                <Input id="search" placeholder="Job title, company, or skill" className="pl-10" />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-muted-foreground mb-1">
                Location
              </label>
              <Input id="location" placeholder="City, state, or remote" />
            </div>
            <div>
              <label htmlFor="jobType" className="block text-sm font-medium text-muted-foreground mb-1">
                Job Type
              </label>
              <Select>
                <SelectTrigger id="jobType">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full md:w-auto mt-4 md:mt-0 lg:mt-0 md:col-start-3 lg:col-start-auto">
              <Search className="mr-2 h-4 w-4" /> Find Jobs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobListings.map((job) => (
          <Card key={job.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-headline hover:text-primary transition-colors">
                  <Link href={`/jobs/${job.id}`}>{job.title}</Link>
                </CardTitle>
                <Badge variant={job.type === 'Full-time' ? 'default' : 'secondary'}>{job.type}</Badge>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                {job.company}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                {job.location}
              </div>
              <p className="text-sm text-foreground/80 mb-3 line-clamp-3">
                {job.description}
              </p>
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Skills:</h4>
                <div className="flex flex-wrap gap-1">
                  {job.skills.slice(0, 3).map(skill => (
                    <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                  ))}
                  {job.skills.length > 3 && <Badge variant="outline" className="text-xs">+{job.skills.length - 3} more</Badge>}
                </div>
              </div>
               <p className="text-sm font-medium text-primary">{job.salary}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Posted: {new Date(job.postedDate).toLocaleDateString()}
              </p>
              <Link href={`/jobs/${job.id}`} passHref>
                <Button variant="link" className="text-primary p-0 h-auto">
                  View Details &rarr;
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
       {/* Pagination (Placeholder) */}
      <div className="mt-12 flex justify-center">
        <Button variant="outline" className="mr-2">Previous</Button>
        <Button variant="outline">Next</Button>
      </div>
    </Container>
  );
}
