"use client";

import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface JobDetailsActionsProps {
  jobId: string;
}

export function JobDetailsActions({ jobId }: JobDetailsActionsProps) {
  const { user } = useAuth();
  
  // Only show View Applicants button for recruiters, company admins, and super admins
  if (user?.role === 'recruiter' || user?.role === 'company_admin' || user?.role === 'super_admin') {
    return (
      <>
        <Link href={`/jobs/${jobId}/applicants`} passHref>
          <Button variant="ghost" className="w-full">
            <Users className="mr-2 h-4 w-4" />
            View Applicants
          </Button>
        </Link>
      </>
    );
  }
  
  // Don't show anything for candidates or unauthenticated users
  return null;
}