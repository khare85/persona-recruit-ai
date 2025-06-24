import { Loader2 } from 'lucide-react';

export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Preparing authentication...</p>
      </div>
    </div>
  );
}