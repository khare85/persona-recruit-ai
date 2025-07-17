/**
 * Modern Recruiter Dashboard
 * Clean, minimal, enterprise-grade design
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Plus, 
  Filter, 
  Brain, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Calendar, 
  Clock, 
  Star,
  Eye,
  MessageCircle,
  BarChart3,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  MoreVertical,
  Download,
  RefreshCw
} from 'lucide-react';

import { 
  ModernDashboardLayout, 
  ModernPageLayout 
} from '@/components/layout/ModernLayout';
import { 
  ModernCard, 
  ModernMetricCard, 
  ModernButton, 
  ModernBadge,
  ModernGrid,
  ModernEmptyState,
  ModernSkeletonCard,
  ModernSearch
} from '@/components/ui/modern-design-system';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { SemanticSearch, SearchResult } from '@/components/search/SemanticSearch';
import { useJobStatus } from '@/hooks/useJobStatus';

// =================================
// INTERFACES
// =================================

interface DashboardStats {
  totalCandidates: number;
  activeJobs: number;
  pendingApplications: number;
  interviewsScheduled: number;
  hiredThisMonth: number;
  averageTimeToHire: number;
}

interface RecentActivity {
  id: string;
  type: 'application' | 'interview' | 'hire' | 'job_posted' | 'candidate_matched';
  title: string;
  description: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  metadata?: any;
}

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  status: 'active' | 'paused' | 'closed';
  applications: number;
  posted: Date;
  priority: 'high' | 'medium' | 'low';
}

interface TopCandidate {
  id: string;
  name: string;
  title: string;
  location: string;
  matchScore: number;
  skills: string[];
  experience: string;
  avatar?: string;
  lastActive: Date;
}

// =================================
// MODERN RECRUITER DASHBOARD
// =================================

export default function ModernRecruiterDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [topCandidates, setTopCandidates] = useState<TopCandidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('7d');

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          totalCandidates: 2847,
          activeJobs: 12,
          pendingApplications: 89,
          interviewsScheduled: 23,
          hiredThisMonth: 8,
          averageTimeToHire: 18
        });

        setRecentActivity([
          {
            id: '1',
            type: 'application',
            title: 'New Application',
            description: 'Sarah Chen applied for Senior Frontend Developer',
            timestamp: new Date(),
            status: 'pending'
          },
          {
            id: '2',
            type: 'interview',
            title: 'Interview Completed',
            description: 'John Smith - Technical Interview for Backend Role',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: 'completed'
          },
          {
            id: '3',
            type: 'hire',
            title: 'Candidate Hired',
            description: 'Maria Rodriguez joined as Product Manager',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            status: 'completed'
          }
        ]);

        setJobPostings([
          {
            id: '1',
            title: 'Senior Frontend Developer',
            department: 'Engineering',
            location: 'San Francisco, CA',
            type: 'full-time',
            status: 'active',
            applications: 45,
            posted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            priority: 'high'
          },
          {
            id: '2',
            title: 'Product Manager',
            department: 'Product',
            location: 'Remote',
            type: 'remote',
            status: 'active',
            applications: 32,
            posted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            priority: 'medium'
          },
          {
            id: '3',
            title: 'UX Designer',
            department: 'Design',
            location: 'New York, NY',
            type: 'full-time',
            status: 'paused',
            applications: 28,
            posted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            priority: 'low'
          }
        ]);

        setTopCandidates([
          {
            id: '1',
            name: 'Alex Johnson',
            title: 'Senior React Developer',
            location: 'Seattle, WA',
            matchScore: 95,
            skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
            experience: '6+ years',
            lastActive: new Date(Date.now() - 30 * 60 * 1000)
          },
          {
            id: '2',
            name: 'Emma Davis',
            title: 'Full Stack Engineer',
            location: 'Austin, TX',
            matchScore: 92,
            skills: ['Python', 'React', 'PostgreSQL', 'AWS'],
            experience: '4+ years',
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            id: '3',
            name: 'Michael Chen',
            title: 'DevOps Engineer',
            location: 'San Francisco, CA',
            matchScore: 88,
            skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform'],
            experience: '5+ years',
            lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000)
          }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Implement search logic
  };

  if (!user || user.role !== 'recruiter') {
    return (
      <ModernDashboardLayout title=\"Access Denied\">
        <ModernEmptyState
          icon={AlertCircle}
          title=\"Access Denied\"
          description=\"You need recruiter permissions to access this dashboard.\"
          action={
            <ModernButton onClick={() => router.push('/auth')}>
              Sign In
            </ModernButton>
          }
        />
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout 
      title=\"Recruiter Dashboard\"
      subtitle=\"Welcome back! Here's what's happening with your recruitment activities.\"
    >
      <ModernPageLayout
        title=\"Dashboard Overview\"
        actions={
          <>
            <ModernButton variant=\"secondary\" leftIcon={RefreshCw}>
              Refresh
            </ModernButton>
            <ModernButton leftIcon={Plus}>
              Post New Job
            </ModernButton>
          </>
        }
      >
        <div className=\"space-y-8\">
          {/* AI-Powered Search */}
          <ModernCard className=\"p-6\">
            <div className=\"flex items-center gap-3 mb-4\">
              <div className=\"p-2 bg-blue-100 rounded-lg\">
                <Brain className=\"w-5 h-5 text-blue-600\" />
              </div>
              <div>
                <h3 className=\"font-semibold text-neutral-900\">AI Talent Search</h3>
                <p className=\"text-sm text-neutral-600\">Find the perfect candidates using natural language</p>
              </div>
            </div>
            <SemanticSearch
              type=\"candidates\"
              placeholder=\"Search for candidates (e.g., 'Senior React developer in San Francisco')\"
              onSearch={handleSearch}
              onResultClick={(result) => router.push(`/candidates/${result.id}`)}
              showFilters={true}
              showSuggestions={true}
            />
          </ModernCard>

          {/* Key Metrics */}
          <div>
            <h2 className=\"text-lg font-semibold text-neutral-900 mb-4\">Key Metrics</h2>
            {loading ? (
              <ModernGrid cols={3}>
                <ModernSkeletonCard />
                <ModernSkeletonCard />
                <ModernSkeletonCard />
                <ModernSkeletonCard />
                <ModernSkeletonCard />
                <ModernSkeletonCard />
              </ModernGrid>
            ) : (
              <ModernGrid cols={3}>
                <ModernMetricCard
                  title=\"Total Candidates\"
                  value={stats?.totalCandidates.toLocaleString() || '0'}
                  icon={Users}
                  color=\"primary\"
                  trend={{ value: 12, isPositive: true }}
                />
                <ModernMetricCard
                  title=\"Active Jobs\"
                  value={stats?.activeJobs || 0}
                  icon={Briefcase}
                  color=\"success\"
                  trend={{ value: 3, isPositive: true }}
                />
                <ModernMetricCard
                  title=\"Pending Applications\"
                  value={stats?.pendingApplications || 0}
                  icon={Clock}
                  color=\"warning\"
                  trend={{ value: 8, isPositive: false }}
                />
                <ModernMetricCard
                  title=\"Interviews Scheduled\"
                  value={stats?.interviewsScheduled || 0}
                  icon={Calendar}
                  color=\"primary\"
                  trend={{ value: 15, isPositive: true }}
                />
                <ModernMetricCard
                  title=\"Hires This Month\"
                  value={stats?.hiredThisMonth || 0}
                  icon={Target}
                  color=\"success\"
                  trend={{ value: 25, isPositive: true }}
                />
                <ModernMetricCard
                  title=\"Avg. Time to Hire\"
                  value={`${stats?.averageTimeToHire || 0} days`}
                  icon={TrendingUp}
                  color=\"neutral\"
                  trend={{ value: 3, isPositive: false }}
                />
              </ModernGrid>
            )}
          </div>

          {/* Main Content Grid */}
          <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">
            {/* Active Job Postings */}
            <div className=\"lg:col-span-2\">
              <div className=\"flex items-center justify-between mb-4\">
                <h2 className=\"text-lg font-semibold text-neutral-900\">Active Job Postings</h2>
                <ModernButton variant=\"ghost\" size=\"sm\" rightIcon={ArrowRight}>
                  View All
                </ModernButton>
              </div>
              <div className=\"space-y-4\">
                {jobPostings.map((job) => (
                  <ModernCard key={job.id} className=\"p-4 hover:shadow-md transition-shadow\">
                    <div className=\"flex items-center justify-between\">
                      <div className=\"flex-1\">
                        <div className=\"flex items-center gap-3 mb-2\">
                          <h3 className=\"font-semibold text-neutral-900\">{job.title}</h3>
                          <ModernBadge
                            variant={job.priority === 'high' ? 'error' : job.priority === 'medium' ? 'warning' : 'neutral'}
                          >
                            {job.priority} priority
                          </ModernBadge>
                          <ModernBadge
                            variant={job.status === 'active' ? 'success' : job.status === 'paused' ? 'warning' : 'neutral'}
                          >
                            {job.status}
                          </ModernBadge>
                        </div>
                        <p className=\"text-sm text-neutral-600 mb-2\">{job.department} • {job.location}</p>
                        <div className=\"flex items-center gap-4 text-sm text-neutral-500\">
                          <span>{job.applications} applications</span>
                          <span>Posted {job.posted.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <ModernButton variant=\"ghost\" size=\"sm\">
                            <MoreVertical className=\"w-4 h-4\" />
                          </ModernButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}`)}>
                            <Eye className=\"w-4 h-4 mr-2\" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}/applicants`)}>
                            <Users className=\"w-4 h-4 mr-2\" />
                            View Applicants
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className=\"w-4 h-4 mr-2\" />
                            Export Data
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </ModernCard>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className=\"space-y-6\">
              {/* Top AI Matches */}
              <div>
                <div className=\"flex items-center gap-2 mb-4\">
                  <Star className=\"w-5 h-5 text-yellow-500\" />
                  <h3 className=\"font-semibold text-neutral-900\">Top AI Matches</h3>
                </div>
                <div className=\"space-y-3\">
                  {topCandidates.map((candidate) => (
                    <ModernCard key={candidate.id} className=\"p-3 hover:shadow-md transition-shadow cursor-pointer\">
                      <div className=\"flex items-center gap-3\">
                        <Avatar className=\"w-10 h-10\">
                          <AvatarImage src={candidate.avatar} />
                          <AvatarFallback>{candidate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className=\"flex-1 min-w-0\">
                          <div className=\"flex items-center gap-2 mb-1\">
                            <p className=\"font-medium text-neutral-900 truncate\">{candidate.name}</p>
                            <ModernBadge variant=\"success\" size=\"sm\">
                              {candidate.matchScore}%
                            </ModernBadge>
                          </div>
                          <p className=\"text-sm text-neutral-600 truncate\">{candidate.title}</p>
                          <p className=\"text-xs text-neutral-500\">{candidate.location}</p>
                        </div>
                      </div>
                      <div className=\"flex items-center justify-between mt-3\">
                        <div className=\"flex flex-wrap gap-1\">
                          {candidate.skills.slice(0, 2).map((skill) => (
                            <span key={skill} className=\"px-2 py-1 bg-neutral-100 text-xs rounded-full\">
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 2 && (
                            <span className=\"px-2 py-1 bg-neutral-100 text-xs rounded-full\">
                              +{candidate.skills.length - 2}
                            </span>
                          )}
                        </div>
                        <div className=\"flex gap-1\">
                          <ModernButton size=\"sm\" variant=\"ghost\">
                            <MessageCircle className=\"w-4 h-4\" />
                          </ModernButton>
                          <ModernButton size=\"sm\" variant=\"ghost\">
                            <Eye className=\"w-4 h-4\" />
                          </ModernButton>
                        </div>
                      </div>
                    </ModernCard>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className=\"font-semibold text-neutral-900 mb-4\">Recent Activity</h3>
                <div className=\"space-y-3\">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className=\"flex items-start gap-3 pb-3 border-b border-neutral-100 last:border-b-0\">
                      <div className={cn(
                        \"w-2 h-2 rounded-full mt-2 flex-shrink-0\",
                        activity.status === 'completed' ? 'bg-green-500' : 
                        activity.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                      )} />
                      <div className=\"flex-1 min-w-0\">
                        <p className=\"text-sm font-medium text-neutral-900\">{activity.title}</p>
                        <p className=\"text-xs text-neutral-600 mt-1\">{activity.description}</p>
                        <p className=\"text-xs text-neutral-500 mt-1\">{activity.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModernPageLayout>
    </ModernDashboardLayout>
  );
}

// Helper function for class names
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}