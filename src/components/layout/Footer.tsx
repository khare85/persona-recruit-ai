
export function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Persona Recruit AI. All rights reserved.
        </p>
        <p className="text-xs mt-1">
          Accelerating recruitment with the power of AI.
        </p>
      </div>
    </footer>
  );
}
