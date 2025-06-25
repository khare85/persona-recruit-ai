'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles,
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
  CalendarDays
} from 'lucide-react';

export default function CareersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

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

  const openPositions = [
    {
      id: 1,
      title: "Senior Frontend Engineer",
      department: "Engineering",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      salary: "$140,000 - $180,000",
      description: "Build beautiful, responsive user interfaces for our AI-powered recruitment platform using React, TypeScript, and modern web technologies.",
      requirements: ["5+ years React experience", "TypeScript proficiency", "UI/UX design sense"],
      posted: "2 days ago"
    },
    {
      id: 2,
      title: "AI/ML Engineer",
      department: "Engineering",
      location: "San Francisco, CA / Remote",
      type: "Full-time", 
      salary: "$160,000 - $220,000",
      description: "Develop and improve our AI matching algorithms, natural language processing systems, and machine learning models.",
      requirements: ["PhD/MS in CS/ML", "Python/TensorFlow", "NLP experience"],
      posted: "1 week ago"
    },
    {
      id: 3,
      title: "Product Manager",
      department: "Product",
      location: "New York, NY / Remote",
      type: "Full-time",
      salary: "$130,000 - $170,000", 
      description: "Drive product strategy and roadmap for our recruitment platform, working closely with engineering and design teams.",
      requirements: ["5+ years PM experience", "B2B SaaS background", "Data-driven approach"],
      posted: "3 days ago"
    },
    {
      id: 4,
      title: "UX Designer",
      department: "Design",
      location: "Los Angeles, CA / Remote",
      type: "Full-time",
      salary: "$110,000 - $140,000",
      description: "Design intuitive user experiences for recruiters and candidates, conducting user research and creating design systems.",
      requirements: ["3+ years UX design", "Figma proficiency", "User research skills"],
      posted: "5 days ago"
    },
    {
      id: 5,
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Austin, TX / Remote",
      type: "Full-time",
      salary: "$80,000 - $110,000",
      description: "Help our enterprise customers succeed with onboarding, training, and ongoing relationship management.",
      requirements: ["Customer success experience", "SaaS platform knowledge", "Excellent communication"],
      posted: "1 week ago"
    },
    {
      id: 6,
      title: "Sales Development Representative",
      department: "Sales",
      location: "Chicago, IL / Remote",
      type: "Full-time",
      salary: "$60,000 - $80,000 + Commission",
      description: "Generate qualified leads and build pipeline for our enterprise sales team through outbound prospecting.",
      requirements: ["1+ years sales experience", "CRM proficiency", "Goal-oriented mindset"],
      posted: "4 days ago"
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

  const filteredJobs = openPositions.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === 'all' || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || job.department === departmentFilter;
    
    return matchesSearch && matchesLocation && matchesDepartment;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Persona Recruit AI
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">Back to Home</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600">
                  Apply Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
                  <p className="text-gray-600 text-sm">{value.description}</p>
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
          <div className="space-y-6">
            {filteredJobs.map((job) => (
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
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {job.salary}
                        </div>
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-1" />
                          {job.posted}
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
                      <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                        Apply Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No positions found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or check back later for new opportunities.</p>
              </CardContent>
            </Card>
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