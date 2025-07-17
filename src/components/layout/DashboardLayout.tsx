
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  
  // This component will now just provide the main layout structure.
  // The header is handled by the main Navbar in the root layout.
  // The sidebar logic is also centralized there now.
  
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  // Determine the correct dashboard for sidebar logic
  const sidebarComponent = null;

  if (pathname.startsWith('/admin')) {
    // Admin specific sidebar or layout adjustments can go here
  } else if (pathname.startsWith('/company')) {
    // Company specific
  } else if (pathname.startsWith('/recruiter')) {
    // Recruiter specific
  } else if (pathname.startsWith('/interviewer')) {
    // Interviewer specific
  } else if (pathname.startsWith('/candidates')) {
    // Candidate specific
  }

  return (
    <div className="flex h-screen bg-background">
      {/* 
        The sidebar is now handled by the new ClientLayoutWrapper and Navbar,
        so we no longer render it directly here. This simplifies the layout
        and ensures consistency. The Navbar will render the appropriate sidebar
        based on the user's role and the current path.
      */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
