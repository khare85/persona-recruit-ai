/**
 * Modern Candidate Dashboard
 * Clean, intuitive interface for job seekers
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Briefcase, 
  Calendar, 
  MessageCircle,
  FileText,
  TrendingUp,
  Star,
  MapPin,
  Clock,
  Eye,
  Heart,
  Send,
  User,
  Target,
  Award,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  Filter,
  Bell,
  BookOpen,
  Video,
  Download
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// =================================
// INTERFACES
// =================================

interface CandidateStats {
  profileViews: number;
  jobApplications: number;
  interviewsScheduled: number;
  savedJobs: number;
  profileCompleteness: number;
}

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  salary: string;
  matchScore: number;
  skills: string[];
  postedDate: Date;
  isRemote: boolean;
  isSaved: boolean;
}

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: 'pending' | 'reviewing' | 'interview' | 'rejected' | 'accepted';
  appliedDate: Date;
  lastUpdate: Date;
  nextStep?: string;
}

interface Interview {
  id: string;
  jobTitle: string;
  company: string;
  type: 'phone' | 'video' | 'onsite';
  date: Date;
  duration: number;
  interviewer: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface CareerInsight {
  id: string;
  title: string;
  description: string;
  type: 'skill_gap' | 'market_trend' | 'salary_insight' | 'career_path';
  priority: 'high' | 'medium' | 'low';
  actionRequired: boolean;
}

// =================================
// MODERN CANDIDATE DASHBOARD
// =================================

export default function ModernCandidateDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [careerInsights, setCareerInsights] = useState<CareerInsight[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          profileViews: 47,
          jobApplications: 12,
          interviewsScheduled: 3,
          savedJobs: 8,
          profileCompleteness: 85
        });

        setJobRecommendations([
          {
            id: '1',
            title: 'Senior Frontend Developer',
            company: 'TechCorp',
            location: 'San Francisco, CA',
            type: 'full-time',
            salary: '$120k - $150k',
            matchScore: 95,
            skills: ['React', 'TypeScript', 'Node.js'],
            postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            isRemote: true,
            isSaved: false
          },
          {
            id: '2',
            title: 'Full Stack Engineer',
            company: 'StartupX',
            location: 'Remote',
            type: 'remote',
            salary: '$100k - $130k',
            matchScore: 88,
            skills: ['React', 'Python', 'PostgreSQL'],
            postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            isRemote: true,
            isSaved: true
          },
          {
            id: '3',
            title: 'React Developer',
            company: 'InnovateLabs',
            location: 'New York, NY',
            type: 'full-time',
            salary: '$90k - $110k',
            matchScore: 82,
            skills: ['React', 'JavaScript', 'CSS'],
            postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            isRemote: false,
            isSaved: false
          }
        ]);

        setRecentApplications([
          {
            id: '1',
            jobTitle: 'Senior Frontend Developer',
            company: 'TechCorp',
            status: 'interview',
            appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            lastUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            nextStep: 'Technical Interview scheduled for tomorrow'
          },
          {
            id: '2',
            jobTitle: 'React Developer',
            company: 'StartupY',
            status: 'reviewing',
            appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            lastUpdate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            id: '3',
            jobTitle: 'Full Stack Engineer',
            company: 'DevCorp',
            status: 'pending',
            appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            lastUpdate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
          }
        ]);

        setUpcomingInterviews([
          {
            id: '1',
            jobTitle: 'Senior Frontend Developer',
            company: 'TechCorp',
            type: 'video',
            date: new Date(Date.now() + 24 * 60 * 60 * 1000),
            duration: 60,
            interviewer: 'John Smith',
            status: 'scheduled'
          },
          {
            id: '2',
            jobTitle: 'React Developer',
            company: 'InnovateLabs',
            type: 'phone',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            duration: 30,
            interviewer: 'Sarah Johnson',
            status: 'scheduled'
          }
        ]);

        setCareerInsights([
          {
            id: '1',
            title: 'Improve your TypeScript skills',
            description: 'TypeScript is mentioned in 78% of jobs you\'re interested in',
            type: 'skill_gap',
            priority: 'high',
            actionRequired: true
          },
          {
            id: '2',
            title: 'Frontend Developer salaries trending up',
            description: 'Average salary increased by 12% in your area',
            type: 'market_trend',
            priority: 'medium',
            actionRequired: false
          },
          {
            id: '3',
            title: 'Consider remote opportunities',
            description: 'Remote positions offer 15% higher salaries on average',
            type: 'career_path',
            priority: 'medium',
            actionRequired: false
          }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'interview': return 'warning';
      case 'reviewing': return 'info';
      case 'rejected': return 'error';
      default: return 'neutral';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'skill_gap': return Target;
      case 'market_trend': return TrendingUp;
      case 'salary_insight': return Award;
      case 'career_path': return BookOpen;
      default: return AlertCircle;
    }
  };

  if (!user || user.role !== 'candidate') {
    return (
      <ModernDashboardLayout title=\"Access Denied\">
        <ModernEmptyState
          icon={User}
          title=\"Candidate Access Required\"
          description=\"You need to be signed in as a candidate to access this dashboard.\"
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
      title=\"Welcome back, ${user.displayName?.split(' ')[0] || 'there'}!\"
      subtitle=\"Let's find your next great opportunity\"
    >
      <ModernPageLayout
        title=\"Your Dashboard\"
        actions={
          <>
            <ModernButton variant=\"secondary\" leftIcon={Download}>
              Export Profile
            </ModernButton>
            <ModernButton leftIcon={Search}>
              Search Jobs
            </ModernButton>
          </>
        }
      >
        <div className=\"space-y-8\">
          {/* Quick Stats */}
          <div>
            <h2 className=\"text-lg font-semibold text-neutral-900 mb-4\">Your Activity</h2>
            {loading ? (
              <ModernGrid cols={5}>
                <ModernSkeletonCard />
                <ModernSkeletonCard />
                <ModernSkeletonCard />
                <ModernSkeletonCard />
                <ModernSkeletonCard />
              </ModernGrid>
            ) : (
              <ModernGrid cols={5}>
                <ModernMetricCard
                  title=\"Profile Views\"
                  value={stats?.profileViews || 0}
                  icon={Eye}
                  color=\"primary\"
                  trend={{ value: 23, isPositive: true }}
                />
                <ModernMetricCard
                  title=\"Applications\"
                  value={stats?.jobApplications || 0}
                  icon={FileText}
                  color=\"success\"
                  trend={{ value: 8, isPositive: true }}
                />
                <ModernMetricCard
                  title=\"Interviews\"
                  value={stats?.interviewsScheduled || 0}
                  icon={Calendar}
                  color=\"warning\"
                />
                <ModernMetricCard
                  title=\"Saved Jobs\"
                  value={stats?.savedJobs || 0}
                  icon={Heart}
                  color=\"neutral\"
                />
                <ModernCard className=\"p-4\">
                  <div className=\"flex items-center gap-2 mb-2\">
                    <User className=\"w-4 h-4 text-neutral-600\" />
                    <span className=\"text-sm font-medium text-neutral-600\">Profile Complete</span>
                  </div>
                  <div className=\"flex items-center gap-2\">
                    <Progress value={stats?.profileCompleteness || 0} className=\"flex-1 h-2\" />
                    <span className=\"text-sm font-bold text-neutral-900\">{stats?.profileCompleteness}%</span>
                  </div>
                  {stats && stats.profileCompleteness < 100 && (
                    <ModernButton variant=\"ghost\" size=\"sm\" className=\"mt-2 p-0 h-auto text-xs\">
                      Complete Profile
                    </ModernButton>
                  )}
                </ModernCard>
              </ModernGrid>
            )}
          </div>

          {/* Main Content */}
          <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">
            {/* Left Column - Job Recommendations */}
            <div className=\"lg:col-span-2 space-y-6\">
              {/* AI Job Recommendations */}
              <div>
                <div className=\"flex items-center justify-between mb-4\">
                  <h2 className=\"text-lg font-semibold text-neutral-900\">Recommended for You</h2>
                  <ModernButton variant=\"ghost\" size=\"sm\" rightIcon={ArrowRight}>
                    View All
                  </ModernButton>
                </div>
                <div className=\"space-y-4\">
                  {jobRecommendations.map((job) => (
                    <ModernCard key={job.id} className=\"p-4 hover:shadow-md transition-shadow cursor-pointer\">
                      <div className=\"flex items-start justify-between\">
                        <div className=\"flex-1\">
                          <div className=\"flex items-center gap-3 mb-2\">
                            <h3 className=\"font-semibold text-neutral-900\">{job.title}</h3>
                            <ModernBadge variant=\"success\" size=\"sm\">
                              {job.matchScore}% match
                            </ModernBadge>
                            {job.isRemote && (
                              <ModernBadge variant=\"info\" size=\"sm\">
                                Remote
                              </ModernBadge>
                            )}
                          </div>
                          <p className=\"text-sm text-neutral-600 mb-2\">{job.company}</p>
                          <div className=\"flex items-center gap-4 text-sm text-neutral-500 mb-3\">
                            <span className=\"flex items-center gap-1\">
                              <MapPin className=\"w-3 h-3\" />
                              {job.location}
                            </span>
                            <span className=\"flex items-center gap-1\">
                              <Briefcase className=\"w-3 h-3\" />
                              {job.type}
                            </span>
                            <span className=\"flex items-center gap-1\">
                              <Clock className=\"w-3 h-3\" />
                              {job.postedDate.toLocaleDateString()}
                            </span>
                          </div>
                          <div className=\"flex items-center gap-2 mb-3\">
                            {job.skills.map((skill) => (
                              <span key={skill} className=\"px-2 py-1 bg-neutral-100 text-xs rounded-full\">
                                {skill}
                              </span>
                            ))}
                          </div>
                          <p className=\"text-sm font-medium text-neutral-900\">{job.salary}</p>
                        </div>
                        <div className=\"flex flex-col gap-2 ml-4\">
                          <ModernButton size=\"sm\" onClick={() => router.push(`/jobs/${job.id}`)}>
                            Apply Now
                          </ModernButton>
                          <ModernButton 
                            variant=\"ghost\" 
                            size=\"sm\"
                            leftIcon={job.isSaved ? Heart : Heart}
                            className={job.isSaved ? 'text-red-500' : ''}
                          >
                            {job.isSaved ? 'Saved' : 'Save'}
                          </ModernButton>
                        </div>
                      </div>
                    </ModernCard>
                  ))}
                </div>
              </div>

              {/* Recent Applications */}
              <div>
                <div className=\"flex items-center justify-between mb-4\">
                  <h2 className=\"text-lg font-semibold text-neutral-900\">Recent Applications</h2>
                  <ModernButton variant=\"ghost\" size=\"sm\" rightIcon={ArrowRight}>
                    View All
                  </ModernButton>
                </div>
                <div className=\"space-y-3\">
                  {recentApplications.map((app) => (
                    <ModernCard key={app.id} className=\"p-4 hover:shadow-md transition-shadow cursor-pointer\">
                      <div className=\"flex items-center justify-between\">
                        <div className=\"flex-1\">
                          <div className=\"flex items-center gap-3 mb-1\">
                            <h4 className=\"font-medium text-neutral-900\">{app.jobTitle}</h4>
                            <ModernBadge variant={getApplicationStatusColor(app.status) as any}>
                              {app.status}
                            </ModernBadge>
                          </div>
                          <p className=\"text-sm text-neutral-600 mb-1\">{app.company}</p>
                          <p className=\"text-xs text-neutral-500\">
                            Applied {app.appliedDate.toLocaleDateString()} • 
                            Updated {app.lastUpdate.toLocaleDateString()}
                          </p>
                          {app.nextStep && (
                            <p className=\"text-xs text-blue-600 mt-1\">{app.nextStep}</p>
                          )}
                        </div>
                        <ModernButton variant=\"ghost\" size=\"sm\" rightIcon={ArrowRight}>
                          View
                        </ModernButton>
                      </div>
                    </ModernCard>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className=\"space-y-6\">
              {/* Upcoming Interviews */}
              <div>
                <div className=\"flex items-center gap-2 mb-4\">
                  <Video className=\"w-5 h-5 text-blue-600\" />
                  <h3 className=\"font-semibold text-neutral-900\">Upcoming Interviews</h3>
                </div>
                <div className=\"space-y-3\">
                  {upcomingInterviews.map((interview) => (
                    <ModernCard key={interview.id} className=\"p-3\">
                      <div className=\"flex items-center justify-between mb-2\">
                        <h4 className=\"font-medium text-neutral-900 text-sm\">{interview.jobTitle}</h4>
                        <ModernBadge variant=\"info\" size=\"sm\">
                          {interview.type}
                        </ModernBadge>
                      </div>
                      <p className=\"text-sm text-neutral-600 mb-1\">{interview.company}</p>
                      <div className=\"flex items-center gap-2 text-xs text-neutral-500 mb-2\">
                        <Calendar className=\"w-3 h-3\" />
                        <span>{interview.date.toLocaleDateString()}</span>
                        <Clock className=\"w-3 h-3\" />
                        <span>{interview.duration} min</span>
                      </div>
                      <p className=\"text-xs text-neutral-500\">with {interview.interviewer}</p>
                      <ModernButton size=\"sm\" className=\"w-full mt-2\">
                        Join Interview
                      </ModernButton>
                    </ModernCard>
                  ))}
                </div>
              </div>

              {/* Career Insights */}
              <div>
                <div className=\"flex items-center gap-2 mb-4\">
                  <Target className=\"w-5 h-5 text-purple-600\" />
                  <h3 className=\"font-semibold text-neutral-900\">Career Insights</h3>
                </div>
                <div className=\"space-y-3\">
                  {careerInsights.map((insight) => {
                    const Icon = getInsightIcon(insight.type);
                    return (
                      <ModernCard key={insight.id} className=\"p-3\">
                        <div className=\"flex items-start gap-3\">
                          <div className={cn(
                            \"p-1 rounded-full\",
                            insight.priority === 'high' ? 'bg-red-100' : 
                            insight.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                          )}>
                            <Icon className={cn(
                              \"w-3 h-3\",
                              insight.priority === 'high' ? 'text-red-600' : 
                              insight.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                            )} />
                          </div>
                          <div className=\"flex-1\">
                            <h4 className=\"font-medium text-neutral-900 text-sm mb-1\">{insight.title}</h4>
                            <p className=\"text-xs text-neutral-600 mb-2\">{insight.description}</p>
                            {insight.actionRequired && (
                              <ModernButton size=\"sm\" variant=\"ghost\" className=\"p-0 h-auto text-xs\">
                                Take Action
                              </ModernButton>
                            )}
                          </div>
                        </div>
                      </ModernCard>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className=\"font-semibold text-neutral-900 mb-4\">Quick Actions</h3>
                <div className=\"space-y-2\">
                  <ModernButton variant=\"secondary\" className=\"w-full justify-start\" leftIcon={User}>
                    Update Profile
                  </ModernButton>
                  <ModernButton variant=\"secondary\" className=\"w-full justify-start\" leftIcon={FileText}>
                    Upload Resume
                  </ModernButton>
                  <ModernButton variant=\"secondary\" className=\"w-full justify-start\" leftIcon={MessageCircle}>
                    Messages
                  </ModernButton>
                  <ModernButton variant=\"secondary\" className=\"w-full justify-start\" leftIcon={Bell}>
                    Notifications
                  </ModernButton>
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