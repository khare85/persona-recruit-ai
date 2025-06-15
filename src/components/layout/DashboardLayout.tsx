
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Home, SearchCheck, Sparkles, Info,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge"; // Added for Demo User badge

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


function determineNavigation(pathname: string) {
  let currentNavItems = defaultNavItems;
  let currentPersona = "Persona Recruit AI";
  let CurrentPersonaIcon: React.ElementType = Sparkles; // Changed default icon
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
  const { currentNavItems, currentPersona, CurrentPersonaIcon, currentDashboardHome } = determineNavigation(pathname);

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
              <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/100x100.png?text=DU" alt="Demo User" data-ai-hint="user avatar"/>
                  <AvatarFallback>DU</AvatarFallback>
              </Avatar>
               <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
                  <Link href="/auth"><LogOut className="h-5 w-5" /></Link>
                </Button>
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
