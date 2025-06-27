
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, Briefcase, Star, Users, Loader2 } from 'lucide-react';
import type { MockCandidate } from '@/services/mockDataService';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<MockCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // This function will now be called by the search button
  const findCandidates = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch('/api/candidates');
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.data.candidates);
      } else {
        // Handle error case, maybe show a toast
        setCandidates([]);
      }
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

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
            <Button 
              className="w-full md:w-auto mt-4 md:mt-0 md:col-start-3"
              onClick={findCandidates}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Find Candidates
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : hasSearched ? (
        candidates.length > 0 ? (
          <div className="space-y-4">
            {(candidates || []).map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  {/* Left Part: Avatar & Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="h-12 w-12 border">
                        <AvatarImage src={candidate.profilePictureUrl} alt={candidate.fullName} data-ai-hint="profile person" />
                        <AvatarFallback>{candidate.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <Link href={`/candidates/${candidate.id}`} className="font-semibold truncate hover:text-primary block">{candidate.fullName}</Link>
                        <p className="text-sm text-muted-foreground truncate">{candidate.currentTitle}</p>
                    </div>
                  </div>

                  {/* Middle Part: Key Info */}
                  <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2" title="Experience">
                          <Briefcase className="h-4 w-4" />
                          <span>{candidate.experience} yrs</span>
                      </div>
                      <div className="flex items-center gap-2" title="AI Match Score">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="font-medium text-foreground">{candidate.aiMatchScore || 85}%</span>
                      </div>
                  </div>
                  
                  {/* Right Part: Availability & Action */}
                  <div className="flex items-center gap-4">
                      <Badge variant={candidate.availability === 'Available immediately' ? 'default' : 'outline'} className="hidden sm:inline-flex">
                        {candidate.availability === 'Available immediately' ? `Now` : `Available`}
                      </Badge>
                      <Link href={`/candidates/${candidate.id}`} passHref>
                          <Button variant="outline" size="sm">View</Button>
                      </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No Candidates Found</h3>
            <p className="text-muted-foreground">Try adjusting your search filters.</p>
          </div>
        )
      ) : (
        <div className="text-center py-20">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Find Top Talent</h3>
            <p className="text-muted-foreground">Use the search and filters above to find candidates.</p>
        </div>
      )}

      {hasSearched && candidates.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Button variant="outline" className="mr-2">Previous</Button>
          <Button variant="outline">Next</Button>
        </div>
      )}
    </Container>
  );
}

