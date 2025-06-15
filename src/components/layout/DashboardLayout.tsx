
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Added useRouter
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"; 
import { Button } from "@/components/ui/button";
import {
  Briefcase, Users, LayoutDashboard, Building, Gift, Video, ShieldCheck, Menu, Zap,
  UserCog, CalendarClock, FolderOpen, SearchCode, DollarSign,
  ExternalLink, Activity, LogOut, Settings2, Server, BarChartBig, Settings, UsersRound, PlusCircle,
  Home, SearchCheck, Sparkles, Info, Mail, Loader2,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { useToast } from "@/hooks/use-toast"; // Import useToast

// Navigation item definitions
const defaultNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/jobs', label: 'All Jobs', icon: Briefcase },
  { href: '/candidates', label: 'All Candidates', icon: Users },
  { href: '/referrals', label: 'Referrals Program', icon: Gift },
  { href: '/interviews', label: 'AI Interview Analysis', icon: Activity },
];

const candidateNavItems = [
  { href: '/candidates/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/candidates/1', label: 'My Profile', icon: UserCog }, 
  { href: '/candidates/my-interviews', label: 'My Interviews', icon: CalendarClock },
  { href: '/candidates/my-documents', label: 'My Documents', icon: FolderOpen },
  { href: '/referrals', label: 'My Referrals', icon: Gift },
  { href: '/jobs', label: 'Search Jobs', icon: Briefcase },
  { href: '/candidates/settings', label: 'Settings', icon: Settings },
];

const recruiterNavItems = [
  { href: '/recruiter/dashboard', label: 'Recruiter Hub', icon: LayoutDashboard },
  { href: '/jobs', label: 'Manage Jobs', icon: Briefcase },
  { href: '/jobs/new', label: 'Post New Job', icon: PlusCircle },
  { href: '/candidates', label: 'Browse Candidates', icon: Users },
  { href: '/interviews', label: 'AI Interview Analysis', icon: Activity },
];

const companyNavItems = [
  { href: '/company/dashboard', label: 'Company Hub', icon: LayoutDashboard },
  { href: '/jobs', label: 'Company Jobs', icon: Briefcase },
  { href: '/jobs/new', label: 'Post New Job', icon: PlusCircle },
  { href: '/jobs/1/applicants', label: 'Applicants (Demo Job)', icon: UsersRound },
  { href: '/company/ai-talent-search', label: 'AI Talent Search', icon: SearchCode },
  { href: '/company/advanced-match', label: 'Advanced Match', icon: SearchCheck }, 
  { href: '/company/portal', label: 'Company Job Board', icon: ExternalLink },
  { href: '/company/settings', label: 'Company Settings', icon: Settings2 },
];

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Super Admin', icon: ShieldCheck },
  { href: '/admin/dashboard#users', label: 'User Management', icon: UsersRound }, 
  { href: '/admin/dashboard#companies', label: 'Company Management', icon: Building },
  { href: '/admin/dashboard#analytics', label: 'Platform Analytics', icon: BarChartBig },
  { href: '/admin/dashboard#system', label: 'System Health', icon: Server },
  { href: '/admin/dashboard#billing', label: 'Billing & Subs', icon: DollarSign },
  { href: '/admin/dashboard#settings', label: 'Platform Settings', icon: Settings },
];


function determineNavigation(pathname: string, userRole?: string /* Placeholder for future role-based nav */) {
  // TODO: Replace pathname-based logic with userRole-based logic once roles are implemented
  let currentNavItems = defaultNavItems;
  let currentPersona = "Persona Recruit AI";
  let CurrentPersonaIcon: React.ElementType = Sparkles; 
  let currentDashboardHome = "/";

  if (pathname.startsWith('/candidates/dashboard') ||
      pathname.startsWith('/candidates/my-') ||
      pathname.startsWith('/candidates/settings') ||
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
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth(); // Use auth context
  const { toast } = useToast();
  
  // TODO: Implement proper role fetching. For now, we use pathname for persona.
  const { currentNavItems, currentPersona, CurrentPersonaIcon, currentDashboardHome } = determineNavigation(pathname, /* user?.role */);

  // Effect to handle redirection if user is not authenticated
  // This is a basic form of route protection. More robust solutions (like middleware) exist.
  React.useEffect(() => {
    if (!authLoading && !user && !pathname.startsWith('/auth')) {
      // If not loading, no user, and not on auth page, redirect to auth.
      // Exclude demo persona paths from this strict auth check for now.
      const isDemoPath = pathname.startsWith('/candidates/dashboard') || 
                         pathname.startsWith('/recruiter/dashboard') || 
                         pathname.startsWith('/company/dashboard') ||
                         pathname.startsWith('/admin/dashboard');
      
      // A simple check: if it's not explicitly a demo path and no user, redirect.
      // This logic will need refinement with actual role-based auth.
      // For now, demo persona paths are accessible without Firebase login.
      // True protected routes would check user and role.

      // If we want to strictly protect ALL dashboard routes:
      // router.push('/auth?redirect=' + pathname);
      // toast({ title: "Authentication Required", description: "Please log in to access this page.", variant: "destructive" });
    }
  }, [authLoading, user, pathname, router, toast]);


  if (authLoading && !pathname.startsWith('/auth')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  // The following handles a brief moment where user is null but auth is not loading,
  // and we're not yet redirected. This avoids rendering layout for unauth user.
  // This will be more robust with proper route protection.
  // if (!user && !authLoading && !pathname.startsWith('/auth') && !pathname.startsWith('/demo')) {
  //    return null; // Or a specific "Access Denied" component
  // }


  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarFallback = getInitials(user?.displayName || user?.email);

  return (
    <div className="flex h-screen bg-background">
      {currentNavItems.length > 0 && (
        <Sidebar> 
          <SidebarHeader className="border-b border-sidebar-border">
            <Link href={currentDashboardHome} className={cn(
              "flex items-center gap-2.5 p-1 rounded-md transition-colors hover:bg-sidebar-accent/10 w-full"
            )}>
              <CurrentPersonaIcon className="h-7 w-7 text-sidebar-primary flex-shrink-0" />
              <span className="font-semibold text-lg text-sidebar-foreground truncate">
                {currentPersona}
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {currentNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/' && item.href !=='#' && item.href !== currentDashboardHome && pathname.startsWith(item.href) )}
                  >
                    <Link href={item.href}>
                      <item.icon className="flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        
        <header className={cn(
            "p-3 border-b border-border/30 bg-card/95 backdrop-blur-sm flex items-center sticky top-0 z-30 h-14",
            currentNavItems.length === 0 ? "pl-6" : "" 
        )}>
          
           <div className={cn(
             "flex items-center gap-2",
             currentNavItems.length > 0 ? "md:hidden" : "" 
           )}>
              <CurrentPersonaIcon className="h-6 w-6 text-primary" />
              <span className="font-semibold text-md text-foreground truncate">
                  {currentPersona}
              </span>
          </div>
          
          <div className="ml-auto flex items-center space-x-3">
              <Badge variant="outline" className="border-primary/50 text-primary text-xs hidden sm:flex items-center">
                <Info className="h-3.5 w-3.5 mr-1.5" /> Demo Environment
              </Badge>
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground hidden md:inline">
                    {user.email}
                  </span>
                  <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} alt={displayName} data-ai-hint="user avatar"/>
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-foreground">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Link href="/auth" passHref>
                  <Button variant="outline" size="sm">
                    <LogIn className="mr-2 h-4 w-4"/> Login
                  </Button>
                </Link>
              )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {/* Page content will use <Container /> internally for padding */}
          {children}
        </main>
      </div>
    </div>
  );
}
