
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  // Hide footer on certain pages
  const hiddenPaths = [
    '/auth',
    '/interview/live',
    '/admin',
    '/recruiter',
    '/interviewer',
    '/company',
    '/candidates'
  ];

  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null;
  }
  
  return (
    <footer className="bg-muted/50 border-t border-border mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Persona AI. All rights reserved.
        </p>
        <div className="text-xs mt-2 space-x-4">
          <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
          <span>•</span>
          <Link href="/support" className="hover:text-primary">Support</Link>
        </div>
      </div>
    </footer>
  );
}
