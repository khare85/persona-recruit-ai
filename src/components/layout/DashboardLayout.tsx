
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Briefcase, Users, LayoutDashboard, Building, Gift, Video, ShieldCheck, Menu, Zap,
  UserCog, CalendarClock, FolderOpen, PlusCircle, SearchCode, DollarSign,
  ExternalLink, Activity, LogOut, Settings2, Server, BarChartBig, Settings, UsersRound, Home, FileText
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Navigation item definitions
const defaultNavItems = [
  { href: '/jobs', label: 'All Jobs', icon: Briefcase },
  { href: '/candidates', label: 'All Candidates', icon: Users },
  { href: '/referrals', label: 'Referrals Program', icon: Gift },
  { href: '/interviews', label: 'AI Interview Analysis', icon: Activity },
];

const candidateNavItems = [
  { href: '/candidates/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/candidates/1', label: 'My Profile', icon: UserCog }, // Points to mock candidate Alice
  { href: '/candidates/my-interviews', label: 'My Interviews', icon: CalendarClock },
  { href: '/candidates/my-documents', label: 'My Documents', icon: FolderOpen },
  { href: '/referrals', label: 'My Referrals', icon: Gift },
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
  { href: '/jobs', label: 'Company Jobs', icon: Briefcase }, // Conceptually filtered
  { href: '/jobs/new', label: 'Post New Job', icon: PlusCircle },
  { href: '/jobs/1/applicants', label: 'Applicants (Demo Job)', icon: UsersRound },
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


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  let currentNavItems = defaultNavItems;
  let currentPersona = "Persona Recruit AI";
  let CurrentPersonaIcon: React.ElementType = Zap; // Uppercase C, this is correct
  let currentDashboardHome = "/jobs";

  // Determine Persona and Navigation based on path
  if (pathname.startsWith('/candidates/dashboard') ||
      pathname.startsWith('/candidates/my-') ||
      pathname.startsWith('/candidates/settings') ||
      (pathname.startsWith('/candidates/') && pathname.endsWith('/edit')) ||
      (pathname.startsWith('/candidates/') && !pathname.endsWith('/new') && !pathname.endsWith('/edit') && pathname.split('/').length === 3)
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
    currentDashboardHome = "/";
  } else if (pathname === '/jobs' || pathname.startsWith('/jobs/') ||
             pathname === '/candidates' || pathname.startsWith('/candidates/new') ||
             pathname === '/referrals' || pathname === '/interviews') {
     currentNavItems = defaultNavItems;
     currentPersona = "Persona Recruit AI";
     CurrentPersonaIcon = Zap;
     currentDashboardHome = "/jobs";
  }


  return (
    <SidebarProvider defaultOpen={!isMobile} open={isMobile ? false : undefined}>
      <div className="flex h-screen bg-background">
        {currentNavItems.length > 0 && (
          <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} side="left" className="border-r">
            <SidebarHeader className="p-3 border-b">
              <Link href={currentDashboardHome} className={cn(
                "flex items-center gap-2.5 p-1 rounded-md transition-colors"
              )}>
                <CurrentPersonaIcon className="h-7 w-7 text-sidebar-primary" /> {/* Ensure this is PascalCase */}
                <span className="font-semibold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:hidden truncate">
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
                      isActive={pathname === item.href || (item.href !== '/' && item.href !=='#' && pathname.startsWith(item.href) )}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
             <SidebarFooter className="p-3 border-t">
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                     <Avatar className="h-8 w-8 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7">
                        <AvatarImage src="https://placehold.co/100x100.png?text=DU" alt="Demo User" data-ai-hint="user avatar" />
                        <AvatarFallback className="text-xs">DU</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden truncate">
                        <span className="text-xs font-medium text-sidebar-foreground truncate">Demo User</span>
                        <span className="text-xs text-sidebar-foreground/70 truncate">demo@example.com</span>
                    </div>
                </div>
                 <Button variant="ghost" size="icon" asChild className="text-sidebar-foreground/70 hover:text-sidebar-foreground group-data-[collapsible=icon]:mt-2 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:h-8">
                    <Link href="/auth"><LogOut className="group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4" /></Link>
                  </Button>
            </SidebarFooter>
          </Sidebar>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="p-3 border-b border-border/30 bg-card/80 backdrop-blur-md flex items-center sticky top-0 z-30 h-14">
            {isMobile && currentNavItems.length > 0 && (
              <SidebarTrigger className="text-foreground mr-2">
                <Menu className="h-6 w-6" />
              </SidebarTrigger>
            )}
            <Link href={currentDashboardHome} className={cn("flex items-center gap-2")}>
              <CurrentPersonaIcon className="h-6 w-6 text-primary" /> {/* Ensure this is PascalCase */}
              <span className="font-semibold text-md text-foreground truncate">
                {currentPersona}
              </span>
            </Link>

            <div className="ml-auto flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/100x100.png?text=DU" alt="Demo User" data-ai-hint="user avatar" />
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
    </SidebarProvider>
  );
}
