
"use client";

import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 cursor-pointer group">
            <UserPlus className="h-8 w-8 text-primary transition-transform duration-300 ease-out group-hover:rotate-[15deg]" />
            <span className="text-2xl font-headline font-semibold text-primary group-hover:text-primary/90 transition-colors">
              Persona Recruit AI
            </span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button variant="outline">
                Sign In / Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
