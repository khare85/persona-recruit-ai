
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { roleNavigation } from '@/utils/roleRedirection';
import { 
  Building,
  Users,
  Briefcase,
  UserCog,
  ShieldCheck,
  MessageSquare,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="90" fill="url(#paint0_linear_1_2)"/>
    <path d="M100 20C144.183 20 180 55.8172 180 100C180 144.183 144.183 180 100 180C55.8172 180 20 144.183 20 100C20 55.8172 55.8172 20 100 20Z" stroke="white" strokeWidth="4"/>
    <path d="M130.355 69.6447C149.127 88.4168 149.127 111.583 130.355 130.355C111.583 149.127 88.4168 149.127 69.6447 130.355C50.8726 111.583 50.8726 88.4168 69.6447 69.6447C88.4168 50.8726 111.583 50.8726 130.355 69.6447Z" fill="white"/>
    <path d="M100 35C135.901 35 165 64.0995 165 100C165 135.901 135.901 165 100 165C64.0995 165 35 135.901 35 100C35 64.0995 64.0995 35 100 35Z" stroke="url(#paint1_linear_1_2)" strokeWidth="10"/>
    <path d="M123.536 76.4645C136.728 89.6568 136.728 110.343 123.536 123.536C110.343 136.728 89.6568 136.728 76.4645 123.536C63.2721 110.343 63.2721 89.6568 76.4645 76.4645C89.6568 63.2721 110.343 63.2721 123.536 76.4645Z" fill="url(#paint2_linear_1_2)"/>
    <defs>
    <linearGradient id="paint0_linear_1_2" x1="100" y1="10" x2="100" y2="190" gradientUnits="userSpaceOnUse">
    <stop stopColor="#38A169"/>
    <stop offset="1" stopColor="#319795"/>
    </linearGradient>
    <linearGradient id="paint1_linear_1_2" x1="100" y1="30" x2="100" y2="170" gradientUnits="userSpaceOnUse">
    <stop stopColor="#68D391"/>
    <stop offset="1" stopColor="#4FD1C5"/>
    </linearGradient>
    <linearGradient id="paint2_linear_1_2" x1="100" y1="70" x2="100" y2="130" gradientUnits="userSpaceOnUse">
    <stop stopColor="#3B82F6"/>
    <stop offset="1" stopColor="#8B5CF6"/>
    </linearGradient>
    </defs>
  </svg>
);

const UserNav = () => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const displayName = user.fullName || user.displayName || `${user.firstName} ${user.lastName}`;
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const roleNavItems = [
    { href: roleNavigation.getDashboardPath(user.role), label: 'My Dashboard', icon: LayoutDashboard },
    { href: `/candidates/profile`, label: 'My Profile', icon: UserCog },
    { href: `/recruiter/jobs`, label: 'My Jobs', icon: Briefcase },
    { href: `/company/settings`, label: 'Company Settings', icon: Building },
    { href: `/interviewer/schedule`, label: 'My Schedule', icon: CalendarDays },
    { href: `/admin/dashboard`, label: 'Admin Panel', icon: ShieldCheck },
  ].filter(item => roleNavigation.hasAccessToPath(user.role, item.href));
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&size=40`} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roleNavItems.map(item => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} className="flex items-center">
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const publicNavLinks = [
    { href: '/jobs', label: 'Find Jobs' },
    { href: '/candidates', label: 'Find Candidates' },
    { href: '/about', label: 'About Us' },
    { href: '/support', label: 'Support' }
  ];

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 cursor-pointer group">
            <Logo />
            <span className="text-2xl font-headline font-semibold text-primary group-hover:text-primary/90 transition-colors">
              Persona AI
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            {publicNavLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center space-x-4">
            {loading ? null : user ? (
              <UserNav />
            ) : (
              <>
                <Link href={`/auth?redirect=${pathname}`}>
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href={`/auth/register/candidate?redirect=${pathname}`}>
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
