import { Loader2, Users } from 'lucide-react';

export default function CandidatesLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Users className="h-8 w-8 text-primary opacity-50" />
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading candidate portal...</p>
      </div>
    </div>
  );
}