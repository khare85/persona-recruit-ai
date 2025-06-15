
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/shared/Container';
import Image from 'next/image';
import { ArrowRight, LogIn, PlayCircle, Users, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 lg:py-40 flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
        <Container className="z-10 text-center">
          <Zap className="mx-auto h-16 w-16 text-primary mb-6 animate-bounce" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold tracking-tight text-foreground">
            Welcome to <span className="text-primary">AI Talent Stream</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            The intelligent platform revolutionizing recruitment. Find, assess, and hire top talent faster and smarter.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/auth" passHref>
              <Button size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-primary/30 transition-shadow">
                <LogIn className="mr-2 h-5 w-5" /> Login
              </Button>
            </Link>
             <Link href="/auth" passHref> {/* Assuming sign up is on the same page with a tab */}
              <Button size="lg" variant="outline" className="w-full sm:w-auto shadow-lg hover:shadow-accent/30 transition-shadow">
                <Users className="mr-2 h-5 w-5" /> Sign Up
              </Button>
            </Link>
            <Link href="/jobs" passHref> {/* "Explore Demo" now directly takes to jobs or a central dashboard */}
              <Button size="lg" variant="secondary" className="w-full sm:w-auto shadow-lg hover:shadow-secondary/40 transition-shadow">
                <PlayCircle className="mr-2 h-5 w-5" /> Explore Demo
              </Button>
            </Link>
          </div>
           <p className="mt-8 text-sm text-muted-foreground">
            Click "Explore Demo" to see features with sample data.
          </p>
        </Container>
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0 opacity-10">
            <Image src="https://placehold.co/1200x800.png?text=+" data-ai-hint="abstract network" alt="Abstract background" layout="fill" objectFit="cover" className="blur-sm" />
        </div>
      </section>

      {/* Minimal Feature Highlight (Optional) */}
      <section className="py-16 bg-background">
        <Container>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-primary mb-2">Smart Candidate Matching</h3>
              <p className="text-muted-foreground text-sm">AI-driven recommendations to find the perfect fit.</p>
            </div>
            <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-primary mb-2">AI Interview Analysis</h3>
              <p className="text-muted-foreground text-sm">In-depth insights from video interviews.</p>
            </div>
            <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold text-primary mb-2">Efficient Workflows</h3>
              <p className="text-muted-foreground text-sm">Streamline your entire hiring process.</p>
            </div>
          </div>
        </Container>
      </section>
      
      <section className="py-12 text-center bg-muted/40">
          <Container>
            <p className="text-muted-foreground">
                Ready to get started? <Link href="/auth" className="text-primary font-semibold hover:underline">Create an account</Link> or <Link href="/jobs" className="text-primary font-semibold hover:underline">explore the demo</Link>.
            </p>
          </Container>
      </section>
    </div>
  );
}
