
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Rocket,
  Heart,
  Coffee,
  Laptop,
  Globe,
  Zap,
  Target,
  Award,
  Search,
  Filter,
  ArrowRight,
  Building,
  CalendarDays,
  Loader2
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salaryRange?: string;
  description: string;
  requirements: string[];
  createdAt: string;
}

export default function CareersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/jobs?status=active');
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        const data = await response.json();
        setJobs(data.data.jobs || []);
      } catch (error) {
        console.error("Could not fetch jobs:", error);
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health, dental, and vision insurance plus wellness programs"
    },
    {
      icon: Laptop,
      title: "Remote First",
      description: "Work from anywhere with flexible hours and home office setup allowance"
    },
    {
      icon: Rocket,
      title: "Growth & Learning",
      description: "Professional development budget, conferences, and internal training programs"
    },
    {
      icon: Coffee,
      title: "Work-Life Balance",
      description: "Unlimited PTO, mental health days, and company-wide recharge weeks"
    },
    {
      icon: DollarSign,
      title: "Competitive Compensation",
      description: "Market-leading salaries, equity packages, and performance bonuses"
    },
    {
      icon: Users,
      title: "Amazing Team",
      description: "Collaborative culture with brilliant, passionate, and supportive colleagues"
    }
  ];
  
  const values = [
    {
      icon: Target,
      title: "Customer Obsession",
      description: "We put our customers at the center of everything we do"
    },
    {
      icon: Zap,
      title: "Move Fast",
      description: "We ship quickly, iterate often, and learn from our mistakes"
    },
    {
      icon: Users,
      title: "Team First",
      description: "We win together, support each other, and celebrate successes"
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We set high standards and continuously raise the bar"
    }
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === 'all' || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter;
    
    return matchesSearch && matchesLocation && matchesDepartment;
  });

  const handleViewDetails = (jobId: string) => {
    // Navigate to job details page
    router.push(`/jobs/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50">
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200">
                <Briefcase className="h-3 w-3 mr-1" />
                Join Our Team
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Build the Future of
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent block">
                  AI Recruitment
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join a passionate team of innovators who are transforming how companies find and hire exceptional talent. 
                We're looking for brilliant minds to help us democratize access to opportunity worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  View Open Positions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  Learn About Our Culture
                </Button>
              </div>
            </div>
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop&crop=center"
                alt="Team collaboration"
                width={600}
                height={400}
                className="rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Why Join Us */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Join Persona Recruit AI?</h2>
            <p className="text-lg text-gray-600">We offer more than just a job - we offer a mission, growth, and amazing benefits</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Our Values */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600">The principles that guide our decisions and shape our culture</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Open Positions */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-lg text-gray-600">Find your next opportunity and help us revolutionize recruitment</p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search positions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="san francisco">San Francisco</SelectItem>
                    <SelectItem value="new york">New York</SelectItem>
                    <SelectItem value="austin">Austin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Customer Success">Customer Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Job Listings */}
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 mr-3">{job.title}</h3>
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              {job.department}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center text-sm text-gray-500 mb-3 gap-4">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {job.location}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {job.type}
                            </div>
                            {job.salaryRange && (
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {job.salaryRange}
                              </div>
                            )}
                            <div className="flex items-center">
                              <CalendarDays className="h-4 w-4 mr-1" />
                              {(() => {
                                try {
                                  const date = new Date(job.createdAt);
                                  return isNaN(date.getTime()) 
                                    ? 'Recently posted'
                                    : formatDistanceToNow(date, { addSuffix: true });
                                } catch {
                                  return 'Recently posted';
                                }
                              })()}
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3">{job.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {job.requirements.map((req, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 lg:mt-0 lg:ml-6">
                          <Button 
                            onClick={() => handleViewDetails(job.id)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No positions found</h3>
                    <p className="text-gray-600">Try adjusting your search criteria or check back later for new opportunities.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section>
          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-6 text-green-100" />
              <h2 className="text-3xl font-bold mb-4">Don't See the Right Role?</h2>
              <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                We're always looking for exceptional talent. Send us your resume and tell us about your dream role - 
                we'd love to hear from you!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                  Send General Application
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Link href="/support">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    Contact Recruiting Team
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
