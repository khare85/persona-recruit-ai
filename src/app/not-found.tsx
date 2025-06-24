import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="flex flex-col items-center space-y-6 text-center max-w-md">
        <div className="text-9xl font-bold text-primary/20">404</div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/jobs">
              <Search className="mr-2 h-4 w-4" />
              Search Jobs
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}