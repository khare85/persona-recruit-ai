
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, PlusCircle, Search, Briefcase, Star } from 'lucide-react';
import { Container } from '@/components/shared/Container';

// Mock data for candidate listings
const candidateListings = [
  {
    id: '1',
    name: 'Alice Wonderland',
    avatarUrl: 'https://placehold.co/100x100.png?a=1', // Added query param for unique image
    title: 'Senior Software Engineer',
    topSkills: ['React', 'Node.js', 'AWS', 'Python'],
    experience: '8 years',
    availability: 'Immediate',
    matchScore: 92, // Example match score
  },
  {
    id: '2',
    name: 'Bob The Builder',
    avatarUrl: 'https://placehold.co/100x100.png?a=2',
    title: 'Product Manager',
    topSkills: ['Agile', 'Roadmapping', 'User Research', 'JIRA'],
    experience: '5 years',
    availability: '2 weeks notice',
    matchScore: 88,
  },
  {
    id: '3',
    name: 'Charlie Chaplin',
    avatarUrl: 'https://placehold.co/100x100.png?a=3',
    title: 'UX/UI Designer',
    topSkills: ['Figma', 'User Testing', 'Prototyping', 'Mobile Design'],
    experience: '6 years',
    availability: 'Immediate',
    matchScore: 95,
  },
  {
    id: '4',
    name: 'Diana Prince',
    avatarUrl: 'https://placehold.co/100x100.png?a=4',
    title: 'DevOps Engineer',
    topSkills: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform'],
    experience: '7 years',
    availability: '1 month notice',
    matchScore: 85,
  },
];

export default function CandidatesPage() {
  return (
    <Container>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-headline font-semibold text-foreground">
          Discover Top Talent
        </h1>
        <Link href="/candidates/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Candidate
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label htmlFor="searchSkills" className="block text-sm font-medium text-muted-foreground mb-1">
                Search by skills or keywords
              </label>
              <div className="relative">
                <Input id="searchSkills" placeholder="e.g., React, Python, Project Management" className="pl-10" />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-muted-foreground mb-1">
                Min. Experience
              </label>
              <Input id="experience" type="number" placeholder="e.g., 5 years" />
            </div>
            <Button className="w-full md:w-auto mt-4 md:mt-0 md:col-start-3">
              <Search className="mr-2 h-4 w-4" /> Find Candidates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {candidateListings.map((candidate) => (
          <Card key={candidate.id} className="flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-3 border-2 border-primary/50">
                <AvatarImage src={candidate.avatarUrl} alt={candidate.name} data-ai-hint="profile person" />
                <AvatarFallback>{candidate.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl font-headline hover:text-primary transition-colors">
                <Link href={`/candidates/${candidate.id}`}>{candidate.name}</Link>
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">{candidate.title}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow text-sm">
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">Top Skills:</h4>
                <div className="flex flex-wrap gap-1">
                  {candidate.topSkills.map(skill => (
                    <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center text-muted-foreground mb-1">
                <Briefcase className="h-3.5 w-3.5 mr-1.5 text-primary/80" /> Experience: {candidate.experience}
              </div>
              <div className="flex items-center text-muted-foreground">
                 <Star className="h-3.5 w-3.5 mr-1.5 text-amber-500" /> AI Match: <span className="font-semibold ml-1 text-foreground">{candidate.matchScore}%</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch space-y-2">
               <Badge variant={candidate.availability === 'Immediate' ? 'default' : 'outline'} className="self-center py-1 text-xs">
                {candidate.availability === 'Immediate' ? `Available Now` : `Available: ${candidate.availability}`}
              </Badge>
              <Link href={`/candidates/${candidate.id}`} passHref className="w-full">
                <Button variant="outline" className="w-full">
                  View Profile
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
