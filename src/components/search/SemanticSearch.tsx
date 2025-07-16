'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Sparkles, Users, Briefcase, X, Clock, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface SearchResult {
  id: string;
  type: 'candidate' | 'job';
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  metadata: {
    location?: string;
    experience?: string;
    salary?: string;
    company?: string;
    skills?: string[];
    matchScore?: number;
    lastActive?: string;
  };
  avatar?: string;
  featured?: boolean;
}

export interface SearchFilters {
  location: string[];
  experience: string[];
  skills: string[];
  salary: {
    min: number;
    max: number;
  };
  jobType: string[];
  remotePreference: string[];
  availability: string[];
}

interface SemanticSearchProps {
  type: 'candidate' | 'job' | 'all';
  placeholder?: string;
  onSearch: (query: string, filters: SearchFilters) => Promise<SearchResult[]>;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
  showFilters?: boolean;
  showSuggestions?: boolean;
}

const defaultFilters: SearchFilters = {
  location: [],
  experience: [],
  skills: [],
  salary: { min: 0, max: 500000 },
  jobType: [],
  remotePreference: [],
  availability: []
};

const searchSuggestions = [
  'Senior React Developer',
  'Machine Learning Engineer',
  'Product Manager with AI experience',
  'Full-stack developer with Python',
  'UI/UX Designer remote',
  'Data Scientist with 5+ years',
  'DevOps Engineer AWS',
  'Mobile Developer React Native'
];

const skillOptions = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java',
  'C++', 'Go', 'Rust', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'MongoDB',
  'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API', 'Machine Learning',
  'Data Science', 'AI/ML', 'DevOps', 'CI/CD', 'Agile', 'Scrum'
];

const experienceOptions = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (2-5 years)' },
  { value: 'senior', label: 'Senior Level (5-10 years)' },
  { value: 'lead', label: 'Lead/Principal (10+ years)' },
  { value: 'executive', label: 'Executive Level' }
];

const locationOptions = [
  'Remote', 'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL',
  'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Denver, CO', 'Atlanta, GA',
  'London, UK', 'Toronto, ON', 'Berlin, Germany', 'Amsterdam, Netherlands'
];

const jobTypeOptions = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' }
];

const remoteOptions = [
  { value: 'remote', label: 'Remote Only' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
  { value: 'flexible', label: 'Flexible' }
];

export function SemanticSearch({
  type,
  placeholder = 'Search with natural language...',
  onSearch,
  onResultClick,
  className,
  showFilters = true,
  showSuggestions = true
}: SemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFiltersPopover, setShowFiltersPopover] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on query
  useEffect(() => {
    if (query.length > 0 && showSuggestions) {
      const filtered = searchSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestionsDropdown(true);
    } else {
      setShowSuggestionsDropdown(false);
    }
  }, [query, showSuggestions]);

  // Handle search
  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setShowSuggestionsDropdown(false);
    
    try {
      const searchResults = await onSearch(searchQuery, filters);
      setResults(searchResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    if (onResultClick) {
      onResultClick(result);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestionsDropdown(false);
    handleSearch(suggestion);
  };

  // Handle filter change
  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle skill toggle
  const handleSkillToggle = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return (
      filters.location.length +
      filters.experience.length +
      filters.skills.length +
      filters.jobType.length +
      filters.remotePreference.length +
      filters.availability.length
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setShowSuggestionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ResultCard = ({ result }: { result: SearchResult }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-sm"
      onClick={() => handleResultClick(result)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {result.type === 'candidate' ? (
                <Users className="w-6 h-6" />
              ) : (
                <Briefcase className="w-6 h-6" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{result.title}</h3>
                {result.featured && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
                {result.metadata.matchScore && (
                  <Badge variant="secondary" className="text-xs">
                    {result.metadata.matchScore}% match
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{result.subtitle}</p>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{result.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {result.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {result.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{result.tags.length - 3} more
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center text-xs text-gray-500 space-x-4">
                {result.metadata.location && (
                  <span>📍 {result.metadata.location}</span>
                )}
                {result.metadata.experience && (
                  <span>🎯 {result.metadata.experience}</span>
                )}
                {result.metadata.salary && (
                  <span>💰 {result.metadata.salary}</span>
                )}
                {result.metadata.lastActive && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {result.metadata.lastActive}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={placeholder}
            className="pl-10 pr-20 h-12 text-base"
          />
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {showFilters && (
              <Popover open={showFiltersPopover} onOpenChange={setShowFiltersPopover}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Filter className="w-4 h-4 mr-1" />
                    {getActiveFilterCount() > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {getActiveFilterCount()}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filters</h4>
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear all
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {/* Location */}
                        <div>
                          <Label className="text-sm font-medium">Location</Label>
                          <div className="mt-2 space-y-2">
                            {locationOptions.map(location => (
                              <div key={location} className="flex items-center space-x-2">
                                <Checkbox
                                  id={location}
                                  checked={filters.location.includes(location)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleFilterChange('location', [...filters.location, location]);
                                    } else {
                                      handleFilterChange('location', filters.location.filter(l => l !== location));
                                    }
                                  }}
                                />
                                <Label htmlFor={location} className="text-sm">{location}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Experience */}
                        <div>
                          <Label className="text-sm font-medium">Experience Level</Label>
                          <div className="mt-2 space-y-2">
                            {experienceOptions.map(exp => (
                              <div key={exp.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={exp.value}
                                  checked={filters.experience.includes(exp.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleFilterChange('experience', [...filters.experience, exp.value]);
                                    } else {
                                      handleFilterChange('experience', filters.experience.filter(e => e !== exp.value));
                                    }
                                  }}
                                />
                                <Label htmlFor={exp.value} className="text-sm">{exp.label}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Skills */}
                        <div>
                          <Label className="text-sm font-medium">Skills</Label>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {skillOptions.map(skill => (
                              <Badge
                                key={skill}
                                variant={filters.skills.includes(skill) ? "default" : "outline"}
                                className="cursor-pointer text-xs"
                                onClick={() => handleSkillToggle(skill)}
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Job Type */}
                        <div>
                          <Label className="text-sm font-medium">Job Type</Label>
                          <div className="mt-2 space-y-2">
                            {jobTypeOptions.map(type => (
                              <div key={type.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={type.value}
                                  checked={filters.jobType.includes(type.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleFilterChange('jobType', [...filters.jobType, type.value]);
                                    } else {
                                      handleFilterChange('jobType', filters.jobType.filter(t => t !== type.value));
                                    }
                                  }}
                                />
                                <Label htmlFor={type.value} className="text-sm">{type.label}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Remote Preference */}
                        <div>
                          <Label className="text-sm font-medium">Remote Preference</Label>
                          <div className="mt-2 space-y-2">
                            {remoteOptions.map(remote => (
                              <div key={remote.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={remote.value}
                                  checked={filters.remotePreference.includes(remote.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleFilterChange('remotePreference', [...filters.remotePreference, remote.value]);
                                    } else {
                                      handleFilterChange('remotePreference', filters.remotePreference.filter(r => r !== remote.value));
                                    }
                                  }}
                                />
                                <Label htmlFor={remote.value} className="text-sm">{remote.label}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            
            <Button 
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="h-8 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* AI-Powered Badge */}
        <div className="absolute -top-2 left-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-2 py-1 rounded-full">
          <Sparkles className="w-3 h-3 mr-1 inline" />
          AI-Powered
        </div>
      </div>
      
      {/* Suggestions Dropdown */}
      {showSuggestionsDropdown && suggestions.length > 0 && (
        <div className="absolute top-14 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 px-2">Suggested searches</div>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded text-sm"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <Search className="w-4 h-4 inline mr-2 text-gray-400" />
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Results */}
      {showResults && (
        <div className="absolute top-14 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">
                {results.length} results found
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResults(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {results.map(result => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
            
            {results.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{query}"</p>
                <p className="text-sm">Try adjusting your search terms or filters</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}