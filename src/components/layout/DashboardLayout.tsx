
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar, // Import useSidebar to access context
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Briefcase, Users, LayoutDashboard, Building, Gift, Video, ShieldCheck, Menu, Zap,
  UserCog, CalendarClock, FolderOpen, SearchCode, DollarSign,
  ExternalLink, Activity, LogOut, Settings2, Server, BarChartBig, Settings, UsersRound, PlusCircle,
  Home, // Added Home icon
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  { href: '/jobs/1/applicants', label: 'Applicants (Demo)', icon: UsersRound },
  { href: '/company/ai-talent-search', label: 'AI Talent Search', icon: SearchCode },
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
  let CurrentPersonaIcon: React.ElementType = Home; // Default to Home icon
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
  // Default case handled by initial values for public pages
  return { currentNavItems, currentPersona, CurrentPersonaIcon, currentDashboardHome };
}


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentNavItems, currentPersona, CurrentPersonaIcon, currentDashboardHome } = determineNavigation(pathname);
  
  // We use useSidebar here to access context values like isMobile and effectiveCollapsibleMode
  // But we need to render SidebarProvider first. So, internal components can use useSidebar.
  // For setting the Sidebar collapsible prop, we need to check isMobile and hasMounted from context.
  const SidebarInnerLayout = () => {
    const { isMobile, hasMounted, effectiveCollapsibleMode } = useSidebar();

    // Determine sidebar mode based on hasMounted and isMobile from context
    // On server and initial client render (before useEffect), default to "icon"
    // After mount, use isMobile to switch to "offcanvas" if needed.
    const sidebarCollapsibleModeToPass = !hasMounted || isMobile === undefined ? "icon" : (isMobile ? "offcanvas" : "icon");

    return (
      <div className="flex h-screen bg-background">
        {currentNavItems.length > 0 && (
          <Sidebar collapsible={sidebarCollapsibleModeToPass} side="left" className="border-r border-sidebar-border">
            <SidebarHeader className="p-3 border-b border-sidebar-border">
              <Link href={currentDashboardHome} className={cn(
                "flex items-center gap-2.5 p-1 rounded-md transition-colors hover:bg-sidebar-accent/10"
              )}>
                <CurrentPersonaIcon className="h-7 w-7 text-sidebar-primary" />
                {/* Text span styling adjusted to hide correctly when icon-collapsed on desktop */}
                <span className={cn(
                  "font-semibold text-lg text-sidebar-foreground truncate",
                  "group-data-[collapsible=icon]:group-data-[state=collapsed]/sidebar:hidden", // Hide if icon mode and collapsed
                  "group-data-[collapsible=offcanvas]/sidebar:inline" // Ensure shown in offcanvas
                )}>
                  {currentPersona}
                </span>
              </Link>
            </SidebarHeader>
            <SidebarContent className="p-2 flex-1">
              <SidebarMenu>
                {currentNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href !== '/' && item.href !=='#' && item.href !== currentDashboardHome && pathname.startsWith(item.href) )}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            {/* SidebarRail is rendered within Sidebar.tsx itself */}
          </Sidebar>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-3 border-b border-border/30 bg-card/95 backdrop-blur-sm flex items-center sticky top-0 z-30 h-14">
            {/* SidebarTrigger will be rendered by Sidebar component if mode is offcanvas and isMobile */}
            {currentNavItems.length > 0 && <SidebarTrigger className="text-foreground mr-2">
              <Menu className="h-6 w-6" />
            </SidebarTrigger>}
            
            {/* Top bar persona link - shown when sidebar is icon-collapsed or on mobile */}
             <Link href={currentDashboardHome} className={cn(
                "flex items-center gap-2 md:hidden", // Hidden on md+ for icon sidebar's header to take precedence
                {"md:flex": currentNavItems.length === 0} // Show if no sidebar items (e.g. live interview)
             )}>
                <CurrentPersonaIcon className="h-6 w-6 text-primary" />
                <span className="font-semibold text-md text-foreground truncate">
                    {currentPersona}
                </span>
            </Link>


            <div className="ml-auto flex items-center space-x-3">
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
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                 {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    // defaultOpen for SidebarProvider controls initial desktop state (expanded true/false)
    // open prop could be used for controlled state, but defaultOpen is simpler for cookie logic
    <SidebarProvider defaultOpen={true}> 
      <SidebarInnerLayout />
    </SidebarProvider>
  );
}
