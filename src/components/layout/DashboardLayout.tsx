
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
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, LayoutDashboard, Building, Gift, Video, ShieldCheck, UserCircle, Menu, Zap, FileText, Settings, UserCog, CalendarClock, FolderOpen, PlusCircle, SearchCode, DollarSign, ExternalLink } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const defaultNavItems = [
  { href: '/jobs', label: 'All Jobs', icon: Briefcase },
  { href: '/candidates', label: 'All Candidates', icon: Users },
  { href: '/referrals', label: 'Referrals Program', icon: Gift },
];

const candidateNavItems = [
  { href: '/candidates/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/candidates/1', label: 'My Profile', icon: UserCog }, // Assuming '1' is the demo candidate ID
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
  { href: '/interviews', label: 'Interview AI Reports', icon: Video }, 
  { href: '/recruiter/dashboard', label: 'Earnings & Payouts', icon: DollarSign }, // Placeholder section on dashboard
];

const companyNavItems = [
  { href: '/company/dashboard', label: 'Company Hub', icon: LayoutDashboard },
  { href: '/jobs', label: 'Manage Company Jobs', icon: Briefcase },
  { href: '/jobs/new', label: 'Post New Job', icon: PlusCircle },
  { href: '/company/ai-talent-search', label: 'AI Talent Search', icon: SearchCode },
  { href: '/company/portal', label: 'Company Job Board', icon: ExternalLink },
  { href: '/company/settings', label: 'Company Settings', icon: Settings },
];

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Super Admin', icon: ShieldCheck },
];


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  let currentNavItems = defaultNavItems; 
  let currentPersona = "Persona Recruit AI";

  if (pathname.startsWith('/candidates/dashboard') || pathname.startsWith('/candidates/my-') || pathname.startsWith('/candidates/settings') || pathname === '/candidates/1') {
    currentNavItems = candidateNavItems;
    currentPersona = "Candidate Portal";
  } else if (pathname.startsWith('/recruiter')) {
    currentNavItems = recruiterNavItems;
    currentPersona = "Recruiter Hub";
  } else if (pathname.startsWith('/company')) {
    currentNavItems = companyNavItems;
    currentPersona = "Company Hub";
  } else if (pathname.startsWith('/admin')) {
    currentNavItems = adminNavItems;
    currentPersona = "Admin Panel";
  } else if (pathname === '/jobs' || pathname.startsWith('/jobs/') || pathname === '/candidates' || pathname.startsWith('/candidates/') && !pathname.startsWith('/candidates/dashboard') && !pathname.startsWith('/candidates/my-') && !pathname.startsWith('/candidates/settings') || pathname === '/referrals' || pathname === '/interviews' || pathname.startsWith('/live-interview')) {
     currentPersona = "Persona Recruit AI"; 
  }


  return (
    <SidebarProvider defaultOpen={!isMobile} open={isMobile ? false : undefined}>
      <div className="flex h-screen bg-background">
        <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} side="left" className="border-r">
          <SidebarHeader className="p-2">
            <Link href="/" className={cn( 
              "flex items-center gap-2.5 p-2 rounded-md transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}>
              <Zap className="h-7 w-7 text-sidebar-primary" />
              <span className="font-semibold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:hidden">
                {currentPersona}
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {currentNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/' && currentNavItems.some(nav => nav.href === item.href && pathname.includes(nav.href)) )}
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
        </Sidebar>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-14 px-4 border-b bg-card sticky top-0 z-30">
            <SidebarTrigger className="text-foreground">
              <Menu className="h-6 w-6" />
            </SidebarTrigger>
            <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline">Demo User</span>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <UserCircle className="h-5 w-5 text-foreground" />
                </Button>
            </div>
          </header>
          <SidebarInset className="flex-1 overflow-y-auto p-0">
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                 {children}
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
