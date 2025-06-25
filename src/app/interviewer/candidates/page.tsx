'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Video,
  FileText,
  CalendarDays,
  CheckCircle,
  Clock,
  AlertTriangle,
  Star,
  Download,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  GraduationCap,
  Award,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

// Mock candidates assigned to this interviewer
const assignedCandidates = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    avatar: '/avatars/sarah.jpg',
    position: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    experience: '5+ years',
    education: 'BS Computer Science, Stanford University',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'GraphQL'],
    aiScore: 87,
    interviewStatus: 'scheduled',
    interviewDate: '2024-06-22T10:00:00Z',
    interviewType: 'Technical',
    resumeUrl: '/documents/sarah-resume.pdf',
    portfolioUrl: 'https://sarah-portfolio.dev',
    linkedinUrl: 'https://linkedin.com/in/sarah-johnson',
    aiInterviewCompleted: true,
    aiVideoUrl: '/videos/sarah-ai-interview.mp4',
    previousInterviews: [
      { date: '2024-06-15', type: 'AI Interview', score: 87, status: 'completed' }
    ],
    notes: 'Strong technical background, excellent communication skills',
    recruiterNotes: 'Top candidate for senior role, focus on system design experience'
  },
  {
    id: '2',
    name: 'Marcus Chen',
    email: 'marcus.chen@email.com',
    phone: '+1 (555) 234-5678',
    avatar: '/avatars/marcus.jpg',
    position: 'DevOps Engineer',
    company: 'CloudScale Solutions',
    location: 'Austin, TX',
    experience: '7+ years',
    education: 'MS Computer Engineering, UT Austin',
    skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'CI/CD', 'Python'],
    aiScore: 92,
    interviewStatus: 'scheduled',
    interviewDate: '2024-06-22T14:30:00Z',
    interviewType: 'Behavioral',
    resumeUrl: '/documents/marcus-resume.pdf',
    portfolioUrl: null,
    linkedinUrl: 'https://linkedin.com/in/marcus-chen',
    aiInterviewCompleted: true,
    aiVideoUrl: '/videos/marcus-ai-interview.mp4',
    previousInterviews: [
      { date: '2024-06-16', type: 'AI Interview', score: 92, status: 'completed' }
    ],
    notes: 'Excellent DevOps knowledge, strong leadership potential',
    recruiterNotes: 'Assess team leadership and mentoring abilities'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily@designfirst.com',
    phone: '+1 (555) 345-6789',
    avatar: '/avatars/emily.jpg',
    position: 'UX Designer',
    company: 'DesignFirst Studio',
    location: 'New York, NY',
    experience: '4+ years',
    education: 'BFA Interaction Design, Parsons School of Design',
    skills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping'],
    aiScore: null,
    interviewStatus: 'pending',
    interviewDate: '2024-06-23T11:00:00Z',
    interviewType: 'Portfolio Review',
    resumeUrl: '/documents/emily-resume.pdf',
    portfolioUrl: 'https://emily-design.portfolio.com',
    linkedinUrl: 'https://linkedin.com/in/emily-rodriguez',
    aiInterviewCompleted: false,
    aiVideoUrl: null,
    previousInterviews: [],
    notes: 'Creative portfolio, strong design thinking approach',
    recruiterNotes: 'Focus on design process and problem-solving methodology'
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@email.com',
    phone: '+1 (555) 456-7890',
    avatar: '/avatars/david.jpg',
    position: 'Data Scientist',
    company: 'DataDriven Analytics',
    location: 'Seattle, WA',
    experience: '6+ years',
    education: 'PhD Data Science, University of Washington',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'R'],
    aiScore: 94,
    interviewStatus: 'scheduled',
    interviewDate: '2024-06-24T15:00:00Z',
    interviewType: 'Technical + Case Study',
    resumeUrl: '/documents/david-resume.pdf',
    portfolioUrl: 'https://david-kim-ds.github.io',
    linkedinUrl: 'https://linkedin.com/in/david-kim-ds',
    aiInterviewCompleted: true,
    aiVideoUrl: '/videos/david-ai-interview.mp4',
    previousInterviews: [
      { date: '2024-06-18', type: 'AI Interview', score: 94, status: 'completed' }
    ],
    notes: 'Outstanding ML expertise, research background',
    recruiterNotes: 'Evaluate practical application of ML skills and business acumen'
  },
  {
    id: '5',
    name: 'Jennifer Walsh',
    email: 'jennifer@nextgen.com',
    phone: '+1 (555) 567-8901',
    avatar: '/avatars/jennifer.jpg',
    position: 'Product Manager',
    company: 'NextGen Robotics',
    location: 'Boston, MA',
    experience: '8+ years',
    education: 'MBA Harvard Business School, BS Engineering MIT',
    skills: ['Product Strategy', 'Agile', 'A/B Testing', 'SQL', 'Roadmapping'],
    aiScore: 89,
    interviewStatus: 'completed',
    interviewDate: '2024-06-21T15:00:00Z',
    interviewType: 'Final Round',
    resumeUrl: '/documents/jennifer-resume.pdf',
    portfolioUrl: null,
    linkedinUrl: 'https://linkedin.com/in/jennifer-walsh-pm',
    aiInterviewCompleted: true,
    aiVideoUrl: '/videos/jennifer-ai-interview.mp4',
    previousInterviews: [
      { date: '2024-06-19', type: 'AI Interview', score: 89, status: 'completed' },
      { date: '2024-06-21', type: 'Final Round', score: null, status: 'completed' }
    ],
    notes: 'Strong product vision, excellent strategic thinking',
    recruiterNotes: 'Final assessment completed, feedback submitted'
  }
];

export default function InterviewerCandidatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800"><CalendarDays className="mr-1 h-3 w-3" />Scheduled</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredCandidates = assignedCandidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.interviewStatus === statusFilter;
    const matchesPosition = positionFilter === 'all' || candidate.position.includes(positionFilter);
    
    return matchesSearch && matchesStatus && matchesPosition;
  });

  const upcomingCandidates = filteredCandidates.filter(c => 
    ['scheduled', 'pending'].includes(c.interviewStatus)
  );

  const completedCandidates = filteredCandidates.filter(c => 
    c.interviewStatus === 'completed'
  );

  return (
    <DashboardLayout>
      <Container>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <Users className="mr-3 h-8 w-8 text-primary" />
                Assigned Candidates
              </h1>
              <p className="text-muted-foreground mt-1">
                View candidate profiles and interview materials for your scheduled interviews
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export List
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Advanced Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, position, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Engineer">Engineer</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Interviews ({upcomingCandidates.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCandidates.length})</TabsTrigger>
            <TabsTrigger value="all">All Candidates ({filteredCandidates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingCandidates.map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={candidate.avatar} />
                        <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold">{candidate.name}</h3>
                            <p className="text-muted-foreground font-medium">{candidate.position}</p>
                            <p className="text-sm text-muted-foreground">{candidate.company}</p>
                          </div>
                          
                          <div className="text-right">
                            {getStatusBadge(candidate.interviewStatus)}
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(candidate.interviewDate)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{candidate.location}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{candidate.experience}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{candidate.education}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{candidate.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{candidate.phone}</span>
                            </div>
                            {candidate.aiScore && (
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">AI Score: </span>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {candidate.aiScore}%
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Skills */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Key Skills:</h4>
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.slice(0, 6).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {candidate.skills.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.skills.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Interview Notes */}
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <h4 className="text-sm font-medium mb-1">Interview Focus:</h4>
                          <p className="text-sm text-muted-foreground">{candidate.recruiterNotes}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Link href={`/candidates/${candidate.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="mr-1 h-3 w-3" />
                          Full Profile
                        </Button>
                      </Link>
                      
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="mr-1 h-3 w-3" />
                        Resume
                      </Button>
                      
                      {candidate.aiInterviewCompleted && (
                        <Button variant="outline" size="sm" className="w-full">
                          <Video className="mr-1 h-3 w-3" />
                          AI Interview
                        </Button>
                      )}
                      
                      {candidate.portfolioUrl && (
                        <Button variant="outline" size="sm" className="w-full">
                          <Award className="mr-1 h-3 w-3" />
                          Portfolio
                        </Button>
                      )}
                      
                      <Button size="sm" className="w-full">
                        <CalendarDays className="mr-1 h-3 w-3" />
                        Interview Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {upcomingCandidates.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No upcoming interviews</h3>
                  <p className="text-muted-foreground">No candidates scheduled for interviews at this time.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedCandidates.map((candidate) => (
              <Card key={candidate.id} className="opacity-75 hover:opacity-100 transition-opacity">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={candidate.avatar} />
                        <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{candidate.name}</h4>
                        <p className="text-sm text-muted-foreground">{candidate.position}</p>
                        <p className="text-xs text-muted-foreground">
                          Interviewed: {formatDate(candidate.interviewDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(candidate.interviewStatus)}
                      {candidate.aiScore && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          AI: {candidate.aiScore}%
                        </Badge>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-3 w-3" />
                        View Feedback
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCandidates.map((candidate) => (
                <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="text-center mb-4">
                      <Avatar className="h-16 w-16 mx-auto mb-3">
                        <AvatarImage src={candidate.avatar} />
                        <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold">{candidate.name}</h3>
                      <p className="text-sm text-muted-foreground">{candidate.position}</p>
                      <p className="text-xs text-muted-foreground">{candidate.company}</p>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Interview:</span>
                        {getStatusBadge(candidate.interviewStatus)}
                      </div>
                      {candidate.aiScore && (
                        <div className="flex justify-between text-sm">
                          <span>AI Score:</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {candidate.aiScore}%
                          </Badge>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {formatDate(candidate.interviewDate)}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link href={`/candidates/${candidate.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                      </Link>
                      {candidate.aiInterviewCompleted && (
                        <Button variant="outline" size="sm">
                          <Video className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Container>
    </DashboardLayout>
  );
}