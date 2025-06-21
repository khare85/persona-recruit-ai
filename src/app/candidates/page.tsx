
'use client';

import { Container } from '@/components/shared/Container';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/shared/Container';
import { getMockCandidates } from '@/services/mockDataService';
// Get mock candidates data
const candidateListings = getMockCandidates().map(candidate => ({
  id: candidate.id,
  name: candidate.fullName,
  avatarUrl: candidate.profilePictureUrl,
  title: candidate.currentTitle,
  topSkills: candidate.skills.slice(0, 4),
  experience: `${candidate.experience} years`,
  availability: candidate.availability,
  matchScore: candidate.aiMatchScore || 85,
  location: candidate.location
}));

import { Badge } from '@/components/ui/badge';
import { Users, PlusCircle, Search, Briefcase, Star, List, Grid3X3 } from 'lucide-react';
import { useState } from 'react';

export default function CandidatesPage() {
  const [isGridView, setIsGridView] = useState(true);
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

      {/* View Toggle */}
      <div className="flex justify-end mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsGridView(!isGridView)}
          className="flex items-center"
        >
          {isGridView ? (
            <>
              <List className="h-4 w-4 mr-2" /> List View
            </>
          ) : (
            <>
              <Grid3X3 className="h-4 w-4 mr-2" /> Grid View
            </>
          )}
        </Button>
      </div>

      {/* Candidate Listings */}
      <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-6"}>
        {candidateListings.map((candidate) => (
          <Card key={candidate.id} className={`flex ${isGridView ? 'flex-col' : 'flex-row items-center p-6'} hover:shadow-lg transition-shadow duration-300`}>
            <div className={`flex ${isGridView ? 'flex-col items-center text-center' : 'items-center mr-6'}`}>
              <Avatar className={`mb-3 border-2 border-primary/50 ${isGridView ? 'w-24 h-24' : 'w-16 h-16'}`}>
                <AvatarImage src={candidate.avatarUrl} alt={candidate.name} data-ai-hint="profile person" />
                <AvatarFallback>{candidate.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className={isGridView ? 'text-center' : 'flex-grow'}>
                <CardTitle className={`font-headline hover:text-primary transition-colors ${isGridView ? 'text-xl' : 'text-lg'}`}>
                  <Link href={`/candidates/${candidate.id}`}>{candidate.name}</Link>
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">{candidate.title}</CardDescription>
              </div>
            </div>
            <CardContent className={`flex-grow text-sm ${isGridView ? '' : 'flex items-center justify-between w-full'}`}>
              <div className={isGridView ? 'flex-grow' : 'flex-grow flex items-center space-x-6'}>
                {isGridView && (
                   <div className="mb-3">
                     <h4 className="text-xs font-semibold text-muted-foreground mb-1">Top Skills:</h4>
                     <div className="flex flex-wrap gap-1">
                       {candidate.topSkills.map(skill => (
                         <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                       ))}
                     </div>
                   </div>
                )}
                <div className="flex items-center text-muted-foreground mb-1">
                  <Briefcase className="h-3.5 w-3.5 mr-1.5 text-primary/80" /> Experience: {candidate.experience}
                </div>
                <div className="flex items-center text-muted-foreground">
                   <Star className="h-3.5 w-3.5 mr-1.5 text-amber-500" /> AI Match: <span className="font-semibold ml-1 text-foreground">{candidate.matchScore}%</span>
                </div>
              </div>
              <CardFooter className={`${isGridView ? 'flex-col items-stretch space-y-2' : 'flex-row items-center space-x-4 mt-0 p-0'}`}>
                 <Badge variant={candidate.availability === 'Immediate' ? 'default' : 'outline'} className={`${isGridView ? 'self-center' : ''} py-1 text-xs`}>
                  {candidate.availability === 'Immediate' ? `Available Now` : `Available: ${candidate.availability}`}
                </Badge>
                <Link href={`/candidates/${candidate.id}`} passHref className={isGridView ? "w-full" : ""}>
                  <Button variant="outline" className={isGridView ? "w-full" : ""}>
                    View Profile
                  </Button>
                </Link>
              </div>
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
