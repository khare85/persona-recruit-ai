
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Users, FileText, Gift, Video, Zap, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Home', icon: Zap },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/candidates', label: 'Candidates', icon: Users },
  { href: '/recruiter/dashboard', label: 'Recruiter Hub', icon: LayoutDashboard },
  { href: '/referrals', label: 'Referrals', icon: Gift },
  { href: '/interviews', label: 'Interview AI', icon: Video },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" passHref>
            <div className="flex items-center space-x-2 cursor-pointer group">
              <FileText className="h-8 w-8 text-primary transition-transform duration-300 ease-out group-hover:rotate-[15deg]" />
              <span className="text-2xl font-headline font-semibold text-primary group-hover:text-primary/90 transition-colors">
                AI Talent Stream
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "font-medium text-foreground/70 hover:text-primary hover:bg-primary/10 px-3 py-2 text-sm",
                    pathname === item.href && "text-primary bg-primary/10",
                    pathname.startsWith(item.href) && item.href !== '/' && "text-primary bg-primary/10", // Highlight parent routes
                    "transition-all duration-200 ease-out"
                  )}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center space-x-2">
             <Link href="/jobs/new" passHref>
                <Button variant="default" size="sm">
                   Post a Job
                </Button>
              </Link>
              <Link href="/candidates/new" passHref>
                <Button variant="outline" size="sm">
                    Join Us
                </Button>
              </Link>
          </div>
          {/* Mobile Menu Button (optional, can be added later) */}
          {/* <div className="md:hidden">...</div> */}
        </div>
      </div>
    </header>
  );
}
