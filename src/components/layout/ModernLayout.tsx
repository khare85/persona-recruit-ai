/**
 * Modern Layout System for AI Talent Recruitment Platform
 * Clean, responsive, enterprise-grade layouts
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  Settings, 
  User, 
  LogOut,
  Home,
  Users,
  Briefcase,
  BarChart3,
  MessageSquare,
  Calendar,
  FileText,
  Shield,
  Building2,
  Brain,
  Video,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ModernButton, ModernBadge, ModernCard } from '@/components/ui/modern-design-system';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

// =================================
// NAVIGATION CONFIGURATION
// =================================

const navigationConfig = {
  candidate: [
    { name: 'Dashboard', href: '/candidates/dashboard', icon: Home },
    { name: 'Job Search', href: '/jobs', icon: Search },
    { name: 'Applications', href: '/candidates/my-applications', icon: FileText },
    { name: 'Interviews', href: '/candidates/my-interviews', icon: Video },
    { name: 'Messages', href: '/candidates/messages', icon: MessageSquare },
    { name: 'Profile', href: '/candidates/profile', icon: User },
    { name: 'Settings', href: '/candidates/settings', icon: Settings }
  ],
  recruiter: [
    { name: 'Dashboard', href: '/recruiter/dashboard', icon: Home },
    { name: 'Candidates', href: '/candidates', icon: Users },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Applications', href: '/recruiter/applications', icon: FileText },
    { name: 'Interviews', href: '/recruiter/interviews', icon: Video },
    { name: 'Analytics', href: '/recruiter/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/recruiter/settings', icon: Settings }
  ],
  company_admin: [
    { name: 'Dashboard', href: '/company/dashboard', icon: Home },
    { name: 'Talent Search', href: '/company/talent-search', icon: Search },
    { name: 'Team', href: '/company/team', icon: Users },
    { name: 'Applications', href: '/company/applications', icon: FileText },
    { name: 'Analytics', href: '/company/analytics', icon: BarChart3 },
    { name: 'Billing', href: '/company/billing', icon: TrendingUp },
    { name: 'Settings', href: '/company/settings', icon: Settings }
  ],
  interviewer: [
    { name: 'Dashboard', href: '/interviewer/dashboard', icon: Home },
    { name: 'Interviews', href: '/interviewer/interviews', icon: Video },
    { name: 'Candidates', href: '/interviewer/candidates', icon: Users },
    { name: 'Schedule', href: '/interviewer/schedule', icon: Calendar },
    { name: 'Feedback', href: '/interviewer/feedback', icon: MessageSquare },
    { name: 'Performance', href: '/interviewer/performance', icon: Target },
    { name: 'Settings', href: '/interviewer/settings', icon: Settings }
  ],
  super_admin: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Companies', href: '/admin/companies', icon: Building2 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'AI Analytics', href: '/admin/ai-analytics', icon: Brain },
    { name: 'System', href: '/admin/system', icon: Shield },
    { name: 'Security', href: '/admin/security', icon: Shield },
    { name: 'Settings', href: '/admin/settings', icon: Settings }
  ]
};

// =================================
// MODERN SIDEBAR COMPONENT
// =================================

interface ModernSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

const ModernSidebar = ({ isOpen, onClose, userRole }: ModernSidebarProps) => {
  const pathname = usePathname();
  const navigation = navigationConfig[userRole as keyof typeof navigationConfig] || [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className=\"fixed inset-0 bg-black/50 z-40 lg:hidden\" onClick={onClose} />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        \"fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out\",
        isOpen ? \"translate-x-0\" : \"-translate-x-full\",
        \"lg:translate-x-0 lg:static lg:inset-0\"
      )}>
        <div className=\"flex flex-col h-full\">
          {/* Logo */}
          <div className=\"flex items-center justify-between p-6 border-b border-neutral-200\">
            <div className=\"flex items-center gap-3\">
              <div className=\"w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center\">
                <Brain className=\"w-5 h-5 text-white\" />
              </div>
              <span className=\"text-xl font-bold text-neutral-900\">PersonaAI</span>
            </div>
            <button
              onClick={onClose}
              className=\"lg:hidden p-1 rounded-lg hover:bg-neutral-100\"
            >
              <X className=\"w-5 h-5\" />
            </button>
          </div>

          {/* Navigation */}
          <nav className=\"flex-1 px-4 py-6 space-y-1\">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    \"flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors\",
                    isActive
                      ? \"bg-primary-50 text-primary-700 border-r-2 border-primary-600\"
                      : \"text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900\"
                  )}
                >
                  <item.icon className=\"w-5 h-5\" />
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* User role badge */}
          <div className=\"p-4 border-t border-neutral-200\">
            <ModernBadge variant=\"info\" className=\"w-full justify-center\">
              {userRole.replace('_', ' ').toUpperCase()}
            </ModernBadge>
          </div>
        </div>
      </div>
    </>
  );
};

// =================================
// MODERN HEADER COMPONENT
// =================================

interface ModernHeaderProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
}

const ModernHeader = ({ onMenuClick, title, subtitle }: ModernHeaderProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  return (
    <header className=\"bg-white border-b border-neutral-200 sticky top-0 z-30\">
      <div className=\"flex items-center justify-between px-6 py-4\">
        <div className=\"flex items-center gap-4\">
          <button
            onClick={onMenuClick}
            className=\"lg:hidden p-2 rounded-lg hover:bg-neutral-100\"
          >
            <Menu className=\"w-5 h-5\" />
          </button>
          <div>
            <h1 className=\"text-xl font-semibold text-neutral-900\">{title}</h1>
            {subtitle && (
              <p className=\"text-sm text-neutral-600\">{subtitle}</p>
            )}
          </div>
        </div>

        <div className=\"flex items-center gap-4\">
          {/* Search */}
          <div className=\"hidden md:block relative\">
            <div className=\"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none\">
              <Search className=\"h-4 w-4 text-neutral-400\" />
            </div>
            <input
              type=\"text\"
              placeholder=\"Quick search...\"
              className=\"block w-80 pl-10 pr-3 py-2 border border-neutral-300 rounded-xl text-sm leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent\"
            />
          </div>

          {/* Notifications */}
          <div className=\"relative\">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className=\"p-2 rounded-lg hover:bg-neutral-100 relative\"
            >
              <Bell className=\"w-5 h-5 text-neutral-600\" />
              <span className=\"absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium\">
                3
              </span>
            </button>
            {notificationsOpen && (
              <div className=\"absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-xl shadow-lg z-50\">
                <NotificationCenter />
              </div>
            )}
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className=\"flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100\">
                <Avatar className=\"w-8 h-8\">
                  <AvatarImage src={user?.photoURL || ''} />
                  <AvatarFallback>
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className=\"w-4 h-4 text-neutral-600\" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className=\"w-56\" align=\"end\">
              <div className=\"px-3 py-2 border-b border-neutral-200\">
                <p className=\"text-sm font-medium text-neutral-900\">
                  {user?.displayName || 'User'}
                </p>
                <p className=\"text-xs text-neutral-500\">{user?.email}</p>
              </div>
              <DropdownMenuItem>
                <User className=\"w-4 h-4 mr-2\" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className=\"w-4 h-4 mr-2\" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className=\"w-4 h-4 mr-2\" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

// =================================
// MODERN DASHBOARD LAYOUT
// =================================

interface ModernDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export const ModernDashboardLayout = ({ 
  children, 
  title, 
  subtitle, 
  className 
}: ModernDashboardLayoutProps) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [usePathname()]);

  if (!user) {
    return (
      <div className=\"min-h-screen flex items-center justify-center bg-neutral-50\">
        <div className=\"text-center\">
          <div className=\"w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4\" />
          <p className=\"text-neutral-600\">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-neutral-50 flex\">
      {/* Sidebar */}
      <ModernSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        userRole={user.role || 'candidate'} 
      />

      {/* Main Content */}
      <div className=\"flex-1 flex flex-col lg:ml-64\">
        {/* Header */}
        <ModernHeader 
          onMenuClick={() => setSidebarOpen(true)} 
          title={title}
          subtitle={subtitle}
        />

        {/* Main Content Area */}
        <main className={cn(\"flex-1 p-6\", className)}>
          {children}
        </main>
      </div>
    </div>
  );
};

// =================================
// MODERN PAGE LAYOUT
// =================================

interface ModernPageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const ModernPageLayout = ({ 
  children, 
  title, 
  subtitle, 
  actions, 
  className 
}: ModernPageLayoutProps) => {
  return (
    <div className={cn(\"space-y-6\", className)}>
      {/* Page Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-2xl font-bold text-neutral-900\">{title}</h1>
          {subtitle && (
            <p className=\"text-neutral-600 mt-1\">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className=\"flex items-center gap-3\">
            {actions}
          </div>
        )}
      </div>

      {/* Page Content */}
      <div>
        {children}
      </div>
    </div>
  );
};

// =================================
// MODERN BREADCRUMB COMPONENT
// =================================

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ModernBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const ModernBreadcrumb = ({ items, className }: ModernBreadcrumbProps) => {
  return (
    <nav className={cn(\"flex items-center space-x-2 text-sm text-neutral-500\", className)}>
      {items.map((item, index) => (
        <div key={index} className=\"flex items-center\">
          {index > 0 && (
            <ChevronRight className=\"w-4 h-4 mx-2 text-neutral-400\" />
          )}
          {item.href ? (
            <a
              href={item.href}
              className=\"hover:text-neutral-900 transition-colors\"
            >
              {item.label}
            </a>
          ) : (
            <span className=\"text-neutral-900 font-medium\">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
};

// =================================
// RESPONSIVE HELPERS
// =================================

export const ModernResponsiveContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn(\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\", className)}>
      {children}
    </div>
  );
};

// =================================
// MODERN STAT CARDS
// =================================

interface ModernStatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

export const ModernStatCard = ({ title, value, change, icon: Icon, className }: ModernStatCardProps) => {
  return (
    <ModernCard className={cn(\"relative overflow-hidden\", className)}>
      <div className=\"flex items-center justify-between\">
        <div>
          <p className=\"text-sm font-medium text-neutral-600\">{title}</p>
          <p className=\"text-2xl font-bold text-neutral-900 mt-1\">{value}</p>
          {change && (
            <div className={cn(
              \"flex items-center gap-1 text-sm font-medium mt-2\",
              change.type === 'increase' ? \"text-green-600\" : \"text-red-600\"
            )}>
              <span>{change.type === 'increase' ? '↗' : '↘'}</span>
              <span>{change.value}%</span>
            </div>
          )}
        </div>
        <div className=\"p-3 bg-neutral-100 rounded-xl\">
          <Icon className=\"w-6 h-6 text-neutral-600\" />
        </div>
      </div>
    </ModernCard>
  );
};

// =================================
// EXPORTS
// =================================

export {
  ModernSidebar,
  ModernHeader,
  navigationConfig
};