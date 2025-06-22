'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu,
  ShieldCheck,
  Users,
  Building,
  BarChart3,
  Server,
  Settings,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  Database,
  Activity,
  Globe,
  Lock,
  FileText,
  UserCog,
  Mail,
  Bell,
  TrendingUp,
  Monitor,
  Shield
} from 'lucide-react';

interface AdminSidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
}

const adminSidebarItems: AdminSidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: ShieldCheck,
    description: 'Overview and quick actions'
  },
  {
    title: 'Company Management',
    href: '/admin/company-management',
    icon: Building,
    description: 'Create and manage companies'
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    description: 'Manage candidates and recruiters'
  },
  {
    title: 'Company Management',
    href: '/admin/companies',
    icon: Building,
    description: 'Manage company accounts'
  },
  {
    title: 'Analytics & Reports',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Platform usage and metrics'
  },
  {
    title: 'System Health',
    href: '/admin/system',
    icon: Server,
    description: 'Monitor system status'
  },
  {
    title: 'Job Management',
    href: '/admin/jobs',
    icon: FileText,
    description: 'Oversee all job postings'
  },
  {
    title: 'Support Tickets',
    href: '/admin/support',
    icon: MessageSquare,
    description: 'Customer support management',
    badge: '5'
  },
  {
    title: 'Billing & Payments',
    href: '/admin/billing',
    icon: CreditCard,
    description: 'Revenue and subscriptions'
  },
  {
    title: 'Security & Compliance',
    href: '/admin/security',
    icon: Lock,
    description: 'Security settings and audit logs'
  },
  {
    title: 'Database Management',
    href: '/admin/database',
    icon: Database,
    description: 'Database operations and backups'
  },
  {
    title: 'AI Configuration',
    href: '/admin/ai-config',
    icon: Activity,
    description: 'AI models and configurations'
  },
  {
    title: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    description: 'System-wide notifications'
  },
  {
    title: 'Platform Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Global platform configuration'
  }
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Admin Header */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Super Admin</span>
            <span className="text-xs text-muted-foreground">System Control</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {adminSidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  )}
                </div>
                {item.badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3 rounded-lg bg-muted/50 p-3">
          <Monitor className="h-4 w-4 text-green-600" />
          <div className="flex-1 text-xs">
            <div className="font-medium">System Status</div>
            <div className="text-muted-foreground">All systems operational</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden w-80 border-r bg-card lg:block">
          <SidebarContent />
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Mobile header */}
          <header className="flex h-16 items-center border-b px-4 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <div className="ml-4 flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span className="font-semibold">Super Admin</span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}