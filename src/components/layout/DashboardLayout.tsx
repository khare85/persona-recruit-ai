
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
  ExternalLink, Activity, LogOut, LineChart, UsersRound, Settings2, Server, BarChartBig, Settings
} from 'lucide-react'; // Added Settings
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
  // Adding a conceptual settings link for recruiters
  { href: '#recruiter-settings', label: 'Settings', icon: Settings }, 
];

const companyNavItems = [
  { href: '/company/dashboard', label: 'Company Hub', icon: LayoutDashboard },
  { href: '/jobs', label: 'Company Jobs', icon: Briefcase }, // Clarified label
  { href: '/jobs/new', label: 'Post New Job', icon: PlusCircle },
  { href: '/company/ai-talent-search', label: 'AI Talent Search', icon: SearchCode },
  { href: '/company/portal', label: 'Company Job Board', icon: ExternalLink },
  { href: '/company/settings', label: 'Company Settings', icon: Settings2 },
];

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Super Admin', icon: ShieldCheck },
  { href: '#admin-users', label: 'User Management', icon: UsersRound }, // Changed icon
  { href: '#admin-companies', label: 'Company Management', icon: Building }, 
  { href: '#admin-analytics', label: 'Platform Analytics', icon: BarChartBig }, 
  { href: '#admin-system', label: 'System Health', icon: Server }, 
  { href: '#admin-billing', label: 'Billing & Subs', icon: DollarSign }, 
  { href: '#admin-settings', label: 'Platform Settings', icon: Settings }, 
];


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  let currentNavItems = defaultNavItems; 
  let currentPersona = "Persona Recruit AI";
  let currentPersonaIcon: React.ElementType = Zap; 
  let currentDashboardHome = "/jobs";

  if (pathname.startsWith('/candidates/dashboard') || pathname.startsWith('/candidates/my-') || pathname.startsWith('/candidates/settings') || pathname.startsWith('/candidates/1') || pathname === '/candidates/new') {
    currentNavItems = candidateNavItems;
    currentPersona = "Candidate Portal";
    currentPersonaIcon = UserCog;
    currentDashboardHome = "/candidates/dashboard";
  } else if (pathname.startsWith('/recruiter')) {
    currentNavItems = recruiterNavItems;
    currentPersona = "Recruiter Hub";
    currentPersonaIcon = UsersRound; 
    currentDashboardHome = "/recruiter/dashboard";
  } else if (pathname.startsWith('/company')) {
    currentNavItems = companyNavItems;
    currentPersona = "Company Hub";
    currentPersonaIcon = Building;
    currentDashboardHome = "/company/dashboard";
  } else if (pathname.startsWith('/admin')) {
    currentNavItems = adminNavItems;
    currentPersona = "Admin Panel";
    currentPersonaIcon = ShieldCheck;
    currentDashboardHome = "/admin/dashboard";
  } else if (pathname.startsWith('/live-interview')) {
    currentNavItems = []; 
    currentPersona = "Live Interview";
    currentPersonaIcon = Video;
    currentDashboardHome = "/"; // Or a relevant dashboard if applicable post-interview
  } else if (pathname === '/jobs' || pathname.startsWith('/jobs/') || pathname === '/candidates' || pathname === '/referrals' || pathname === '/interviews' ) {
     currentNavItems = defaultNavItems; // Reset to default for general app pages
     currentPersona = "Persona Recruit AI"; 
     currentPersonaIcon = Zap;
     currentDashboardHome = "/jobs"; // Default home for general app view
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
                <currentPersonaIcon className="h-7 w-7 text-sidebar-primary" />
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
              {/* Content for EXPANDED sidebar */}
              <div className="group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:hidden">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://placehold.co/100x100.png?text=DU" alt="Demo User" data-ai-hint="user avatar" />
                    <AvatarFallback>DU</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-sidebar-foreground">Demo User</p>
                    <p className="text-xs text-muted-foreground">user@example.com</p>
                  </div>
                  <Button variant="ghost" size="icon" asChild className="ml-auto text-muted-foreground hover:text-sidebar-foreground">
                    <Link href="/auth"><LogOut className="h-5 w-5" /></Link>
                  </Button>
                </div>
              </div>

              {/* Content for COLLAPSED sidebar (ICON-ONLY) */}
              <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center space-y-2 py-1">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://placehold.co/100x100.png?text=DU" alt="Demo User" data-ai-hint="user avatar" />
                  <AvatarFallback>DU</AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-sidebar-foreground w-full">
                  <Link href="/auth" className="flex justify-center"><LogOut className="h-5 w-5" /></Link>
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>
        )}
        
        <div className="flex flex-col flex-1 overflow-hidden">
            {isMobile && currentNavItems.length > 0 && (
              <div className="p-3 border-b bg-card md:hidden flex items-center sticky top-0 z-40">
                <SidebarTrigger className="text-foreground">
                  <Menu className="h-6 w-6" />
                </SidebarTrigger>
                 <Link href={currentDashboardHome} className={cn( 
                    "flex items-center gap-2 ml-3"
                  )}>
                    <currentPersonaIcon className="h-6 w-6 text-primary" />
                    <span className="font-semibold text-md text-foreground truncate">
                      {currentPersona}
                    </span>
                  </Link>
              </div>
            )}
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

