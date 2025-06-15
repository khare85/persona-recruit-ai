
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
  SidebarFooter, // Added SidebarFooter
} from "@/components/ui/sidebar"; // Assuming SidebarFooter is exported from here
import { Button } from "@/components/ui/button";
import { 
  Briefcase, Users, LayoutDashboard, Building, Gift, Video, ShieldCheck, UserCircle, Menu, Zap, 
  FileText, Settings, UserCog, CalendarClock, FolderOpen, PlusCircle, SearchCode, DollarSign, 
  ExternalLink, Activity, LogOut, LineChart, UsersRound, Settings2, Server, BarChartBig
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const defaultNavItems = [
  { href: '/jobs', label: 'All Jobs', icon: Briefcase },
  { href: '/candidates', label: 'All Candidates', icon: Users },
  { href: '/referrals', label: 'Referrals Program', icon: Gift },
];

const candidateNavItems = [
  { href: '/candidates/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/candidates/1', label: 'My Profile', icon: UserCog }, 
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
  { href: '/interviews', label: 'AI Interview Analysis', icon: Video }, 
];

const companyNavItems = [
  { href: '/company/dashboard', label: 'Company Hub', icon: LayoutDashboard },
  { href: '/jobs', label: 'Manage Company Jobs', icon: Briefcase },
  { href: '/jobs/new', label: 'Post New Job', icon: PlusCircle },
  { href: '/company/ai-talent-search', label: 'AI Talent Search', icon: SearchCode },
  // Removed /company/applicants for now to keep focus, can be added later
  // { href: '/company/applicants', label: 'All Applicants', icon: UsersRound }, 
  { href: '/company/portal', label: 'Company Job Board', icon: ExternalLink },
  { href: '/company/settings', label: 'Company Settings', icon: Settings2 },
];

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Super Admin', icon: ShieldCheck },
  { href: '#admin-users', label: 'User Management', icon: Users }, // Conceptual link
  { href: '#admin-companies', label: 'Company Management', icon: Building }, // Conceptual link
  { href: '#admin-analytics', label: 'Platform Analytics', icon: BarChartBig }, // Conceptual link
  { href: '#admin-system', label: 'System Health', icon: Server }, // Conceptual link
  { href: '#admin-billing', label: 'Billing & Subs', icon: DollarSign }, // Conceptual link
  { href: '#admin-settings', label: 'Platform Settings', icon: Settings }, // Conceptual link
];


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  let currentNavItems = defaultNavItems; 
  let currentPersona = "Persona Recruit AI";
  let currentPersonaIcon: React.ElementType = Zap; // Default icon

  if (pathname.startsWith('/candidates/dashboard') || pathname.startsWith('/candidates/my-') || pathname.startsWith('/candidates/settings') || pathname.startsWith('/candidates/1') || pathname === '/candidates/new') {
    currentNavItems = candidateNavItems;
    currentPersona = "Candidate Portal";
    currentPersonaIcon = UserCog;
  } else if (pathname.startsWith('/recruiter')) {
    currentNavItems = recruiterNavItems;
    currentPersona = "Recruiter Hub";
    currentPersonaIcon = UsersRound; 
  } else if (pathname.startsWith('/company')) {
    currentNavItems = companyNavItems;
    currentPersona = "Company Hub";
    currentPersonaIcon = Building;
  } else if (pathname.startsWith('/admin')) {
    currentNavItems = adminNavItems;
    currentPersona = "Admin Panel";
    currentPersonaIcon = ShieldCheck;
  } else if (pathname.startsWith('/live-interview')) {
    currentNavItems = []; 
    currentPersona = "Live Interview";
    currentPersonaIcon = Video;
  } else if (pathname === '/jobs' || pathname.startsWith('/jobs/') || pathname === '/candidates' || pathname === '/referrals' || pathname === '/interviews' ) {
     currentPersona = "Persona Recruit AI"; 
     currentPersonaIcon = Zap;
  }


  return (
    <SidebarProvider defaultOpen={!isMobile} open={isMobile ? false : undefined}>
      <div className="flex h-screen bg-background">
        {currentNavItems.length > 0 && ( 
          <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} side="left" className="border-r">
            <SidebarHeader className="p-3 border-b">
              <Link href="/" className={cn( 
                "flex items-center gap-2.5 p-1 rounded-md transition-colors"
                // "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" // Keep or remove based on visual preference
              )}>
                <currentPersonaIcon className="h-7 w-7 text-sidebar-primary" />
                <span className="font-semibold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:hidden truncate">
                  {currentPersona}
                </span>
              </Link>
            </SidebarHeader>
            <SidebarContent className="p-2 flex-1"> {/* flex-1 to push footer down */}
              <SidebarMenu>
                {currentNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && currentNavItems.some(nav => nav.href === item.href && pathname.includes(nav.href)) )}
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
                <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="https://placehold.co/100x100.png?text=DU" alt="Demo User" data-ai-hint="user avatar" />
                        <AvatarFallback>DU</AvatarFallback>
                    </Avatar>
                    <div className="group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:hidden">
                        <p className="text-sm font-medium text-sidebar-foreground">Demo User</p>
                        <p className="text-xs text-muted-foreground">user@example.com</p>
                    </div>
                     <Button variant="ghost" size="icon" className="ml-auto group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:hidden text-muted-foreground hover:text-sidebar-foreground">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
                <Button variant="ghost" size="icon" className="w-full mt-2 group-data-[collapsible=icon]:block group-data-[collapsible=offcanvas]:block hidden text-muted-foreground hover:text-sidebar-foreground">
                     <LogOut className="h-5 w-5" /> {/* Icon-only logout for collapsed sidebar */}
                </Button>
            </SidebarFooter>
          </Sidebar>
        )}
        
        <div className="flex flex-col flex-1 overflow-hidden">
           {/* Mobile-only Sidebar Trigger, placed at the top of the content area */}
            {isMobile && currentNavItems.length > 0 && (
              <div className="p-3 border-b bg-card md:hidden">
                <SidebarTrigger className="text-foreground">
                  <Menu className="h-6 w-6" />
                </SidebarTrigger>
              </div>
            )}
          <main className="flex-1 overflow-y-auto"> {/* Changed from SidebarInset */}
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                 {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
