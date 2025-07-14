
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Briefcase, Users, LayoutDashboard, Building, Gift, Video, ShieldCheck, Menu, Zap,
  UserCog, CalendarClock, FolderOpen, SearchCode, DollarSign, Search,
  ExternalLink, Activity, LogOut, Settings2, Server, BarChartBig, Settings, UsersRound, PlusCircle,
  Home, SearchCheck, Sparkles, Info, MessageSquare, ClipboardCheck, Star, Brain, Bookmark, TrendingUp, Bell, CalendarDays
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const defaultNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/jobs', label: 'All Jobs', icon: Briefcase },
  { href: '/candidates', label: 'All Candidates', icon: Users },
  { href: '/referrals', label: 'Referrals Program', icon: Gift },
  { href: '/interviews', label: 'AI Interview Analysis', icon: Activity },
];

const candidateNavItems = [
  { href: '/candidates/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/candidates/job-recommendations', label: 'Job Recommendations', icon: Brain },
  { href: '/candidates/saved-jobs', label: 'Saved Jobs', icon: Bookmark },
  { href: '/candidates/my-applications', label: 'My Applications', icon: Briefcase },
  { href: '/candidates/my-interviews', label: 'My Interviews', icon: CalendarClock },
  { href: '/candidates/messages', label: 'Messages', icon: Bell },
  { href: '/candidates/career-insights', label: 'Career Insights', icon: TrendingUp },
  { href: '/candidates/profile', label: 'My Profile', icon: UserCog }, 
  { href: '/candidates/my-documents', label: 'My Documents', icon: FolderOpen },
  { href: '/jobs', label: 'Search Jobs', icon: Search },
  { href: '/candidates/settings', label: 'Settings', icon: Settings },
];

const recruiterNavItems = [
  { href: '/recruiter/dashboard', label: 'Recruiter Hub', icon: LayoutDashboard },
  { href: '/recruiter/jobs', label: 'My Jobs', icon: Briefcase },
  { href: '/jobs/new', label: 'Post New Job', icon: PlusCircle },
  { href: '/recruiter/applications', label: 'Applications', icon: UsersRound },
  { href: '/recruiter/interviews', label: 'Interviews', icon: CalendarDays },
  { href: '/recruiter/analytics', label: 'My Analytics', icon: BarChartBig },
  { href: '/recruiter/schedule-interview', label: 'Schedule Interview', icon: CalendarClock },
  { href: '/candidates', label: 'Browse Candidates', icon: Users },
  { href: '/recruiter/settings', label: 'Recruiter Settings', icon: Settings },
];

const interviewerNavItems = [
  { href: '/interviewer/dashboard', label: 'Interview Hub', icon: LayoutDashboard },
  { href: '/interviewer/schedule', label: 'My Interview Schedule', icon: CalendarClock },
  { href: '/interviewer/candidates', label: 'Assigned Candidates', icon: Users },
  { href: '/interviewer/interviews', label: 'Interview History', icon: MessageSquare },
  { href: '/interviewer/feedback', label: 'Submit Feedback', icon: ClipboardCheck },
  { href: '/interviewer/performance', label: 'My Performance', icon: Star },
  { href: '/interviewer/settings', label: 'Interview Settings', icon: Settings },
];

const companyNavItems = [
  { href: '/company/dashboard', label: 'Company Hub', icon: LayoutDashboard },
  { href: '/jobs', label: 'Company Jobs', icon: Briefcase },
  { href: '/jobs/new', label: 'Post New Job', icon: PlusCircle },
  { href: '/company/applications', label: 'Application Management', icon: UsersRound },
  { href: '/company/analytics', label: 'Analytics & Reports', icon: BarChartBig },
  { href: '/company/talent-search', label: 'AI Talent Search', icon: SearchCode },
  { href: '/company/advanced-matching', label: 'Advanced Match', icon: SearchCheck }, 
  { href: '/company/team', label: 'Team Management', icon: UsersRound },
  { href: '/company/portal', label: 'Company Job Board', icon: ExternalLink },
  { href: '/company/settings', label: 'Company Settings', icon: Settings2 },
];

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Super Admin', icon: ShieldCheck },
  { href: '/admin/company-management', label: 'Company Management', icon: Building },
  { href: '/admin/jobs', label: 'Job Management', icon: Briefcase },
  { href: '/admin/analytics', label: 'Platform Analytics', icon: BarChartBig },
  { href: '/admin/users', label: 'User Management', icon: UsersRound }, 
  { href: '/admin/system', label: 'System Health', icon: Server },
  { href: '/admin/billing', label: 'Billing & Subs', icon: DollarSign },
  { href: '/admin/settings', label: 'Platform Settings', icon: Settings },
];


function determineNavigation(pathname: string) {
  let currentNavItems = defaultNavItems;
  let currentPersona = "Persona Recruit AI";
  let CurrentPersonaIcon: React.ElementType = Sparkles;
  let currentDashboardHome = "/";

  if (pathname.startsWith('/candidates/dashboard') ||
      pathname.startsWith('/candidates/my-') ||
      pathname.startsWith('/candidates/settings') ||
      pathname.startsWith('/candidates/job-recommendations') ||
      pathname.startsWith('/candidates/saved-jobs') ||
      pathname.startsWith('/candidates/messages') ||
      pathname.startsWith('/candidates/career-insights') ||
      pathname.startsWith('/candidates/profile') ||
      (pathname.startsWith('/candidates/') && pathname.endsWith('/edit')) ||
      (pathname.startsWith('/candidates/') && !pathname.endsWith('/new') && !pathname.endsWith('/edit') && pathname.split('/').length === 3 && pathname.split('/')[2] !== 'new')
     ) {
    currentNavItems = candidateNavItems;
    currentPersona = "Candidate Portal";
    CurrentPersonaIcon = UserCog;
    currentDashboardHome = "/candidates/dashboard";
  } else if (pathname.startsWith('/recruiter')) {
    currentNavItems = recruiterNavItems;
    currentPersona = "Recruiter Hub";
    CurrentPersonaIcon = LayoutDashboard; 
    currentDashboardHome = "/recruiter/dashboard";
  } else if (pathname.startsWith('/interviewer')) {
    currentNavItems = interviewerNavItems;
    currentPersona = "Interviewer Portal";
    CurrentPersonaIcon = MessageSquare;
    currentDashboardHome = "/interviewer/dashboard";
  } else if (pathname.startsWith('/company')) {
    currentNavItems = companyNavItems;
    currentPersona = "Company Hub";
    CurrentPersonaIcon = Building;
    currentDashboardHome = "/company/dashboard";
  } else if (pathname.startsWith('/admin')) {
    currentNavItems = adminNavItems;
    currentPersona = "Admin Panel";
    CurrentPersonaIcon = ShieldCheck;
    currentDashboardHome = "/admin/dashboard";
  } else if (pathname.startsWith('/live-interview')) {
    currentNavItems = []; 
    currentPersona = "Live Interview";
    CurrentPersonaIcon = Video;
    currentDashboardHome = pathname; 
  }
  return { currentNavItems, currentPersona, CurrentPersonaIcon, currentDashboardHome };
}


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentNavItems, currentPersona, CurrentPersonaIcon, currentDashboardHome } = determineNavigation(pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get user display name and role
  const displayName = user?.fullName || user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  const userRole = user?.role || 'user';
  const roleDisplayName = {
    'candidate': 'Candidate',
    'recruiter': 'Recruiter', 
    'interviewer': 'Interviewer',
    'company_admin': 'Company Admin',
    'super_admin': 'Super Admin'
  }[userRole] || 'User';
  
  // Get initials for avatar
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';

  return (
    <div className="flex h-screen bg-background">
      {currentNavItems.length > 0 && (
        <div className="w-64 bg-card border-r border-border flex-col hidden md:flex">
          <div className="p-4 border-b border-border">
            <Link href={currentDashboardHome} className={cn(
              "flex items-center gap-2.5 p-2 rounded-md transition-colors hover:bg-accent/10 w-full"
            )}>
              <CurrentPersonaIcon className="h-7 w-7 text-primary flex-shrink-0" />
              <span className="font-semibold text-lg text-foreground truncate">
                {currentPersona}
              </span>
            </Link>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {currentNavItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href || (item.href !== '/' && item.href !=='#' && item.href !== currentDashboardHome && pathname.startsWith(item.href)) 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground"
                  )}>
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        
        <header className={cn(
            "p-3 border-b border-border/30 bg-card/95 backdrop-blur-sm flex items-center sticky top-0 z-30 h-14",
            currentNavItems.length === 0 ? "pl-6" : "" 
        )}>
          
           <div className="flex items-center gap-2">
            {currentNavItems.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className={cn(
               "flex items-center gap-2",
               currentNavItems.length > 0 ? "md:hidden" : "" 
             )}>
                <CurrentPersonaIcon className="h-6 w-6 text-primary" />
                <span className="font-semibold text-md text-foreground truncate">
                    {currentPersona}
                </span>
            </div>
          </div>
          
          <div className="ml-auto flex items-center space-x-3">
              <Badge variant="outline" className="border-primary/50 text-primary text-xs hidden sm:flex items-center">
                <Info className="h-3.5 w-3.5 mr-1.5" /> Demo Environment
              </Badge>
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{roleDisplayName}</p>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&size=32`} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
              </div>
               <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleLogout}
               >
                  <LogOut className="h-5 w-5" />
               </Button>
          </div>
        </header>

        {/* Mobile Navigation Overlay */}
        {currentNavItems.length > 0 && isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border shadow-lg">
              <div className="p-4 border-b border-border">
                <Link 
                  href={currentDashboardHome} 
                  className="flex items-center gap-2.5 p-2 rounded-md transition-colors hover:bg-accent/10 w-full"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <CurrentPersonaIcon className="h-7 w-7 text-primary flex-shrink-0" />
                  <span className="font-semibold text-lg text-foreground truncate">
                    {currentPersona}
                  </span>
                </Link>
              </div>
              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  {currentNavItems.map((item) => (
                    <li key={item.href}>
                      <Link 
                        href={item.href} 
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                          pathname === item.href || (item.href !== '/' && item.href !=='#' && item.href !== currentDashboardHome && pathname.startsWith(item.href)) 
                            ? "bg-accent text-accent-foreground" 
                            : "text-muted-foreground"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

