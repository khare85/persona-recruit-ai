
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
  // SidebarFooter, // Example if needed
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { FileText, Briefcase, Users, LayoutDashboard, Building, Gift, Video, ShieldCheck, UserCircle, Menu } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile"; // To handle mobile sidebar behavior

const appNavItems = [
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/candidates', label: 'Candidates', icon: Users },
  { href: '/recruiter/dashboard', label: 'Recruiter Hub', icon: LayoutDashboard },
  { href: '/company/dashboard', label: 'Company Hub', icon: Building },
  { href: '/referrals', label: 'Referrals', icon: Gift },
  { href: '/interviews', label: 'Interview AI', icon: Video },
  { href: '/admin/dashboard', label: 'Admin', icon: ShieldCheck },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile(); // Hook to detect mobile state

  return (
    <SidebarProvider defaultOpen={!isMobile} open={isMobile ? false : undefined}>
      <div className="flex h-screen bg-background"> {/* Ensure full height */}
        <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} side="left" className="border-r">
          <SidebarHeader className="p-2">
            <Link href="/jobs" className={cn(
              "flex items-center gap-2.5 p-2 rounded-md transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}>
              <FileText className="h-7 w-7 text-sidebar-primary" />
              <span className="font-semibold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden group-data-[collapsible=offcanvas]:hidden">
                AI Talent Stream
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-2"> {/* Added padding to content */}
            <SidebarMenu>
              {appNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
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
          {/* 
          <SidebarFooter className="p-2 mt-auto"> 
            <SidebarMenu>
                <SidebarMenuItem>
                     <SidebarMenuButton asChild>
                        <Link href="/settings"> 
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter> 
          */}
        </Sidebar>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-14 px-4 border-b bg-card sticky top-0 z-30">
            <SidebarTrigger className="text-foreground">
              <Menu className="h-6 w-6" />
            </SidebarTrigger>
            <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline">Demo User</span> {/* Placeholder */}
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <UserCircle className="h-5 w-5 text-foreground" />
                </Button>
            </div>
          </header>
          <SidebarInset className="flex-1 overflow-y-auto p-0"> {/* Ensure content area scrolls */}
             {/* Container removed from individual pages and applied here for consistent padding */}
            <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                 {children}
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
