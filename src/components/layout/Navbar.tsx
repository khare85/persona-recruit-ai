
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, LogIn, UserPlus, LogOut, LayoutDashboard } from 'lucide-react'; // Changed icon for branding, added LogOut, LayoutDashboard
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

export function Navbar() {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="bg-card shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" passHref>
            <div className="flex items-center space-x-2 cursor-pointer group">
              <Zap className="h-8 w-8 text-primary transition-transform duration-300 ease-out group-hover:rotate-[15deg]" />
              <span className="text-2xl font-headline font-semibold text-primary group-hover:text-primary/90 transition-colors">
                Persona Recruit AI
              </span>
            </div>
          </Link>
          
          <div className="flex items-center space-x-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : user ? (
              <>
                <Link href="/candidates/dashboard" passHref> {/* Example: Default dashboard link */}
                  <Button variant="ghost" size="sm">
                     <LayoutDashboard className="mr-2 h-4 w-4" /> My Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth" passHref>
                  <Button variant="default" size="sm">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Button>
                </Link>
                <Link href="/auth" passHref>
                  <Button variant="outline" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" /> Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
